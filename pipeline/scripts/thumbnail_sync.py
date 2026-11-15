#!/usr/bin/env python3
"""Set the custom YouTube thumbnail for every queued job, WITHOUT using any Claude session or tokens.

Runs on GitHub Actions on a 15-minute cron. Calls Composio's REST API directly (no MCP/Claude in the
loop) using the YT_CONNECTED_ACCOUNT_ID account, which is already connected and is the same one Claude's
scheduled run used to use for this (see PIPELINE.md step 4b, now removed since this replaces it).

For every job with yt_queued_at set, no yt_thumb_set yet, and queued more than 20 minutes ago:
  1. YOUTUBE_LIST_PLAYLIST_ITEMS on the uploads playlist (includes private/scheduled videos).
  2. Match the job by its meta.json title.
  3. YOUTUBE_UPDATE_THUMBNAIL with jobs/<id>/thumbnail.jpg's raw GitHub URL.
  4. Write yt_video_id + yt_thumb_set (UTC time) on the job.

If a job isn't in the playlist yet, Zapier hasn't uploaded it yet -> try again next run (15 min later).
Exits 0 either way; never blocks the rest of the pipeline. Edits state.json in place; the workflow commits it.
"""
import json, os, sys, datetime as dt, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PLAYLIST_ID = 'UUyNCq5TQLEzCU87Qb7XMfEA'
YT_ACCOUNT_ID = os.environ.get('YT_CONNECTED_ACCOUNT_ID', 'youtube_wiggen-toy')
API_KEY = os.environ['COMPOSIO_API_KEY']
BASE = 'https://backend.composio.dev/api/v3/tools/execute'

now = dt.datetime.now(dt.timezone.utc)
iso = lambda t: dt.datetime.fromisoformat(t.replace('Z', '+00:00'))
stamp = now.strftime('%Y-%m-%dT%H:%M:%SZ')
norm = lambda s: ' '.join(str(s).lower().split())


def composio(tool_slug, arguments):
    req = urllib.request.Request(
        f'{BASE}/{tool_slug}',
        data=json.dumps({'arguments': arguments, 'connected_account_id': YT_ACCOUNT_ID}).encode(),
        headers={'x-api-key': API_KEY, 'Content-Type': 'application/json'},
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def note(j, msg):
    j.setdefault('progress', []).append({'t': stamp, 'msg': msg})
    j['progress'] = j['progress'][-40:]
    j['progress_count'] = j.get('progress_count', 0) + 1


def main():
    st = json.load(open(os.path.join(ROOT, 'state.json')))
    jobs = st.get('jobs', {})
    pending = []
    for jid, j in jobs.items():
        if not jid[:1].isdigit() or not j.get('yt_queued_at') or j.get('yt_thumb_set'):
            continue
        if now - iso(j['yt_queued_at']) < dt.timedelta(minutes=20):
            continue
        if not os.path.exists(os.path.join(ROOT, 'jobs', jid, 'thumbnail.jpg')):
            continue
        pending.append(jid)
    if not pending:
        print('thumbnail_sync: nothing pending')
        return

    try:
        resp = composio('YOUTUBE_LIST_PLAYLIST_ITEMS', {
            'playlistId': PLAYLIST_ID, 'part': 'snippet,status', 'maxResults': 20,
        })
    except urllib.error.HTTPError as e:
        print('thumbnail_sync: playlist list failed', e.code, e.read()[:500])
        return

    items = ((resp.get('data') or {}).get('response_data') or {}).get('items') or (resp.get('data') or {}).get('items') or []
    by_title = {norm((it.get('snippet') or {}).get('title', '')): (it.get('snippet') or {}).get('resourceId', {}).get('videoId')
                for it in items}

    changed = False
    for jid in pending:
        j = jobs[jid]
        try:
            title = json.load(open(os.path.join(ROOT, 'jobs', jid, 'meta.json'))).get('title', '')
        except Exception:
            continue
        vid = by_title.get(norm(title))
        if not vid:
            print('thumbnail_sync: not in playlist yet ->', jid)
            continue
        url = f'https://raw.githubusercontent.com/Ghazanaqeel7/sneakydeals-pipeline/main/jobs/{jid}/thumbnail.jpg'
        try:
            composio('YOUTUBE_UPDATE_THUMBNAIL', {'videoId': vid, 'thumbnailUrl': url})
        except urllib.error.HTTPError as e:
            print('thumbnail_sync: set failed', jid, e.code, e.read()[:500])
            continue
        j['yt_video_id'] = vid
        j['yt_thumb_set'] = stamp
        note(j, f'\U0001f5bc Thumbnail set on YouTube (auto, no Claude tokens used).')
        changed = True
        print('thumbnail_sync: set thumbnail for', jid, vid)

    if changed:
        json.dump(st, open(os.path.join(ROOT, 'state.json'), 'w'), indent=2, ensure_ascii=False)
        open(os.path.join(ROOT, 'state.json'), 'a').write('\n')


if __name__ == '__main__':
    main()
