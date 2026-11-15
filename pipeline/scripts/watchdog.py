#!/usr/bin/env python3
"""Watchdog — runs on GitHub Actions (NOT inside a Claude session), so it still works even if every
Claude scheduled run that day errors out or hits a usage limit before touching the repo at all.

Checks the one thing the owner actually cares about: did today's Short get written? If not, and the day's
last scheduled Claude run (22:08 PKT) should already be done, write docs/alerts.json with a plain-language
reason so the dashboard shows it, and ping Slack directly (same secrets as pipeline/bot/run.mjs) if configured.

Clears the alert automatically once last_story_date catches up — nothing to undo by hand.
"""
import json, os, subprocess, sys, urllib.request
from zoneinfo import ZoneInfo
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STATE = os.path.join(ROOT, 'state.json')
ALERTS = os.path.join(ROOT, 'docs', 'alerts.json')
PKT = ZoneInfo('Asia/Karachi')

# After this PKT hour, the 22:08 run has had time to finish — if the script still isn't written, it's stuck.
CUTOFF_HOUR = 23


def slack_notify(text):
    token = os.environ.get('SLACK_BOT_TOKEN')
    channel = os.environ.get('SLACK_CHANNEL_ID')
    if not token or not channel:
        return
    body = json.dumps({'channel': channel, 'text': text}).encode()
    req = urllib.request.Request(
        'https://slack.com/api/chat.postMessage', data=body,
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
    )
    try:
        urllib.request.urlopen(req, timeout=15)
    except Exception as e:
        print('slack notify failed:', e)


def main():
    now = datetime.now(PKT)
    today = now.strftime('%Y-%m-%d')
    state = json.load(open(STATE))
    last_story_date = state.get('last_story_date')

    alerts = []
    if json_exists := os.path.exists(ALERTS):
        try:
            alerts = json.load(open(ALERTS))
        except Exception:
            alerts = []
    had_active = any(a.get('id') == 'script_missing' for a in alerts)

    script_done = last_story_date == today
    past_cutoff = now.hour >= CUTOFF_HOUR

    if script_done:
        if had_active:
            alerts = [a for a in alerts if a.get('id') != 'script_missing']
            print('script written — cleared script_missing alert')
    elif past_cutoff:
        if not had_active:
            msg = (f"Aaj ({today}) ki script abhi nahi likhi gayi — 11:08, 16:08 aur 22:08 PKT "
                   f"wale teenon scheduled runs ya miss hue ya error ho gaye (Claude session side se, "
                   f"usage limit ya koi aur wajah se). Dashboard ya Slack check karein, ya khud bol kar "
                   f"'aj ki script likho' bhej dein.")
            alerts.append({'id': 'script_missing', 'since': now.isoformat(), 'date': today, 'message': msg})
            slack_notify(f"⚠️ {msg}")
            print('new alert: script_missing')
        else:
            print('script_missing alert already active, not re-notifying')
    else:
        print(f"not past cutoff yet ({now.hour}:xx PKT < {CUTOFF_HOUR}:00) and script not written — waiting")

    os.makedirs(os.path.dirname(ALERTS), exist_ok=True)
    with open(ALERTS, 'w') as f:
        json.dump(alerts, f, indent=2, ensure_ascii=False)

    changed = subprocess.run(['git', '-C', ROOT, 'status', '--porcelain', 'docs/alerts.json'],
                              capture_output=True, text=True).stdout.strip()
    if changed:
        subprocess.run(['git', '-C', ROOT, 'config', 'user.email', 'watchdog@sneakydeals'], check=True)
        subprocess.run(['git', '-C', ROOT, 'config', 'user.name', 'watchdog-bot'], check=True)
        subprocess.run(['git', '-C', ROOT, 'add', 'docs/alerts.json'], check=True)
        subprocess.run(['git', '-C', ROOT, 'commit', '-m', f'watchdog: {"clear" if script_done else "alert"} {today}'], check=True)
        for attempt in range(3):
            pull = subprocess.run(['git', '-C', ROOT, 'pull', '--rebase', 'origin', 'main'], capture_output=True, text=True)
            push = subprocess.run(['git', '-C', ROOT, 'push', 'origin', 'main'], capture_output=True, text=True)
            if push.returncode == 0:
                break
            print('push retry', attempt, pull.stdout, pull.stderr, push.stdout, push.stderr)
    else:
        print('no change to docs/alerts.json')


if __name__ == '__main__':
    sys.exit(main())
