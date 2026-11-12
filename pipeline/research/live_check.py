#!/usr/bin/env python3
"""Did each published / scheduled Short really go live on YouTube? (runs after research.py --stats)

Matches jobs to our public videos in docs/research/own_videos.json by title.
- found      -> jobs[id].yt_video_id, yt_live_at, and a progress note "✅ YouTube par LIVE" (the bot posts it to Slack)
- not found 60 min after the slot -> one warning note (yt_alert) so the owner checks Zapier
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

changed = False
for jid, j in st.get('jobs', {}).items():
    if not jid[:1].isdigit() or j.get('type') == 'long' or j.get('yt_live_at'):
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
        note(j, f'✅ YouTube par LIVE: "{title}" https://youtu.be/{vid}')
        changed = True
    elif now - due > dt.timedelta(minutes=60) and not j.get('yt_alert'):
        j['yt_alert'] = stamp
        note(j, f'⚠️ "{title}" slot ke 1 ghante baad bhi YouTube par public nahi mili. Zapier > Zap history (YouTube) check karein.')
        changed = True

if changed:
    json.dump(st, open(os.path.join(ROOT, 'state.json'), 'w'), indent=2, ensure_ascii=False)
    open(os.path.join(ROOT, 'state.json'), 'a').write('\n')
print('live_check:', 'updated' if changed else 'no change')
