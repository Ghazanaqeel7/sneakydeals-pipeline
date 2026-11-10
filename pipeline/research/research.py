#!/usr/bin/env python3
"""Sneaky Deals research bot (free: YouTube Data API v3 + YouTube search suggestions).

Usage (GitHub Actions runs this daily; env YT_API_KEY needed for --full):
  python3 pipeline/research/research.py --full     # daily: outliers, competitors, hot words, suggestions, title checks,
                                                   #        trend memory (30 days) and our own videos' growth
  python3 pipeline/research/research.py --titles   # only search suggestions for scripts waiting on the owner (no key)
Writes docs/research/latest.json (read by the dashboard and by Claude's story run),
a dated copy in docs/research/history/ (last 30 days kept), docs/research/trends.json (what is rising / falling and
which title patterns the hits use), docs/research/own_videos.json (our videos' views over time) and
docs/research/summary.txt (lines for Slack). Claude's Monday "weekly learning" turns these into docs/playbook.md.

Outlier score = video views / the channel's average views per video (same idea as vidIQ's breakout score).
Quota: a full run uses roughly 1,500 of the free 10,000 units per day.
"""
import json, os, re, sys, time, math, datetime, urllib.request, urllib.parse
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CFG = json.load(open(os.path.join(ROOT, 'research/config.json')))
OUT_DIR = os.path.join(ROOT, 'docs/research')
LATEST = os.path.join(OUT_DIR, 'latest.json')
KEY = os.environ.get('YT_API_KEY', '').strip()
YT = 'https://www.googleapis.com/youtube/v3/'
NOW = datetime.datetime.now(datetime.timezone.utc)
UNITS = {'used': 0}

STOP = set('''a an the of to in on for and or is are was were be been it its this that these those how why what who when
where which with from by at as his her their they he she you your my our we i me us not no yes do did does done has have
had can could will would just only than then so too very more most into out up down over after before about secret secretly
company companies business brand brands made make makes making ever every day new one two first world history story
stories video shorts short real true facts fact x vs time years year million billion dollar dollars'''.split())

def get(url, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'sneakydeals-research/1.0'})
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read().decode('utf-8', 'replace')
        except urllib.error.HTTPError as e:
            body = e.read().decode('utf-8', 'replace')[:300]
            if e.code in (400, 403, 404): raise RuntimeError(f'HTTP {e.code}: {body}')
            if i == tries - 1: raise
        except Exception:
            if i == tries - 1: raise
        time.sleep(2 * (i + 1))

def yt(endpoint, cost=1, **params):
    UNITS['used'] += cost
    params['key'] = KEY
    return json.loads(get(YT + endpoint + '?' + urllib.parse.urlencode(params, doseq=True)))

def suggest(q):
    url = 'https://suggestqueries.google.com/complete/search?' + urllib.parse.urlencode({'client': 'firefox', 'ds': 'yt', 'hl': 'en', 'gl': CFG.get('region', 'US'), 'q': q})
    try:
        data = json.loads(get(url))
        return [s for s in data[1] if s.lower() != q.lower()][:10]
    except Exception as e:
        print('suggest failed', q, e); return []

def iso_dur(s):
    m = re.match(r'P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', s or '')
    if not m: return 0
    d, h, mi, se = (int(x or 0) for x in m.groups())
    return d * 86400 + h * 3600 + mi * 60 + se

def english(t):
    letters = [c for c in t if c.isalpha()]
    return bool(letters) and sum(c.isascii() for c in letters) / len(letters) > 0.85

def chunks(xs, n=50):
    for i in range(0, len(xs), n): yield xs[i:i + n]

def video_details(ids):
    out = {}
    for c in chunks(list(dict.fromkeys(ids))):
        for it in yt('videos', part='snippet,statistics,contentDetails', id=','.join(c), maxResults=50).get('items', []):
            st, sn = it.get('statistics', {}), it['snippet']
            out[it['id']] = {
                'id': it['id'], 'title': sn['title'], 'channel_id': sn['channelId'], 'channel': sn['channelTitle'],
                'published': sn['publishedAt'], 'seconds': iso_dur(it['contentDetails'].get('duration')),
                'views': int(st.get('viewCount', 0)), 'likes': int(st.get('likeCount', 0) or 0),
                'comments': int(st.get('commentCount', 0) or 0),
                'thumb': f"https://i.ytimg.com/vi/{it['id']}/mqdefault.jpg",
            }
    return out

