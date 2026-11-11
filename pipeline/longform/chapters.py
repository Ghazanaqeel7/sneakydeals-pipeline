#!/usr/bin/env python3
"""Write jobs/<id>/upload.json for the dashboard upload helper: title, description (with chapters + credits), tags.
usage: chapters.py jobs/<id>   (YouTube needs first chapter at 0:00, >=3 chapters, each >=10 s)"""
import json, os, sys
job = sys.argv[1].rstrip('/'); P = os.path.join(job, 'project', 'src')
meta = json.load(open(os.path.join(job, 'meta.json'), encoding='utf-8')); tm = json.load(open(os.path.join(P, 'timing.json')))
ch = []
for c in tm['chapters']:
    if ch and c['start'] - ch[-1]['start'] < 10: continue
    ch.append(c)
fmt = lambda s: f"{int(s)//60}:{int(s)%60:02d}"
lines = [f"{fmt(c['start'])} {c['title']}" for c in ch] if len(ch) >= 3 else []
credits = ''
cp = os.path.join(job, 'credits.txt')
if os.path.exists(cp) and os.path.getsize(cp): credits = 'Image credits:\n' + open(cp, encoding='utf-8').read().strip()
desc = meta['description'].rstrip() + ('\n\nChapters:\n' + '\n'.join(lines) if lines else '') + ('\n\n' + credits if credits else '')
json.dump({'title': meta['title'], 'description': desc, 'tags': meta.get('tags', []), 'chapters': lines, 'credits': credits,
           'pinned_comment': meta.get('pinned_comment', '')}, open(os.path.join(job, 'upload.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print('upload.json written,', len(lines), 'chapters')
