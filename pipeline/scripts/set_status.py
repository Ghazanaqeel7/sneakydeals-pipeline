#!/usr/bin/env python3
"""Change a job's status in state.json and push it, safely (retries if someone else pushed first).

Usage: python3 pipeline/scripts/set_status.py <job_id> <status> [key=value ...]
Commit and push your other files FIRST; this script only touches state.json.
n8n edits state.json too (through the GitHub API), so never hand-edit + force-push it.
"""
import json, subprocess, sys, time, datetime
STATUSES = ['script_ready', 'script_sent', 'script_approved', 'script_rejected', 'building', 'render_queued',
            'rendering', 'video_ready', 'video_sent', 'video_approved', 'video_rejected', 'render_failed',
            'published', 'dropped']

def git(*a, check=True):
    return subprocess.run(['git', *a], check=check, capture_output=True, text=True)

def main():
    job, status, *kv = sys.argv[1:]
    if status not in STATUSES: sys.exit(f'unknown status {status}; use one of {STATUSES}')
    if status == 'script_ready' and not any(p.startswith('type=long') for p in kv):
        r = subprocess.run([sys.executable, 'pipeline/scripts/policy_check.py', job], capture_output=True, text=True)
        print(r.stdout.strip())
        if r.returncode != 0:
            sys.exit('policy check failed: fix the errors above (docs/ypp_policy.md), commit, then run set_status again')
        if git('status', '--porcelain').stdout.strip():
            git('add', f'jobs/{job}/policy.json'); git('commit', '-m', f'{job}: policy check passed')
            git('push', 'origin', 'HEAD:main', check=False)
    if git('status', '--porcelain', '--untracked-files=no').stdout.strip():
        sys.exit('working tree has uncommitted changes: commit and push them first')
    for attempt in range(8):
        git('fetch', 'origin', 'main'); git('reset', '--hard', 'FETCH_HEAD')
        st = json.load(open('state.json'))
        j = st['jobs'].setdefault(job, {})
        j['status'] = status
        j['updated'] = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
        for p in kv:
            k, v = p.split('=', 1); j[k] = v
        json.dump(st, open('state.json', 'w'), indent=2, ensure_ascii=False); open('state.json', 'a').write('\n')
        git('add', 'state.json'); git('commit', '-m', f'{job}: {status}')
        if git('push', 'origin', 'HEAD:main', check=False).returncode == 0:
            print(f'{job} -> {status}'); return
        time.sleep(3 + attempt * 2)
    sys.exit('could not push state.json after 8 tries')

if __name__ == '__main__':
    main()