def channel_details(ids):
    out = {}
    for c in chunks(list(dict.fromkeys(ids))):
        for it in yt('channels', part='snippet,statistics,contentDetails', id=','.join(c), maxResults=50).get('items', []):
            st = it.get('statistics', {})
            vids = max(int(st.get('videoCount', 0) or 0), 1)
            out[it['id']] = {
                'id': it['id'], 'title': it['snippet']['title'], 'handle': it['snippet'].get('customUrl', ''),
                'subs': int(st.get('subscriberCount', 0) or 0), 'views': int(st.get('viewCount', 0) or 0),
                'videos': vids, 'avg_views': int(st.get('viewCount', 0) or 0) / vids,
                'uploads': it['contentDetails']['relatedPlaylists'].get('uploads'),
                'thumb': it['snippet']['thumbnails'].get('default', {}).get('url', ''),
                'country': it['snippet'].get('country', ''),
            }
    return out

def resolve(ref):
    if ref.startswith('UC'): return ref
    r = yt('channels', part='id', forHandle=ref if ref.startswith('@') else '@' + ref)
    items = r.get('items', [])
    return items[0]['id'] if items else None

def days_since(iso):
    t = datetime.datetime.fromisoformat(iso.replace('Z', '+00:00'))
    return max((NOW - t).total_seconds() / 86400, 0.5)

def scan(kind):
    c = CFG[kind]
    after = (NOW - datetime.timedelta(days=c['days'])).strftime('%Y-%m-%dT%H:%M:%SZ')
    found = {}
    for kw in c['keywords']:
        p = dict(part='snippet', q=kw, type='video', order='relevance', publishedAfter=after, maxResults=50,
                 regionCode=CFG.get('region', 'US'), relevanceLanguage=CFG.get('language', 'en'))
        if kind == 'shorts': p['videoDuration'] = 'short'
        try:
            for it in yt('search', cost=100, **p).get('items', []):
                found.setdefault(it['id']['videoId'], set()).add(kw)
        except Exception as e:
            print('search failed', kw, e)
    vids = video_details(list(found))
    chans = channel_details([v['channel_id'] for v in vids.values()])
    rows = []
    for vid, v in vids.items():
        if kind == 'shorts' and not (c.get('min_seconds', 0) <= v['seconds'] <= c.get('max_seconds', 180)): continue
        if kind == 'long' and v['seconds'] < c.get('min_seconds', 240): continue
        if v['views'] < c['min_views'] or not english(v['title']): continue
        if v['channel_id'] == CFG.get('own_channel'): continue
        ch = chans.get(v['channel_id'], {})
        if ch.get('country') in CFG.get('exclude_countries', []): continue
        tl = v['title'].lower()
        if any(w in tl for w in CFG.get('exclude_words', [])): continue
        v['subs'] = ch.get('subs', 0)
        v['score'] = round(v['views'] / max(ch.get('avg_views', 1), 1), 1)
        v['per_day'] = int(v['views'] / days_since(v['published']))
        v['keywords'] = sorted(found[vid])
        rows.append(v)
    # rank: breakout matters most, raw size second (a 5x hit at 10M beats a 5x hit at 100k)
    rows.sort(key=lambda r: math.log10(max(r['score'], 1)) * 2 + math.log10(r['views']), reverse=True)
    return rows[:60]

