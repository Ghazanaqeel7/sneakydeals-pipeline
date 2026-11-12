#!/usr/bin/env python3
"""Validate a long-form job before it is queued. usage: validate_long.py jobs/<id>
Checks scenes.json, thumb.json, meta.json, script length, visual variety. Exit 1 on errors."""
import json, os, sys, re
TYPES = {'title','chapter','photo','stat','chart','timeline','map','headline','compare','list','quote','illustration','endcard'}
def main():
    job = sys.argv[1].rstrip('/'); errs = []; warns = []
    P = os.path.join(job, 'project', 'src')
    try: sc = json.load(open(os.path.join(P, 'scenes.json'), encoding='utf-8'))['scenes']
    except Exception as e: print('ERROR scenes.json unreadable:', e); sys.exit(1)
    try: meta = json.load(open(os.path.join(job, 'meta.json'), encoding='utf-8'))
    except Exception as e: print('ERROR meta.json unreadable:', e); sys.exit(1)
    ids = set(); words = 0; photos = 0; types = []; casted = []
    for i, s in enumerate(sc):
        sid = s.get('id')
        if not sid or sid in ids: errs.append(f'scene {i}: missing/duplicate id')
        ids.add(sid)
        t = (s.get('text') or '').strip()
        if not t: errs.append(f'{sid}: empty narration text')
        words += len(t.split())
        beats = s['visual'] if isinstance(s.get('visual'), list) else [s.get('visual')]
        for b in beats:
            if not isinstance(b, dict) or b.get('type') not in TYPES: errs.append(f'{sid}: bad visual {b!r}'[:120]); continue
            types.append(b['type'])
            if b.get('cast') or b.get('art') or any(isinstance(x, dict) and x.get('char') for x in (b.get('a'), b.get('b'))): casted.append(sid)
            if b['type'] == 'headline' and re.search(r'reconstruct|sneaky deals|our take', str(b.get('source', '')), re.I):
                errs.append(f'{sid}: headline source must be a real attribution or omitted (not "{b.get("source")}")')
            if b['type'] == 'compare':
                for r in b.get('rows', []):
                    for k in ('a', 'b'):
                        x = r.get(k)
                        if not (isinstance(x, (int, float)) or (isinstance(x, str) and x.strip())): errs.append(f'{sid}: compare row "{r.get("label")}" {k} must be a number or short text')
            if b['type'] == 'stat' and abs(float(b.get('to', 0) or 0)) >= 100 and 'store' in (b.get('suffix', '') + b.get('label', '')).lower() and not b.get('icon'):
                warns.append(f'{sid}: count of stores without stat.icon; make the number visible')
            if b['type'] == 'photo':
                photos += 1
                if not (b.get('image') or {}).get('q') and not (b.get('image') or {}).get('file'): errs.append(f'{sid}: photo without image.q')
                if not b.get('fallback'): warns.append(f'{sid}: photo without fallback icon')
            if b['type'] == 'chart' and not b.get('data'): errs.append(f'{sid}: chart without data')
        if len(beats) > 1 and len(t.split()) < 8: warns.append(f'{sid}: several beats on a very short scene')
        if len(t.split()) > 75: warns.append(f'{sid}: scene is {len(t.split())} words (>~30 s on one visual)')
    if sc and types[-1:] != ['endcard']: warns.append('last scene is not an endcard')
    minutes = words / 150.0
    if meta.get('demo') and minutes >= 1.5: pass   # demo render (never published)
    elif minutes < 8: errs.append(f'narration only ~{minutes:.1f} min ({words} words); long-form needs >= 8 min (~1200 words)')
    elif minutes < 12: warns.append(f'narration ~{minutes:.1f} min; target 12-15 min')
    # a new visual at least every ~15 s
    if len(sc) < minutes * 60 / 18: warns.append(f'only {len(sc)} scenes for {minutes:.1f} min; add more cuts (one per ~12-15 s)')
    if len(set(types)) < 5: warns.append('low visual variety (<5 scene types)')
    if len(set(casted)) < 4: warns.append(f'only {len(set(casted))} scenes use cartoon characters (cast/art/char); aim for the hook + 3 more')
    for k in ('title', 'description', 'tags'):
        if not meta.get(k): errs.append(f'meta.json missing {k}')
    if meta.get('type') != 'long': errs.append('meta.json type must be "long"')
    if not (meta.get('news_hook') or {}).get('url') and not meta.get('evergreen_only'): warns.append('no news_hook (or set evergreen_only:true)')
    if not os.path.exists(os.path.join(job, 'factmap.md')): errs.append('factmap.md missing (2 independent sources per claim)')
    th = os.path.join(P, 'thumb.json')
    if not os.path.exists(th): errs.append('thumb.json missing')
    for w in warns: print('WARN ', w)
    for e in errs: print('ERROR', e)
    print(f'{len(sc)} scenes, {words} words (~{minutes:.1f} min), {photos} photos')
    sys.exit(1 if errs else 0)
main()
