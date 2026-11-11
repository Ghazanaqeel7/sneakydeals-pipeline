#!/usr/bin/env python3
"""News hook finder (free, RSS only). Collects US + UK business/consumer headlines and scores them for 'brand story' potential.
Output: docs/research/news_hooks.json  -> dashboard Long-form tab + Claude's topic picker.
Hook = a current headline about a company/brand/product; Claude then adds the evergreen backstory (how did it get here?).
Never fetches article bodies; keeps only headline, source, link, date (used as a lead, never copied).

Each hook also gets a `viral` block: a heuristic "is this angle worth a long video" signal, built from (a) the hook's own
recency/keyword score and (b) real outlier data already in docs/research/latest.json (long-form videos in our niche that
beat their channel's average by Nx) -- matched to the hook by shared title words. This is NOT a prediction, just evidence
("this kind of story has worked before, recently"); the dashboard must say so."""
import json, re, sys, urllib.request, datetime, xml.etree.ElementTree as ET, urllib.parse, os, email.utils
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    import research as _r  # sibling module: reuses its stopword list, nothing else (no network calls at import time)
    _STOP = _r.STOP
except Exception:
    _STOP = set()
FEEDS = [
    ('BBC Business', 'https://feeds.bbci.co.uk/news/business/rss.xml', 'UK'),
    ('Guardian Business', 'https://www.theguardian.com/uk/business/rss', 'UK'),
    ('CNBC Business', 'https://www.cnbc.com/id/10001147/device/rss/rss.html', 'US'),
    ('CNBC Retail', 'https://www.cnbc.com/id/10000116/device/rss/rss.html', 'US'),
    ('NPR Business', 'https://feeds.npr.org/1006/rss.xml', 'US'),
    ('Google News US', 'https://news.google.com/rss/search?q=company+bankruptcy+OR+recall+OR+layoffs+OR+brand+when:2d&hl=en-US&gl=US&ceid=US:en', 'US'),
    ('Google News UK', 'https://news.google.com/rss/search?q=retailer+OR+brand+OR+bankruptcy+OR+collapse+when:2d&hl=en-GB&gl=GB&ceid=GB:en', 'UK'),
]
GOOD = {'bankruptcy': 5, 'collapse': 5, 'recall': 4, 'closing': 4, 'closes': 4, 'shuts': 4, 'layoffs': 3, 'ceo': 3, 'founder': 3, 'merger': 3, 'acquire': 3, 'acquisition': 3,
        'ipo': 3, 'lawsuit': 3, 'scandal': 4, 'fraud': 4, 'brand': 3, 'rebrand': 4, 'discontinue': 4, 'last store': 4, 'stores': 2, 'retailer': 3, 'chain': 3, 'launch': 2, 'tariff': 2,
        'price': 2, 'shrinkflation': 4, 'subscription': 2, 'airline': 2, 'bank': 2, 'startup': 2, 'billion': 2, 'sales': 1, 'profit': 1, 'loses': 2, 'falls': 1}
POLITICS = re.compile(r'\b(trump|biden|harris|starmer|sunak|labour|tory|tories|democrat|republican|congress|senate|parliament|election|vote[sr]?|war|gaza|ukraine|israel|hamas|russia|nato|immigration|abortion|shooting|murder|police|court(room)?|trial|minister|president|prime minister)\b', re.I)
NAME = re.compile(r"\b([A-Z][a-zA-Z&'.-]+(?:\s[A-Z][a-zA-Z&'.-]+){0,2})\b")
def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (SneakyDealsBot)'})
    with urllib.request.urlopen(req, timeout=25) as r: return r.read()
def parse(xml, source, region):
    out = []
    root = ET.fromstring(xml)
    for it in root.iter('item'):
        t = (it.findtext('title') or '').strip(); link = (it.findtext('link') or '').strip(); d = it.findtext('pubDate') or ''
        try: dt = email.utils.parsedate_to_datetime(d).astimezone(datetime.timezone.utc)
        except Exception: dt = datetime.datetime.now(datetime.timezone.utc)
        if source.startswith('Google News') and ' - ' in t: t, src = t.rsplit(' - ', 1)
        else: src = source
        out.append({'title': t, 'url': link, 'source': src, 'region': region, 'date': dt.strftime('%Y-%m-%dT%H:%M:%SZ')})
    return out