def competitors(prev):
    prev_c = {x['id']: x for x in (prev.get('competitors') or [])}
    ids = [i for i in (resolve(r) for r in CFG['competitors']) if i]
    chans = channel_details(ids)
    out = []
    for cid in ids:
        ch = chans.get(cid)
        if not ch: continue
        items = yt('playlistItems', part='contentDetails', playlistId=ch['uploads'], maxResults=30).get('items', []) if ch['uploads'] else []
        vids = list(video_details([i['contentDetails']['videoId'] for i in items]).values())
        views = sorted(v['views'] for v in vids)
        median = views[len(views) // 2] if views else 0
        for v in vids:
            v['score'] = round(v['views'] / max(median, 1), 1)
            v['short'] = v['seconds'] <= 180
        recent = sorted(vids, key=lambda v: v['published'], reverse=True)
        p = prev_c.get(cid, {})
        out.append({
            'id': cid, 'title': ch['title'], 'handle': ch['handle'], 'thumb': ch['thumb'], 'subs': ch['subs'],
            'subs_change': ch['subs'] - p['subs'] if p.get('subs') else None,
            'videos': ch['videos'], 'recent_median': median,
            'shorts_share': round(sum(v['short'] for v in vids) / len(vids), 2) if vids else 0,
            'last_upload': recent[0]['published'] if recent else None,
            'uploads_30d': sum(1 for v in vids if days_since(v['published']) <= 30),
            'top_recent': sorted(vids, key=lambda v: v['views'], reverse=True)[:3],
            'hits': [v for v in sorted(vids, key=lambda v: v['score'], reverse=True) if v['score'] >= 3][:3],
        })
    out.sort(key=lambda x: x['subs'], reverse=True)
    return out

def hot_words(rows):
    cnt = Counter()
    for r in rows:
        words = set(w for w in re.findall(r"[a-z][a-z'\-]+", r['title'].lower()) if w not in STOP and len(w) > 2)
        for w in words: cnt[w] += 1
    return [{'word': w, 'count': n} for w, n in cnt.most_common(25) if n >= 2]

def title_checks():
    st = json.load(open(os.path.join(ROOT, 'state.json')))
    out = {}
    for jid, j in st.get('jobs', {}).items():
        if not re.match(r'^\d', jid) or j.get('status') in ('published', 'dropped'): continue
        title = j.get('title') or ''
        if not title:
            try: title = json.load(open(os.path.join(ROOT, 'jobs', jid, 'meta.json'))).get('title', '')
            except Exception: pass
        if not title: continue
        words = [w for w in re.findall(r"[A-Za-z][A-Za-z'\.\-]*", title)]
        seeds = []
        if words: seeds.append(words[0].lower())                       # brand / first word
        if len(words) > 1: seeds.append(' '.join(words[:2]).lower())   # brand + verb
        sug = {s: suggest(s) for s in dict.fromkeys(seeds)}
        out[jid] = {'title': title, 'suggestions': sug, 'checked': NOW.strftime('%Y-%m-%dT%H:%M:%SZ')}
    return out

def own_channel(prev):
    cid = CFG.get('own_channel')
    if not cid: return None
    ch = channel_details([cid]).get(cid)
    if not ch: return None
    p = prev.get('own') or {}
    ch['subs_change'] = ch['subs'] - p['subs'] if p.get('subs') is not None else None
    ch['views_change'] = ch['views'] - p['views'] if p.get('views') is not None else None
    return ch

BRANDS = ['coca-cola', 'coke', 'pepsi', 'mcdonald', 'disney', 'costco', 'nike', 'apple', 'amazon', 'walmart', 'ikea',
          'lego', 'netflix', 'blockbuster', 'sears', 'toys r us', 'burger king', 'starbucks', 'tesla', 'google', 'microsoft',
          'nintendo', 'sony', 'samsung', 'nokia', 'kodak', 'ferrari', 'lamborghini', 'rolex', 'heinz', 'kfc', 'subway',
          'wendy', 'taco bell', 'domino', 'red bull', 'monster', 'hershey', 'mars', 'kellogg', 'ford', 'toyota', 'honda',
          'boeing', 'gucci', 'louis vuitton', 'chick-fil-a', 'popeyes', 'tupperware', 'kmart', 'radioshack', 'yahoo']

def title_patterns(rows):
    """Share of hit titles that use each pattern, so we learn what packaging works right now."""
    n = len(rows) or 1
    has = lambda f: round(sum(1 for r in rows if f(r['title'])) / n, 2)
    secs = sorted(r['seconds'] for r in rows)
    return {
        'count': len(rows),
        'question': has(lambda t: '?' in t),
        'why_how': has(lambda t: re.match(r'(?i)^(why|how)\b', t.strip()) is not None),
        'number': has(lambda t: re.search(r'\d', t) is not None),
        'money': has(lambda t: re.search(r'[$£€]|\bmillion|\bbillion', t, re.I) is not None),
        'caps_word': has(lambda t: re.search(r'\b[A-Z]{3,}\b', t) is not None),
        'emoji': has(lambda t: re.search(r'[\U0001F300-\U0001FAFF☀-➿]', t) is not None),
        'brand': has(lambda t: any(b in t.lower() for b in BRANDS)),
        'median_seconds': secs[len(secs) // 2] if secs else 0,
        'median_words': sorted(len(r['title'].split()) for r in rows)[len(rows) // 2] if rows else 0,
    }

def brand_counts(rows):
    c = Counter()
    for r in rows:
        t = r['title'].lower()
        for b in BRANDS:
            if b in t: c[b] += 1
    return dict(c)

def update_trends(res):
    """30-day memory: one entry per day with word + brand counts; rising/falling = last 7 days vs the 7 before."""
    path = os.path.join(OUT_DIR, 'trends.json')
    tr = json.load(open(path)) if os.path.exists(path) else {'days': []}
    today = NOW.strftime('%Y-%m-%d')
    rows = res.get('shorts', []) + res.get('long', [])
    words = {w['word']: w['count'] for w in hot_words(rows)}
    entry = {'date': today, 'words': words, 'brands': brand_counts(rows)}
    tr['days'] = [d for d in tr['days'] if d['date'] != today] + [entry]
    tr['days'] = [d for d in tr['days'] if (NOW - datetime.datetime.fromisoformat(d['date'] + 'T00:00:00+00:00')).days <= 30]
    def window(a, b, key):
        tot = Counter()
        for d in tr['days']:
            age = (NOW - datetime.datetime.fromisoformat(d['date'] + 'T00:00:00+00:00')).days
            if a <= age < b: tot.update(d[key])
        return tot
    out = {}
    for key in ('words', 'brands'):
        now7, prev7 = window(0, 7, key), window(7, 14, key)
        moves = []
        for k in set(now7) | set(prev7):
            moves.append({'name': k, 'now': now7[k], 'before': prev7[k], 'change': now7[k] - prev7[k]})
        moves.sort(key=lambda x: x['change'], reverse=True)
        out[key] = {'rising': [m for m in moves if m['change'] > 0][:12],
                    'falling': [m for m in reversed(moves) if m['change'] < 0][:8],
                    'steady': sorted([m for m in moves if m['now'] >= 2], key=lambda m: -m['now'])[:12]}
    tr['rising'] = out
    tr['patterns'] = {'shorts': title_patterns(res.get('shorts', [])), 'long': title_patterns(res.get('long', []))}
    tr['days_of_memory'] = len(tr['days'])
    tr['updated'] = NOW.strftime('%Y-%m-%dT%H:%M:%SZ')
    json.dump(tr, open(path, 'w'), indent=1, ensure_ascii=False)
    return tr

def track_own_videos(own):
    """Daily snapshot of every public Sneaky Deals video, so we can compare our videos at the same age (1/3/7 days)."""
    path = os.path.join(OUT_DIR, 'own_videos.json')
    data = json.load(open(path)) if os.path.exists(path) else {'videos': {}}
    if not own or not own.get('uploads'): return data
    items = yt('playlistItems', part='contentDetails', playlistId=own['uploads'], maxResults=50).get('items', [])
    vids = video_details([i['contentDetails']['videoId'] for i in items])
    stamp = NOW.strftime('%Y-%m-%dT%H:%M:%SZ')
    for vid, v in vids.items():
        rec = data['videos'].setdefault(vid, {'snaps': []})
        rec.update({k: v[k] for k in ('title', 'published', 'seconds', 'thumb')})
        rec['short'] = v['seconds'] <= 180
        rec['snaps'] = [s for s in rec['snaps'] if s['t'][:10] != stamp[:10]] + [{'t': stamp, 'views': v['views'], 'likes': v['likes'], 'comments': v['comments']}]
        age = days_since(v['published'])
        rec['age_days'] = round(age, 1)
        def at(d):   # views from a snapshot taken when the video was d to d+1.5 days old (None if we have none)
            for s in rec['snaps']:
                snap_age = days_since(v['published']) - days_since(s['t'])
                if d <= snap_age < d + 1.5: return s['views']
            return None
        rec['views_1d'], rec['views_3d'], rec['views_7d'] = at(1), at(3), at(7)
        rec['views'] = v['views']
        rec['like_rate'] = round(v['likes'] / v['views'], 3) if v['views'] else 0
    data['updated'] = stamp
    json.dump(data, open(path, 'w'), indent=1, ensure_ascii=False)
    return data

def prune_history(days=30):
    h = os.path.join(OUT_DIR, 'history')
    for f in os.listdir(h):
        try:
            if (NOW.date() - datetime.date.fromisoformat(f[:10])).days > days: os.remove(os.path.join(h, f))
        except ValueError: pass

def main():
    args = sys.argv[1:]
    full = '--full' in args
    os.makedirs(os.path.join(OUT_DIR, 'history'), exist_ok=True)
    prev = json.load(open(LATEST)) if os.path.exists(LATEST) else {}
    res = dict(prev)
    if full:
        if not KEY: sys.exit('YT_API_KEY is not set (GitHub: Settings → Secrets and variables → Actions)')
        res['shorts'] = scan('shorts')
        res['long'] = scan('long')
        res['competitors'] = competitors(prev)
        res['own'] = own_channel(prev)
        track_own_videos(res['own'])
        res['hot_words'] = {'shorts': hot_words(res['shorts']), 'long': hot_words(res['long'])}
        res['suggestions'] = {s: suggest(s) for s in CFG.get('suggest_seeds', [])}
        res['full_run'] = NOW.strftime('%Y-%m-%dT%H:%M:%SZ')
        tr = update_trends(res)
        res['units_used'] = UNITS['used']
    res['title_checks'] = title_checks()
    res['updated'] = NOW.strftime('%Y-%m-%dT%H:%M:%SZ')
    res['config'] = {k: CFG[k] for k in ('region', 'shorts', 'long')}
    json.dump(res, open(LATEST, 'w'), indent=1, ensure_ascii=False)
    if full:
        json.dump(res, open(os.path.join(OUT_DIR, 'history', NOW.strftime('%Y-%m-%d') + '.json'), 'w'), ensure_ascii=False)
        prune_history()
        lines = summary(res, tr)
        open(os.path.join(OUT_DIR, 'summary.txt'), 'w').write('\n'.join(lines) + '\n')
        print('\n'.join(lines))
    print(f"done: shorts={len(res.get('shorts', []))} long={len(res.get('long', []))} competitors={len(res.get('competitors', []))} units={UNITS['used']}")

def fmt(n):
    n = n or 0
    return f'{n/1e6:.1f}M' if n >= 1e6 else f'{n/1e3:.0f}K' if n >= 1e3 else str(n)

def summary(res, tr=None):
    L = ['🔎 Research update tayyar (dashboard → Research)']
    if res.get('shorts'):
        t = res['shorts'][0]; L.append(f"🔥 Top Short: \"{t['title'][:70]}\" — {fmt(t['views'])} views, {t['score']}x apne channel se zyada")
    if res.get('long'):
        t = res['long'][0]; L.append(f"🎬 Top lambi video: \"{t['title'][:70]}\" — {fmt(t['views'])} views, {t['score']}x")
    hw = (res.get('hot_words') or {}).get('shorts') or []
    if hw: L.append('🏷 Garam words: ' + ', '.join(w['word'] for w in hw[:8]))
    comp = [c for c in res.get('competitors', []) if c.get('hits')]
    if comp:
        c = comp[0]; h = c['hits'][0]; L.append(f"👀 {c['title']}: \"{h['title'][:60]}\" {h['score']}x chali")
    up = ((tr or {}).get('rising') or {}).get('brands', {}).get('rising') or []
    if up and (tr or {}).get('days_of_memory', 0) >= 8: L.append('📈 Barh rahe topics (7 din): ' + ', '.join(f"{m['name']} (+{m['change']})" for m in up[:5]))
    o = res.get('own')
    if o: L.append(f"📈 Sneaky Deals: {fmt(o['subs'])} subs" + (f" ({o['subs_change']:+d} pichle scan se)" if o.get('subs_change') is not None else ''))
    return L

if __name__ == '__main__':
    main()
