#!/usr/bin/env python3
"""Post a progress update for a job. n8n forwards new updates to the owner's Slack channel within ~1 minute.

Usage: python3 pipeline/scripts/progress.py <job_id> "🎙 Voice done (56 s). Building scene 3/7: the land office"
       python3 pipeline/scripts/progress.py <job_id> --image jobs/<id>/review/round1.jpg "🔍 Check frames, round 1"
--image: a JPG/PNG already committed AND pushed (keep it under ~1 MB); n8n posts it into Slack with the text.
Only touches state.json (fetch + reset + append + push, retried), so commit/push your own files first.
Keep each update one short line, written for the owner (simple English or Roman Urdu), no jargon.
"""
import json, subprocess, sys, time, datetime

def git(*a, check=True):
    return subprocess.run(['git', *a], check=check, capture_output=True, text=True)

def main():
    args = sys.argv[1:]; image = None
    if '--image' in args:
        i = args.index('--image'); image = args[i + 1]; del args[i:i + 2]
    job, text = args[0], ' '.join(args[1:]).strip()
    if not text: sys.exit('empty message')
    if git('status', '--porcelain', '--untracked-files=no').stdout.strip():
        sys.exit('working tree has uncommitted changes: commit and push them first')
    for attempt in range(8):
        git('fetch', 'origin', 'main'); git('reset', '--hard', 'FETCH_HEAD')
        st = json.load(open('state.json'))
        j = st['jobs'].setdefault(job, {})
        p = j.setdefault('progress', [])
        e = {'t': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'msg': text[:300]}
        if image: e['image'] = image
        p.append(e)
        j['progress_count'] = j.get('progress_count', 0) + 1     # total ever posted; n8n uses it to know what is new
        j['progress'] = p[-15:]
        json.dump(st, open('state.json', 'w'), indent=2, ensure_ascii=False); open('state.json', 'a').write('\n')
        git('add', 'state.json'); git('commit', '-m', f'{job}: progress')
        if git('push', 'origin', 'HEAD:main', check=False).returncode == 0:
            print('posted:', text); return
        time.sleep(3 + attempt * 2)
    sys.exit('could not push progress after 8 tries')

if __name__ == '__main__':
    main()
