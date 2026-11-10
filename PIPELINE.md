# Sneaky Deals — production pipeline (instructions for Claude's daily run)

Channel: **Sneaky Deals** (@SneakyDeals). One-minute vertical Shorts: a TRUE business trick / strange deal / loophole
told as a cartoon mini-movie (2D cartoon people in bright 3D worlds, one-word captions). Audience: curious US adults
and teen entrepreneurs. The owner (Ghazan) approves every script and every final video on Telegram. **You never
publish, never touch YouTube, and never set an approval status yourself.**

Read this file, `docs/LEARNINGS.md` and `state.json` at the start of every run. Follow the `3d-story-shorts` skill
for story rules, look and build technique; this file overrides it where they differ (voice, folders, publishing).

## State machine (`state.json` → `jobs.<id>.status`)

| status | set by | meaning |
|---|---|---|
| `script_ready` | Claude | script + telegram.md pushed, waiting to be sent |
| `script_sent` | n8n | owner has the script in Telegram |
| `script_approved` / `script_rejected` | n8n (owner's button) | rejected jobs may carry `feedback` |
| `building` | Claude | you are making voice + scenes |
| `render_queued` | Claude | project pushed; GitHub Actions will render |
| `rendering` → `video_ready` / `render_failed` | GitHub Actions | `video_url` = release asset |
| `video_sent` | n8n | owner has the video in Telegram |
| `video_approved` / `video_rejected` | n8n (owner's button) | rejected may carry `feedback` |
| `published` | n8n | added to `feed/youtube.xml`; Zapier uploads it |
| `dropped` | n8n / Claude | abandoned |

Change status ONLY with `python3 pipeline/scripts/set_status.py <id> <status> [k=v]`, after committing and pushing
your files. Never hand-edit state.json and never force-push (n8n writes to it through the GitHub API).

## Every run, in this order (do at most ONE build per run)

The task runs **every hour**, so an approved script starts building within an hour of the owner's ✅.
**Quick exit first:** read `state.json`. If no job is `script_approved`, `render_failed`, or `*_rejected` with
`feedback`, AND it is not the story hour (step 5), stop right away with a one-line summary — do not load the skill,
install anything, or research. If another job is already `building`, do not start a second build.

0. Setup: `git config user.name "claude-pipeline"`, `git config user.email "claude-pipeline@users.noreply.github.com"`.
1. **`render_failed`**: open the failed Actions run log (`gh run view <run> --log` if `gh` works, otherwise reproduce
   with a few frames locally), fix, push, `set_status <id> render_queued`.
2. **`video_rejected` with feedback**: apply the owner's feedback exactly (it is about this video only), re-check
   stills, push, `set_status <id> render_queued feedback=` (clear it). No feedback yet → leave it for the next run.
3. **`script_rejected` with feedback**: rewrite `script.md`, `SHOTS.txt`, `telegram.md`, `meta.json` per the
   feedback, push, `set_status <id> script_ready feedback=`. No feedback yet → leave it.
4. **`script_approved`** (oldest first, one per run): `set_status <id> building`, then BUILD (below).
5. **New story** — only in the run that starts between 11:00 and 11:59 Asia/Karachi time: count jobs whose status
   is not `published`/`dropped`. If it is below `config.pipeline_buffer`, research and write ONE new script (below)
   and `set_status <id> script_ready`.
6. End with a short summary of what you did (it is shown to the owner).

## New story (script stage)

- Pick a story not already in `state.json` (check every job title/id). Prefer famous US brands and people's
  money stories (Disney, Costco, McDonald's, Nike, Coca-Cola, Apple, Amazon, IKEA, Lego, Netflix...). Ideas already
  vetted with the owner: Disney's secret swamp purchase via shell companies; Costco's $1.50 hot dog; Wrigley mailing
  free gum to every phone book address (1915); McDonald's real estate model.
- Fact-check: every on-screen claim needs **two independent sources**; leave out myths, single-source claims and
  invented quotes. Never show real people as villains. Label dramatisation.
- Script: 10-13 shots, 140-170 words, 45-60 s at ~170 wpm, numbers written as spoken words.
- **Hook rules (from the owner's feedback on video 001):** first words = the famous brand name + the shocking
  action; NEVER open with a date or "In 19xx"; ≤ 9 words; leave a question ("Seventeen of them."). The date goes later.
  Add `hookTitle` (2 short lines, e.g. ["PAID IN", "SUBMARINES?!"]) for the big text in the first shot.
- Folder: `bash pipeline/scripts/new_job.sh NNN-short-slug` (NNN = next number). Write in `jobs/<id>/`:
  - `script.md` — shot table, fact map with sources, what was left out, wording to watch
  - `SHOTS.txt` — `key | exact spoken text`, one line per shot, first key `hook`
  - `meta.json` — `title` (≤ 60 chars, brand + shock, no year), `description` (story in 2 short paragraphs,
    "⚠️ Dramatised…" line, `Sources:` list, subscribe line, 5-7 hashtags incl. #shorts), `tags` (8-10),
    `pinned_comment` (a question that invites an opinion), `thumb` (filled at build stage)
  - `telegram.md` — what the owner reads to approve (≤ 3500 chars, plain text): title, hook, the full narration
    shot by shot, 3-5 key facts each with its 2 sources, what you left out and why. Write it in simple English.
- Commit + push, then `set_status <id> script_ready title="<title>"`.

## Build (after `script_approved`)

**Progress updates:** the owner watches the build in Slack. After each milestone run
`python3 pipeline/scripts/progress.py <id> "<one short line>"` (commit/push your files first). Post at least:
"🎙 Voice ban rahi hai…", "🎙 Voice tayyar (NN s)", "🎬 Scenes: N locations plan — <names>", one line per location
built ("🏗 Scene 2/6 tayyar: land office"), "🔍 Check frames round 1: <what you are fixing>", "✅ Check frames clean",
"🖼 Thumbnail tayyar". Keep it to ~6-12 updates per build, simple words, no tech jargon.

1. Voice: `python3 pipeline/scripts/make_voice.py jobs/<id>` → `RAW.wav`, then
   `python3 pipeline/scripts/prepare_voice.py jobs/<id>/RAW.wav jobs/<id>/SHOTS.txt jobs/<id>/project`.
   Then `ffmpeg -i project/voiceover.wav -b:a 192k project/voiceover.mp3` and delete `voiceover.wav` (repo size).
   Add `"hookTitle": [...]` to `project/src/timing.json`. Keep the channel voice; never swap it.
2. Scenes: follow the skill's Step 4 and "The look" exactly (busy frames, characters 35-50 % of frame height,
   camera always moving, word-synced events, cream dips). `project/src/extra-props.js` has submarine, warship,
   bottle, onion-dome tower, kiosk, brick wall. Look at `jobs/001-pepsi-submarines/project/src/worlds.js` +
   `camera.js` for a complete working example (harbour, square, warehouse, plant, scrapyard, office, hall).
   First shot: open on a close-up of the brand's object and reveal the big picture by the shock word.
   Brand NAMES on signs/crates are fine; brand LOGOS (or look-alikes) are never drawn.
3. Stills: `bash pipeline/scripts/stills.sh jobs/<id>/project a <frames>` (needs `npm ci` in the project first).
   Check the skill's list (faces, labels, captions, nothing cut off, camera not inside walls, not too dark/bright,
   busy, facts right). Iterate until clean. Do not render the full video yourself — Actions does it.
4. Thumbnail: choose a hook-shot frame, fill `meta.json.thumb` {frame, box, line1, line2, box_color}, run
   `python3 pipeline/thumbnail/make_thumb.py jobs/<id>`, look at the result. No year, no twist on the thumbnail.
5. Do not commit `node_modules/`, `out/`, `stills/`, `RAW.wav` (see .gitignore). Commit + push, then
   `set_status <id> render_queued`.

## Never
- publish, upload, or change anything on YouTube/Instagram/Facebook
- set `*_approved`, `published`, or change a job the owner has not released to you
- copy another creator's script, characters or sets; draw real logos; invent quotes; state myths as facts
- make the channel repetitive: each video must be a genuinely different story with its own sets and events
