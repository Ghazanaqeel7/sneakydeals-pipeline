#!/usr/bin/env python3
"""Resolve every image.q in scenes.json/thumb.json to a local, licence-checked file from Wikimedia Commons.
Runs in GitHub Actions (Claude's sandbox cannot reach Wikimedia).
usage: fetch_assets.py jobs/<id> [--strict]   --selftest runs offline checks
Writes project/public/assets/<name>, sets image.resolved={file,credit}, writes jobs/<id>/credits.txt.
Allowed licences: Public domain, CC0, CC BY, CC BY-SA (credit is auto-collected). Anything else is skipped.
Photos that cannot be found keep no 'resolved' -> the scene shows its fallback icon (strict mode fails instead)."""
import json, os, re, sys, urllib.parse, urllib.request, hashlib, html
API = 'https://commons.wikimedia.org/w/api.php'
UA = {'User-Agent': 'SneakyDealsBot/1.0 (https://github.com/Ghazanaqeel7/sneakydeals-pipeline; owner channel @SneakyDeals)'}
OK = re.compile(r'^(public domain|pd\b|pd-|cc0|cc[- ]by(?!-nc)(?!-nd)|cc[- ]by-sa|attribution(?! non)|no restrictions)', re.I)
BAD = re.compile(r'(non-?commercial|\bnc\b|no-?deriv|\bnd\b|fair use|copyrighted|all rights)', re.I)

def licence_ok(lic):
    lic = (lic or '').strip()
    return bool(lic) and bool(OK.search(lic)) and not BAD.search(lic)

def strip(s): return html.unescape(re.sub(r'<[^>]+>', '', s or '')).strip()

def pick(pages, min_w=1000):
    """choose best page from an API result; returns (title,url,credit) or None"""
    best = None
    for p in sorted(pages, key=lambda x: x.get('index', 0)):
        ii = (p.get('imageinfo') or [None])[0]
        if not ii: continue
        if ii.get('mime') not in ('image/jpeg', 'image/png'): continue
        if (ii.get('width') or 0) < min_w: continue
        md = ii.get('extmetadata') or {}
        lic = (md.get('LicenseShortName') or {}).get('value') or ''
        if not licence_ok(lic): continue
        artist = strip((md.get('Artist') or {}).get('value')) or 'Unknown author'
        credit = f"{p['title'].replace('File:', '')} - {artist[:80]} - {lic} - {ii.get('descriptionurl', '')}"
        best = (p['title'], ii.get('thumburl') or ii['url'], credit); break
    return best

def search(q):
    prm = {'action': 'query', 'format': 'json', 'generator': 'search', 'gsrsearch': q + ' filetype:bitmap', 'gsrnamespace': '6', 'gsrlimit': '12',
           'prop': 'imageinfo', 'iiprop': 'url|mime|size|extmetadata', 'iiurlwidth': '1920'}
    req = urllib.request.Request(API + '?' + urllib.parse.urlencode(prm), headers=UA)
    with urllib.request.urlopen(req, timeout=40) as r: d = json.load(r)
    return list((d.get('query') or {}).get('pages', {}).values())

def download(url, dest):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=90) as r, open(dest, 'wb') as f: f.write(r.read())

def walk(o):
    if isinstance(o, dict):
        if 'q' in o and isinstance(o.get('q'), str) and 'resolved' not in o: yield o
        for v in o.values(): yield from walk(v)
    elif isinstance(o, list):
        for v in o: yield from walk(v)

def selftest():
    assert licence_ok('CC BY-SA 4.0') and licence_ok('Public domain') and licence_ok('CC0') and licence_ok('CC BY 2.0') and licence_ok('PD-US')
    assert not licence_ok('CC BY-NC 4.0') and not licence_ok('') and not licence_ok('Fair use') and not licence_ok('CC BY-ND 2.0')
    mk = lambda t, lic, w=2000, mime='image/jpeg': {'title': 'File:' + t, 'index': 1, 'imageinfo': [{'mime': mime, 'width': w, 'url': 'u', 'thumburl': 'tu', 'descriptionurl': 'd', 'extmetadata': {'LicenseShortName': {'value': lic}, 'Artist': {'value': '<b>A</b>'}}}]}
    assert pick([mk('a.jpg', 'CC BY-NC 2.0'), mk('b.jpg', 'CC BY 4.0')])[0] == 'File:b.jpg'
    assert pick([mk('a.jpg', 'CC0', 400)]) is None and pick([mk('a.svg', 'CC0', 3000, 'image/svg+xml')]) is None
    print('selftest ok')

def main():
    if '--selftest' in sys.argv: return selftest()
    job = sys.argv[1].rstrip('/'); strict = '--strict' in sys.argv
    P = os.path.join(job, 'project'); AS = os.path.join(P, 'public', 'assets'); os.makedirs(AS, exist_ok=True)
    credits = []; missing = []; cache = {}
    for fn in ('scenes.json', 'thumb.json'):
        path = os.path.join(P, 'src', fn); data = json.load(open(path, encoding='utf-8'))
        for im in walk(data):
            q = im['q']
            if q not in cache:
                try:
                    hit = None
                    for qq in (q, ' '.join(q.split()[:3])):
                        hit = pick(search(qq))
                        if hit: break
                    if hit:
                        name = hashlib.sha1(q.encode()).hexdigest()[:10] + '.jpg'
                        download(hit[1], os.path.join(AS, name)); cache[q] = {'file': 'assets/' + name, 'credit': hit[2]}; credits.append(hit[2])
                    else: cache[q] = None
                except Exception as e:
                    print('fetch error', q, e); cache[q] = None
            if cache[q]: im['resolved'] = cache[q]
            else: missing.append(q)
        json.dump(data, open(path, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    with open(os.path.join(job, 'credits.txt'), 'w', encoding='utf-8') as f: f.write('\n'.join(sorted(set(credits))))
    print(f'resolved {len(set(credits))} images, {len(set(missing))} missing -> fallback icons', sorted(set(missing)))
    if strict and missing: sys.exit(1)
main()
