#!/usr/bin/env python3
"""Apply Claude's reading of ONE pending state.json["inbox"] item: push any short/long ideas it
contained into state.json["ideas"], append any instructions-for-the-system into docs/playbook.md's
"## Owner instructions" section, and mark the inbox item processed with a summary.

The classification itself (which lines are a short idea, a long idea, or an instruction) is Claude's
job, not this script's — this script only does the mechanical, race-safe file write, the same
fetch/edit/push/retry pattern as pop_idea.py and set_status.py.

Usage: python3 pipeline/scripts/inbox_process.py payload.json
payload.json:
{
  "index": 0,                         // index into state.json["inbox"] (must still be "pending")
  "ideas": [                          // optional, each becomes a draft idea object
    {"format": "short"|"long", "title": "...", "story": "...", "scenes": ""}
  ],
  "instructions": ["...", "..."],     // optional, appended to docs/playbook.md Owner instructions
  "summary": "Added 2 short ideas, 1 long idea, saved 3 rules to the playbook."
}
"""
import json, subprocess, sys, time
from datetime import datetime, timezone

PLAYBOOK = 'docs/playbook.md'
SECTION_HEADER = '## Owner instructions'
SECTION_NOTE = ('_Pasted by the owner via the dashboard Inbox. Claude follows these from now on and never '
                'removes or rewrites them in the weekly rewrite; only the owner can edit/delete a line here._')

def git(*a, check=True):
    return subprocess.run(['git', *a], check=check, capture_output=True, text=True)

def now_iso():
    return datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')

def today_label():
    return datetime.now(timezone.utc).strftime('%d %b %Y')

def add_instructions(text, lines):
    if not lines:
        return text
    bullets = '\n'.join(f'- [owner {today_label()}] {l}' for l in lines)
    if SECTION_HEADER in text:
        head, rest = text.split(SECTION_HEADER, 1)
        # rest starts right after the header; keep its existing note line(s), append bullets
        # before the next "## " section (or end of file)
        parts = rest.split('\n## ', 1)
        body = parts[0]
        tail = '\n## ' + parts[1] if len(parts) > 1 else ''
        if not body.strip():
            body = '\n' + SECTION_NOTE + '\n'
        body = body.rstrip('\n') + '\n' + bullets + '\n'
        return head + SECTION_HEADER + body + tail
    # section doesn't exist yet: insert right after the first "## " section's heading line,
    # i.e. right before the second "## " occurrence, so it reads naturally after the intro.
    marker = '\n## '
    first = text.find(marker)
    if first == -1:
        return text.rstrip('\n') + f'\n\n{SECTION_HEADER}\n{SECTION_NOTE}\n{bullets}\n'
    second = text.find(marker, first + 1)
    insert_at = second if second != -1 else len(text)
    block = f'\n{SECTION_HEADER}\n{SECTION_NOTE}\n{bullets}\n'
    return text[:insert_at] + block + text[insert_at:]

def main():
    if len(sys.argv) != 2:
        sys.exit('usage: inbox_process.py payload.json')
    payload = json.load(open(sys.argv[1]))
    idx = payload['index']
    new_ideas = payload.get('ideas') or []
    instructions = payload.get('instructions') or []
    summary = payload.get('summary') or ''

    if git('status', '--porcelain', '--untracked-files=no').stdout.strip():
        sys.exit('working tree has uncommitted changes: commit and push them first')

    for attempt in range(8):
        git('fetch', 'origin', 'main'); git('reset', '--hard', 'FETCH_HEAD')
        st = json.load(open('state.json'))
        inbox = st.get('inbox') or []
        if idx >= len(inbox) or inbox[idx].get('status') != 'pending':
            sys.exit(f'inbox[{idx}] is not a pending item (already processed, or index moved) — re-check state.json')

        ts = now_iso()
        for i in new_ideas:
            st.setdefault('ideas', []).append({
                'kind': 'draft',
                'format': 'long' if i.get('format') == 'long' else 'short',
                'title': i.get('title', '(untitled)'),
                'story': i.get('story', ''),
                'scenes': i.get('scenes', ''),
                'submitted_at': ts,
                'source': 'inbox',
            })
        inbox[idx]['status'] = 'processed'
        inbox[idx]['processed_at'] = ts
        inbox[idx]['result'] = summary
        st['inbox'] = inbox
        json.dump(st, open('state.json', 'w'), indent=2, ensure_ascii=False)
        open('state.json', 'a').write('\n')

        if instructions:
            playbook = open(PLAYBOOK).read()
            open(PLAYBOOK, 'w').write(add_instructions(playbook, instructions))
            git('add', PLAYBOOK)

        git('add', 'state.json')
        git('commit', '-m', f'inbox: processed item {idx} ({len(new_ideas)} idea(s), {len(instructions)} instruction(s))')
        if git('push', 'origin', 'HEAD:main', check=False).returncode == 0:
            print(summary or 'done')
            return
        time.sleep(3 + attempt * 2)
    sys.exit('could not push after 8 tries')

if __name__ == '__main__':
    main()
