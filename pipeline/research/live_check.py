#!/usr/bin/env python3
"""Did each published / scheduled Short really go live on YouTube? (runs after research.py --stats)

Matches jobs to our public videos in docs/research/own_videos.json by title.
- found      -> jobs[id].yt_video_id, yt_live_at, and a progress note "✅ YouTube par LIVE" (the bot posts it to Slack)
- not found 60 min after the slot -> one warning note (yt_alert) so the owner checks Zapier
- live on YouTube but not yet on Instagram/Facebook -> queued in feed/reels.xml + feed/facebook.xml (Zaps post them),
  only inside a posting window (config.social_windows_pkt, default 05:00-08:00 and 19:00-22:00 PKT) and at most one per
  window: today's fresh video first, otherwise the oldest one that was missed. This is the safety net for the 04:40
  publish run (on 13 Nov the old laptop n8n published 003 and its Instagram/Facebook step crashed).
Only jobs due in the last 3 days. Edits state.json in place; the workflow commits it.
"""
import json, os, datetime as dt

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
now = dt.datetime.now(dt.timezone.utc)
iso = lambda t: dt.datetime.fromisoformat(t.replace('Z', '+00:00'))
stamp = now.strftime('%Y-%m-%dT%H:%M:%SZ')

st = json.load(open(os.path.join(ROOT, 'state.json')))
own = json.load(open(os.path.join(ROOT, 'docs/research/own_videos.json')))
norm = lambda s: ' '.join(str(s).lower().split())
by_title = {norm(v.get('title', '')): vid for vid, v in (own.get('videos') or {}).items()}

def note(j, msg):
    j.setdefault('progress', []).append({'t': stamp, 'msg': msg})
    j['progress'] = j['progress'][-40:]
    j['progress_count'] = j.get('progress_count', 0) + 1

def queue_thumb(jid, vid, j):
    """Add the video to feed/thumbs.xml; the Zap "Sneaky Deals -> YouTube thumbnail" sets it (YouTube only keeps a
    Short's custom thumbnail when it is set after processing, so the upload Zap's own thumbnail does not stick)."""
    if j.get('thumb_queued_at') or not os.path.exists(os.path.join(ROOT, 'jobs', jid, 'thumbnail.jpg')):
        return
    from email.utils import formatdate
    fp = os.path.join(ROOT, 'feed/thumbs.xml')
    feed = open(fp).read()
    if f'>{vid}</title>' in feed:
        j['thumb_queued_at'] = stamp; return
    u = f'https://raw.githubusercontent.com/Ghazanaqeel7/sneakydeals-pipeline/main/jobs/{jid}/thumbnail.jpg'
    item = (f'<item>\n<title>{vid}</title>\n<description>{jid}</description>\n<link>{u}</link>\n'
            f'<guid isPermaLink="false">thumb-{jid}</guid>\n<pubDate>{formatdate(usegmt=True)}</pubDate>\n'
            f'<enclosure url="{u}" type="image/jpeg" length="0"/>\n</item>\n')
    open(fp, 'w').write(feed.replace('<!--ITEMS-->', '<!--ITEMS-->\n' + item, 1))
    j['thumb_queued_at'] = stamp

changed = False
for jid, j in st.get('jobs', {}).items():
    if not jid[:1].isdigit() or j.get('yt_live_at'):
        continue
    due = j.get('yt_scheduled_for') or (j.get('published_at') if j.get('status') == 'published' else None)
    if not due:
        continue
    due = iso(due)
    if now < due or now - due > dt.timedelta(days=3):
        continue
    try:
        title = json.load(open(os.path.join(ROOT, 'jobs', jid, 'meta.json'))).get('title', '')
    except Exception:
        continue
    vid = by_title.get(norm(title))
    if vid:
        j['yt_video_id'] = vid; j['yt_live_at'] = stamp
        note(j, f'✅ LIVE on YouTube: "{title}" https://youtu.be/{vid}')
        queue_thumb(jid, vid, j)
        if j.get('type') == 'long' and j.get('status') == 'video_approved':
            j['status'] = 'published'; j['published_at'] = stamp   # long videos have no 04:40 publish run
        changed = True
    elif now - due > dt.timedelta(minutes=60) and not j.get('yt_alert'):
        j['yt_alert'] = stamp
        note(j, f'⚠️ "{title}" is still not public on YouTube 1 hour after its slot. Check Zapier > Zap history (YouTube).')
        changed = True

# ---------------- Instagram + Facebook safety net ----------------
import re
from email.utils import formatdate

def tag_line(tags, mx):
    tags = tags if isinstance(tags, list) else re.split(r'[\s,]+', str(tags or ''))
    tags = [str(t).strip() for t in tags if str(t).strip()]
    return ' '.join((t if t.startswith('#') else '#' + t) for t in tags[:mx])

def cap2200(c):
    return c if len(c) <= 2200 else re.sub(r'\s+\S*$', '', c[:2190]) + '…'

