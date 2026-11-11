#!/usr/bin/env python3
"""Take the first owner idea from state.json["ideas"] (queued from the dashboard), print it and remove it.

Usage: python3 pipeline/scripts/pop_idea.py          -> first SHORT idea (ideas not starting with [LONG])
       python3 pipeline/scripts/pop_idea.py --long   -> first idea starting with [LONG] (printed without the prefix)
Empty output = none queued.
Safe like set_status.py: fetch, edit, push, retry.
"""
import json, subprocess, sys, time

def git(*a, check=True):
    return subprocess.run(['git', *a], check=check, capture_output=True, text=True)

if git('status', '--porcelain', '--untracked-files=no').stdout.strip():
    sys.exit('working tree has uncommitted changes: commit and push them first')
for attempt in range(8):
    git('fetch', 'origin', 'main'); git('reset', '--hard', 'FETCH_HEAD')
    st = json.load(open('state.json'))
    ideas = st.get('ideas') or []
    want_long = '--long' in sys.argv
    is_long = lambda x: str(x).lstrip().upper().startswith('[LONG]')
    pick = [i for i, x in enumerate(ideas) if is_long(x) == want_long]
    if not pick: sys.exit(0)
    idea = ideas.pop(pick[0]); st['ideas'] = ideas
    if want_long: idea = idea.lstrip()[6:].strip()
    json.dump(st, open('state.json', 'w'), indent=2, ensure_ascii=False); open('state.json', 'a').write('\n')
    git('add', 'state.json'); git('commit', '-m', 'take owner idea from dashboard queue')
    if git('push', 'origin', 'HEAD:main', check=False).returncode == 0:
        print(idea); sys.exit(0)
    time.sleep(3 + attempt * 2)
sys.exit('could not push state.json after 8 tries')
