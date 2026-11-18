#!/usr/bin/env python3
"""Take the first owner idea from state.json["ideas"] (queued from the dashboard), print it and remove it.

An idea is either:
  - a plain string (quick idea, or "[LONG] ..." for a long-video quick idea), or
  - a draft object from the dashboard's "My Story" tab:
    {"kind":"draft","format":"short"|"long","title":...,"story":...,"scenes":...,"submitted_at":...}
    -> printed as a labelled block so the story-hour run can read it like a brief.

Usage: python3 pipeline/scripts/pop_idea.py          -> first SHORT idea (ideas not starting with [LONG] / format!=long)
       python3 pipeline/scripts/pop_idea.py --long   -> first LONG idea (printed without the [LONG] prefix)
Empty output = none queued.
Safe like set_status.py: fetch, edit, push, retry.
"""
import json, subprocess, sys, time

def git(*a, check=True):
    return subprocess.run(['git', *a], check=check, capture_output=True, text=True)

def is_long(x):
    if isinstance(x, dict):
        return x.get('format') == 'long'
    return str(x).lstrip().upper().startswith('[LONG]')

def render(x, want_long):
    """Turn a queued idea into the text the daily run treats as 'the story'."""
    if isinstance(x, dict):
        lines = [f"OWNER DRAFT: {x.get('title', '(untitled)')}"]
        if x.get('story'):
            lines.append("")
            lines.append("STORY (as the owner wrote it):")
            lines.append(x['story'])
        if x.get('scenes'):
            lines.append("")
            lines.append("SCENES THE OWNER ALREADY SKETCHED (research, fact-check, fill gaps, reorder or add scenes as needed):")
            lines.append(x['scenes'])
        lines.append("")
        lines.append(
            "Treat this as the owner's own idea with a draft already attached: research and fact-check every "
            "claim in it, keep what already works, add or fix anything missing (facts, scenes, hook), and tell "
            "the owner in telegram.md what you changed or added versus their draft before they approve."
        )
        return "\n".join(lines)
    idea = x.lstrip()
    if want_long:
        idea = idea[len('[LONG]'):].strip() if idea.upper().startswith('[LONG]') else idea
    return idea

if git('status', '--porcelain', '--untracked-files=no').stdout.strip():
    sys.exit('working tree has uncommitted changes: commit and push them first')
for attempt in range(8):
    git('fetch', 'origin', 'main'); git('reset', '--hard', 'FETCH_HEAD')
    st = json.load(open('state.json'))
    ideas = st.get('ideas') or []
    want_long = '--long' in sys.argv
    pick = [i for i, x in enumerate(ideas) if is_long(x) == want_long]
    if not pick: sys.exit(0)
    idx = pick[0]
    raw = ideas.pop(idx); st['ideas'] = ideas
    out = render(raw, want_long)
    json.dump(st, open('state.json', 'w'), indent=2, ensure_ascii=False); open('state.json', 'a').write('\n')
    git('add', 'state.json'); git('commit', '-m', 'take owner idea from dashboard queue')
    if git('push', 'origin', 'HEAD:main', check=False).returncode == 0:
        print(out); sys.exit(0)
    time.sleep(3 + attempt * 2)
sys.exit('could not push state.json after 8 tries')