def score(h, now):
    t = h['title']; low = t.lower()
    if POLITICS.search(t): return -1, []
    s = 0; why = []
    for k, w in GOOD.items():
        if k in low: s += w; why.append(k)
    brands = [m for m in NAME.findall(t) if m.split()[0] not in ('The', 'A', 'An', 'How', 'Why', 'What', 'UK', 'US', 'New', 'Big')]
    if brands: s += 2
    age = (now - datetime.datetime.strptime(h['date'], '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=datetime.timezone.utc)).total_seconds() / 3600
    s += 3 if age < 24 else 1 if age < 48 else 0
    return s, why
def load_latest():
    try: return json.load(open('docs/research/latest.json', encoding='utf-8'))
    except Exception: return {}

def _words(t):
    return set(w for w in re.findall(r"[a-z']+", t.lower()) if len(w) > 2 and w not in _STOP)

def viral_signal(hook_title, hook_score, long_rows):
    """Heuristic only: matches the hook against real outlier long-form videos in our niche (docs/research/latest.json).
    Returns a dict {label, matched_words, examples[{title,channel,views,score}]} -- never a guarantee, just evidence."""
    words = _words(hook_title)
    examples = []
    for r in long_rows or []:
        if words & _words(r.get('title', '')):
            examples.append(r)
    examples.sort(key=lambda r: -r.get('score', 0))
    examples = examples[:3]
    best = examples[0]['score'] if examples else 0
    matched_words = sorted(words & set.union(*[_words(e['title']) for e in examples]) if examples else set())[:6]
    pts = hook_score + len(examples) * 2 + (best >= 5) * 3 + (best >= 10) * 2
    label = 'Strong' if pts >= 18 else 'Good' if pts >= 11 else 'Moderate' if pts >= 6 else 'Early / unproven'
    return {'label': label, 'matched_words': matched_words,
            'examples': [{'title': e['title'], 'channel': e.get('channel', ''), 'views': e['views'], 'score': e['score']} for e in examples]}

def main():
    now = datetime.datetime.now(datetime.timezone.utc); items = []; errs = []
    for name, url, region in FEEDS:
        try: items += parse(fetch(url), name, region)
        except Exception as e: errs.append(f'{name}: {e}')
    seen = set(); res = []
    for h in items:
        key = re.sub(r'\W+', '', h['title'].lower())[:50]
        if key in seen: continue
        seen.add(key); s, why = score(h, now)
        if s >= 6: res.append({**h, 'score': s, 'why': why[:4]})
    res.sort(key=lambda x: -x['score'])
    top = res[:25]
    long_rows = load_latest().get('long', [])
    for h in top:
        h['viral'] = viral_signal(h['title'], h['score'], long_rows)
    os.makedirs('docs/research', exist_ok=True)
    json.dump({'updated': now.strftime('%Y-%m-%dT%H:%M:%SZ'), 'hooks': top, 'errors': errs}, open('docs/research/news_hooks.json', 'w'), indent=1, ensure_ascii=False)
    print(f'{len(res)} hooks kept (top 25 saved, viral-scored against {len(long_rows)} long outliers), {len(errs)} feed errors', errs)
if __name__ == '__main__':
    if '--selftest' in sys.argv:
        xml = b'<rss><channel><item><title>Toys retailer files for bankruptcy - Reuters</title><link>http://x</link><pubDate>Tue, 10 Nov 2026 10:00:00 GMT</pubDate></item></channel></rss>'
        h = parse(xml, 'Google News US', 'US')[0]; assert h['source'] == 'Reuters'
        s, _ = score(h, datetime.datetime(2026, 11, 10, 20, tzinfo=datetime.timezone.utc)); assert s >= 6, s
        assert score({'title': 'Trump signs bankruptcy bill', 'date': h['date']}, datetime.datetime.now(datetime.timezone.utc))[0] == -1
        rows = [{'title': 'Why This Toy Retailer Went Bankrupt', 'views': 2_000_000, 'score': 8.1, 'channel': 'Biz Stories'},
                {'title': 'A Totally Unrelated Cooking Video', 'views': 500_000, 'score': 2.0, 'channel': 'Food'}]
        v = viral_signal('Toys retailer files for bankruptcy', 9, rows)
        assert v['label'] in ('Strong', 'Good'), v
        assert len(v['examples']) == 1 and v['examples'][0]['channel'] == 'Biz Stories'
        assert viral_signal('Nothing matches at all here', 2, rows)['label'] == 'Early / unproven'
        print('selftest ok')
    else: main()