def reels_caption(meta):
    if meta.get('reels_caption'): return str(meta['reels_caption'])[:2200]
    out, tags = [], []
    for p in [x.strip() for x in re.split(r'\n\s*\n', str(meta.get('description', ''))) if x.strip()]:
        if re.fullmatch(r'(#\w+\s*)+', p): tags = [t for t in re.findall(r'#\w+', p) if t.lower() != '#shorts']; continue
        if p.startswith('🔔') or re.search('subscribe', p, re.I): out.append('🔔 Follow for a new sneaky deal every day.'); continue
        out.append(p)
    if meta.get('pinned_comment'): out.append('💬 ' + meta['pinned_comment'])
    if tags: out.append(' '.join(tags[:5]))
    return cap2200('\n\n'.join(out))

def ig_caption(meta):
    ig = meta.get('instagram') or {}
    if ig.get('caption'): return cap2200('\n\n'.join(x for x in [str(ig['caption']).strip(), tag_line(ig.get('hashtags'), 5)] if x))
    return reels_caption(meta)

def fb_post(meta):
    fb = meta.get('facebook') or {}
    body = '\n\n'.join(x for x in [str(fb['description']).strip(), tag_line(fb.get('hashtags'), 3)] if x) if fb.get('description') else ig_caption(meta)
    return str(fb.get('title') or meta.get('title', ''))[:250], cap2200(body)

def esc(x): return str(x).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

def add_item(path, jid, title, body, thumb, video):
    fp = os.path.join(ROOT, path); feed = open(fp).read()
    if f'<guid isPermaLink="false">{esc(jid)}</guid>' in feed: return
    item = (f'<item>\n<title>{esc(title)}</title>\n<description><![CDATA[{body.replace("]]>", "")}]]></description>\n'
            f'<link>{esc(thumb)}</link>\n<guid isPermaLink="false">{esc(jid)}</guid>\n<pubDate>{formatdate(usegmt=True)}</pubDate>\n'
            f'<enclosure url="{esc(video)}" type="video/mp4" length="0"/>\n</item>\n')
    open(fp, 'w').write(feed.replace('<!--ITEMS-->', '<!--ITEMS-->\n' + item, 1))

def social_window(cfg):
    pkt = now + dt.timedelta(hours=5)
    for a, b in cfg.get('social_windows_pkt') or [['05:00', '08:00'], ['19:00', '22:00']]:
        ah, am = map(int, a.split(':')); bh, bm = map(int, b.split(':'))
        start = pkt.replace(hour=ah, minute=am, second=0, microsecond=0)
        if start <= pkt < pkt.replace(hour=bh, minute=bm, second=0, microsecond=0):
            return start - dt.timedelta(hours=5)   # window start in UTC
    return None

cfg = st.get('config') or {}
win = social_window(cfg) if cfg.get('reels') is not False else None
if win:
    jobs = st.get('jobs', {})
    done_now = any(j.get('reels_at') and iso(j['reels_at']) >= win for j in jobs.values())
    todo = [(jid, j) for jid, j in jobs.items()
            if jid[:1].isdigit() and j.get('type') != 'long' and not j.get('demo') and j.get('yt_live_at')
            and not (j.get('ig_at') or j.get('fb_at') or j.get('reels_at')) and now - iso(j['yt_live_at']) < dt.timedelta(days=4)
            and (j.get('video_url_direct') or j.get('video_url'))]
    if todo and not done_now:
        fresh = [x for x in todo if iso(x[1]['yt_live_at']) >= win - dt.timedelta(hours=1)]
        jid, j = fresh[0] if fresh else sorted(todo, key=lambda x: x[1]['yt_live_at'])[0]
        try:
            meta = json.load(open(os.path.join(ROOT, 'jobs', jid, 'meta.json')))
            raw = 'https://raw.githubusercontent.com/Ghazanaqeel7/sneakydeals-pipeline/main'
            thumb = f'{raw}/jobs/{jid}/thumbnail.jpg' if os.path.exists(os.path.join(ROOT, 'jobs', jid, 'thumbnail.jpg')) else f'{raw}/assets/default_thumbnail.jpg'
            video = j.get('video_url_direct') or j.get('video_url')
            add_item('feed/reels.xml', jid, meta.get('title', ''), ig_caption(meta), thumb, video)
            ft, fbody = fb_post(meta)
            add_item('feed/facebook.xml', jid, ft, fbody, thumb, video)
            j['ig_at'] = j['fb_at'] = j['reels_at'] = stamp
            note(j, f'📱 Instagram + Facebook: "{meta.get("title", "")}" queued, Zapier posts it within ~15 min.')
            changed = True
            print('social: queued', jid)
        except Exception as e:
            print('social: failed', jid, e)

if changed:
    json.dump(st, open(os.path.join(ROOT, 'state.json'), 'w'), indent=2, ensure_ascii=False)
    open(os.path.join(ROOT, 'state.json'), 'a').write('\n')
print('live_check:', 'updated' if changed else 'no change')
