#!/usr/bin/env python3
"""YouTube monetisation-policy gate for one Short (run before script_ready; set_status.py runs it for you).

Usage: python3 pipeline/scripts/policy_check.py <job_id>      -> writes jobs/<id>/policy.json, exit 1 on errors

Based on YouTube Channel Monetisation Policies (support.google.com/youtube/answer/1311392) and the YPP overview
(answer/72851). See docs/ypp_policy.md. Errors block the script; warnings go to the owner in telegram.md.
"""
import json, os, re, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FIN = re.compile(r'\b(stock|stocks|shares|wall street|invest|investing|investment|crypto|bitcoin|trading|trader|short squeeze|hedge fund)\b', re.I)
HEALTH_LEGAL = re.compile(r'\b(cure|diagnos|treatment|medicine|lawsuit advice|legal advice|you should sue)\w*', re.I)
EXPERT = re.compile(r"\b(i am|i'm|as) (a|an|your) (doctor|lawyer|financial advis\w+|investment advis\w+|expert)\b", re.I)
DECEPTIVE = re.compile(r'\b(dies|died|dead|death of|rip|arrested|leaked|banned forever|exposed)\b', re.I)

def words(t):
    return set(w for w in re.findall(r"[a-z']+", t.lower()) if len(w) > 3)

def load(p, default=''):
    try:
        return open(p, encoding='utf-8').read()
    except Exception:
        return default

def check(jid):
    d = os.path.join(ROOT, 'jobs', jid)
    errors, warns = [], []
    try:
        meta = json.loads(load(os.path.join(d, 'meta.json'), '{}'))
    except Exception as e:
        return [f'meta.json is not valid JSON: {e}'], []
    title, desc = meta.get('title', ''), meta.get('description', '')
    shots = load(os.path.join(d, 'SHOTS.txt'))
    narration = ' '.join(l.split('|', 1)[1] for l in shots.splitlines() if '|' in l)

    # metadata (reviewers check titles, thumbnails, descriptions)
    if not title: errors.append('title is empty')
    if len(title) > 100: errors.append(f'title is {len(title)} chars (YouTube max 100)')
    if title.isupper(): warns.append('title is all caps (reads as clickbait)')
    if DECEPTIVE.search(title) and not DECEPTIVE.search(narration):
        errors.append('title promises something the video does not say (deceptive metadata)')
    if not desc: errors.append('description is empty')
    if not re.search(r'dramati[sz]ed', desc, re.I): errors.append('description needs the "⚠️ Dramatised…" line (illustrated scenes, real facts)')
    src = re.split(r'(?im)^sources:\s*$', desc)
    if len(src) < 2 or len([l for l in src[1].splitlines() if l.strip().startswith(('•', '-', '*'))]) < 2:
        errors.append('description needs a "Sources:" list with at least 2 sources')
    tags_in_desc = re.findall(r'#\w+', desc)
    if len(tags_in_desc) > 15: errors.append(f'{len(tags_in_desc)} hashtags in the description (over 15 = YouTube ignores all of them)')
    if len(','.join(meta.get('tags', []))) > 500: errors.append('tags are over 500 characters')

    # AI personas on sensitive topics (cannot monetise)
    blob = ' '.join([title, desc, narration])
    if FIN.search(blob) and 'not investment advice' not in desc.lower():
        errors.append('money/stock story: add "This is history, not investment advice." to the description')
    if EXPERT.search(narration): errors.append('narrator presents as a human expert (AI persona on a sensitive topic)')
    if HEALTH_LEGAL.search(narration): warns.append('health/legal wording in the narration: keep it a story, never advice')

    # inauthentic (generic / repetitive) content: every Short needs its own story
    n = len(re.findall(r"[A-Za-z']+", narration))
    lines = [l for l in shots.splitlines() if '|' in l]
    if len(lines) < 8: errors.append(f'only {len(lines)} shots: needs a real story arc (8+ shots)')
    if n < 110: errors.append(f'narration is {n} words: too thin to be a story (110+)')
    mine = words(narration)
    hook = (lines[0].split('|', 1)[1].strip().lower() if lines else '')
    for other in sorted(os.listdir(os.path.join(ROOT, 'jobs'))):
        if other == jid or not other[:1].isdigit(): continue
        o = load(os.path.join(ROOT, 'jobs', other, 'SHOTS.txt'))
        ow = words(' '.join(l.split('|', 1)[1] for l in o.splitlines() if '|' in l))
        if mine and ow:
            sim = len(mine & ow) / len(mine | ow)
            if sim > 0.45: errors.append(f'narration is {sim:.0%} the same words as {other} (repetitive content)')
            elif sim > 0.30: warns.append(f'narration overlaps {sim:.0%} with {other}: make the angle clearly different')
        oh = next((l.split('|', 1)[1].strip().lower() for l in o.splitlines() if '|' in l), '')
        if hook and oh and hook == oh: errors.append(f'same hook line as {other}')

    # facts: two sources per claim live in script.md's fact map
    scr = load(os.path.join(d, 'script.md'))
    fm = re.search(r'(?ims)^#+\s*fact map.*?$(.*?)(?=^#+\s|\Z)', scr)
    rows = [r for r in re.findall(r'(?m)^\|(.+)\|\s*$', fm.group(1) if fm else '') if not set(r.replace('|', '').strip()) <= set('-: ')]
    rows = [r for r in rows if r.split('|')[0].strip().lower() not in ('claim', 'fact')]
    if not rows:
        warns.append('script.md has no fact map table (claim | sources)')
    thin = [r.split('|')[0].strip()[:50] for r in rows if len(r.split('|')) > 1 and len([x for x in r.split('|')[1].split(';') if x.strip()]) < 2]
    if thin: errors.append(f'{len(thin)} claim(s) with fewer than 2 sources, e.g. "{thin[0]}"')
    return errors, warns

def main():
    jid = sys.argv[1]
    errors, warns = check(jid)
    out = {'ok': not errors, 'errors': errors, 'warnings': warns,
           'checked_at': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
           'policy': 'docs/ypp_policy.md'}
    json.dump(out, open(os.path.join(ROOT, 'jobs', jid, 'policy.json'), 'w'), indent=2, ensure_ascii=False)
    for e in errors: print('ERROR  ', e)
    for w in warns: print('warning', w)
    print('policy check:', 'PASS' if not errors else 'FAIL')
    sys.exit(0 if not errors else 1)

if __name__ == '__main__':
    main()
