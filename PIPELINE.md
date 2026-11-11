# Sneaky Deals — production pipeline (instructions for Claude's daily run)

Channel: **Sneaky Deals** (@SneakyDeals). One-minute vertical Shorts: a TRUE business trick / strange deal / loophole
told as a cartoon mini-movie (2D cartoon people in bright 3D worlds, one-word captions). Audience: curious US adults
and teen entrepreneurs. The owner (Ghazan) approves every script and every final video on Telegram. **You never
publish, never touch YouTube, and never set an approval status yourself.**

Read this file, `docs/LEARNINGS.md` and `state.json` at the start of every run. Follow the `3d-story-shorts` skill
for story rules, look and build technique; this file overrides it where they differ (voice, folders, publishing).

## Dashboard

The owner also has a web dashboard (`docs/index.html`, GitHub Pages). From it they can approve/reject exactly like
the Slack buttons (the job gets `decided_via: dashboard`), edit `script.md` before approval (`script_edited` is set —
build from the edited file), edit `meta.json` title/description/tags/pinned comment (never overwrite those edits
later), change `config.publish_days`, and queue story ideas in `state.json["ideas"]`. Treat all of these as the
owner's instructions.

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
2. **Before touching any `*_rejected` job, tell the owner you started:** `python3 pipeline/scripts/progress.py <id>
   "🛠 Aapke changes laga raha hoon: <1-line summary of what you will change> (~<eta>)"`, then post a progress line at
   each step (fixed shots → check frames image → render queued). The owner sees these in Slack and on the dashboard.
   **`video_rejected` with feedback that is ONLY about the thumbnail** (starts with `thumbnail:`, or the note clearly talks only about the thumbnail; identical duplicate notes count once): change only
   `meta.json.thumb` / the frame, re-run `make_thumb.py`, look at it, push, then
   `set_status <id> video_ready feedback=` — do NOT re-render; n8n re-posts the video with the new thumbnail.
   **`video_rejected` with any other feedback**: apply the owner's feedback exactly (it is about this video only), re-check
   stills, push, `set_status <id> render_queued feedback=` (clear it). No feedback yet → leave it for the next run.
3. **`script_rejected` with feedback**: rewrite `script.md`, `SHOTS.txt`, `telegram.md`, `meta.json` per the
   feedback, push, `set_status <id> script_ready feedback=`. No feedback yet → leave it.
4. **`script_approved`** (oldest first, one per run): `set_status <id> building`, then BUILD (below).
5. **New story** — only in the run that starts between 11:00 and 11:59 Asia/Karachi time: count jobs (ids that start
   with a number; `research` / `weekly-review` are not jobs) whose status is not `published`/`dropped`. If it is below `config.pipeline_buffer`, research and write ONE new script (below)
   and `set_status <id> script_ready`. **Owner ideas first:** run `python3 pipeline/scripts/pop_idea.py`; if it
   prints an idea (queued by the owner on the dashboard), that is the story — research it, and if it is not true or
   not usable, say so in the script message and pick your own instead.
   **Then the content calendar:** if no owner idea, open `docs/calendar.json` and take the first item (top to bottom)
   with `status: "planned"` — its topic/angle/title are the brief (still fact-check; the title is a draft). After you
   push the script, set that item's `status` to `"scripted"` and `"job": "<id>"`, commit + push. If the item is
   `format: "long"`, make it as a Short for now (long-form production does not exist yet) and keep its long idea in
   `long_later`. Only if the calendar has no planned item, pick your own story.
6. **Weekly learning** — only in the Monday story-hour run (Monday 11:00-11:59 Asia/Karachi). See "Weekly learning"
   below. Runs from the first week; with few videos everything is labelled "early signal".
   **On Mondays do step 6 before step 5**, so the day's new story already comes from the new calendar.
7. End with a short summary of what you did (it is shown to the owner).

## New story (script stage)

- **Playbook first:** read `docs/playbook.md` and follow it (topics, titles, hooks, length). It is the system's
  learned rulebook; where it conflicts with the older bullets below, the playbook wins (except fact-checking and the
  Never list).
- **Research:** read `docs/research/latest.json` (made daily 06:00 PKT by the research bot, also shown on the dashboard
  Research page) and `docs/research/trends.json` (`rising.brands` / `rising.words` = what grew over the last 7 days). `shorts` / `long` = videos doing many times better than their channel's normal (`score`);
  `hot_words` = words that keep showing up in those titles; `suggestions` = what people type into YouTube search.
  Prefer a story whose topic matches what is breaking out right now, told our own way: never copy a competitor's
  script, title or angle. Owner ideas from the Research page arrive in the ideas queue as
  "<their title> — <channel> (views, score)": that is a topic signal, so research the true story behind it.
- **Title check:** `title_checks.<id>.suggestions` lists real searches for the brand in the title; reuse their words
  in the title/description where it reads naturally.

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
    `pinned_comment` (a question that invites an opinion), `thumb` (filled at build stage),
    `instagram` {`caption`, `hashtags`} and `facebook` {`title`, `description`, `hashtags`} — written for each
    platform, not copied from YouTube (see "Instagram + Facebook" below)
  - `telegram.md` — what the owner reads to approve (≤ 3500 chars, plain text): title, hook, the full narration
    shot by shot, 3-5 key facts each with its 2 sources, what you left out and why. Write it in simple English.
- Commit + push, then `set_status <id> script_ready title="<title>"`.

## Build (after `script_approved`)

**Progress updates:** the owner watches the build in Slack. After each milestone run
`python3 pipeline/scripts/progress.py <id> "<one short line>"` (commit/push your files first). Post at least:
"🎙 Voice ban rahi hai…", "🎙 Voice tayyar (NN s)", "🎬 Scenes: N locations plan — <names>", one line per location
built ("🏗 Scene 2/6 tayyar: land office"), "🔍 Check frames round 1: <what you are fixing>", "✅ Check frames clean",
"🖼 Thumbnail tayyar". Keep it to ~6-12 updates per build, simple words, no tech jargon.
**End every progress line with the time left**, e.g. "(~45 min baqi, phir render ~40 min)". Typical budget:
voice 3-5 min, scenes 30-60 min (≈5-8 min per location), check-frame rounds 10-20 min, thumbnail 3 min, then
GitHub render 30-50 min. Update the estimate as you go; if something takes longer, say so and why.
**Show the owner the scenes:** after each check-frames round, save the contact sheet as
`jobs/<id>/review/roundN.jpg` (JPG, ≤ 1600 px wide, < 1 MB), commit + push it, then
`progress.py <id> --image jobs/<id>/review/roundN.jpg "🔍 Check frames round N: <what you see / will fix>"`.
Also post the final thumbnail the same way (`--image jobs/<id>/thumbnail.jpg`).

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
   The thumbnail must be a JPG under 2 MB: on publish day n8n puts its raw URL in the feed item <link>, and Zapier sets it as the YouTube thumbnail (if missing, assets/default_thumbnail.jpg is used).
5. Do not commit `node_modules/`, `out/`, `stills/`, `RAW.wav` (see .gitignore). Commit + push, then
   `set_status <id> render_queued`.

## Instagram + Facebook

On publish day, right after the YouTube feed item, n8n adds the same video to `feed/reels.xml` (Zap → Instagram
Reel on @sneakydealstv) and `feed/facebook.xml` (Zap → Sneaky Deals Facebook Page), and sets `ig_at` / `fb_at` on
the job. `config.reels: false` switches both off. The owner sees the three platforms on each job page and can edit
the Instagram/Facebook text in the "Instagram · Facebook" tab until it is sent (never overwrite those edits).

**Write `meta.json.instagram` and `meta.json.facebook` at the script stage** (and rewrite them when a script is
rejected). Each platform has its own audience and search, so research them for this story — a few web searches on
current Instagram Reels / Facebook Reels caption and hashtag practice for business/history content, plus the
playbook's Instagram/Facebook rules; use the `ig-caption` skill if it is available.
- `instagram.caption`: first line = the hook, ≤ 125 characters (that is all people see before "more"), with the
  brand + key words people search for (Instagram captions are searchable). Then 2-4 short lines of story, one
  question that invites comments, one CTA (follow / save / share). No links (not clickable), no "#shorts",
  no "subscribe". Plain line breaks, ≤ 2,200 characters.
- `instagram.hashtags`: 3-5 precise tags (Instagram allows at most 5): 1-2 topic/brand tags + 1-2 niche tags
  (e.g. #businesshistory) + #sneakydeals. No giant generic tags only.
- `facebook.title`: brand + shock, ≤ 80 characters. `facebook.description`: 2-3 short sentences, end with a question;
  `facebook.hashtags`: 0-3.
- Same facts as the YouTube script, no new claims. The dramatisation note may be shortened to one line.

Reels need: 9:16, 3-90 s (Facebook API limit), ≥ 540x960 — our 720x1280, 45-60 s files fit. Keep big text and
captions out of the bottom ~third of the frame where IG/FB put their caption and buttons. You never publish anything
yourself.

## Weekly learning (research data → playbook → Slack)

This is how the system trains itself. Free data first; vidIQ only if credits are left (`vidiq_balance` ≥ 25).
1. Read `docs/research/own_videos.json` (refreshed hourly by `.github/workflows/stats.yml`: channel subscribers/views over time, every video's views, last-24 h views, views at 1/3/7 days, likes, comments, length), `docs/research/trends.json`
   (30-day memory: rising/falling brands and words, title patterns of this week's hits) and `docs/research/latest.json`.
   Instagram/Facebook numbers are not readable automatically yet: use what the owner shares (screenshots/notes in
   Slack or the ideas queue) and keep the playbook's Instagram/Facebook rules at [start]/[signal] until then.
   If vidIQ credits allow: `vidiq_channel_analytics` top_videos for the last 28 days (averageViewPercentage,
   engagedViews, subscribersGained) — retention is the one thing the free data does not have.
2. Compare our videos with each other at the same age (views_3d is the fairest). Look for patterns: topic, brand,
   hook type, title pattern, length. Compare our titles with the niche's hit patterns. Only claim what the numbers
   support; with fewer than ~6 videos say "early signal".
3. Write `docs/reviews/<YYYY-MM-DD>.md` (table of our videos + 3-6 lessons + 2-3 concrete changes for next week).
   **Rewrite `docs/playbook.md`**: keep it short; every rule labelled [proven] (our numbers), [signal] (niche data)
   or [start] (untested); upgrade/downgrade labels as evidence arrives; drop rules the data contradicts; update the
   "Last updated" line. Keep owner-written lines unless the owner removed them. Append the strongest lessons to
   `docs/LEARNINGS.md` (one dated line each; update a conflicting older line instead of adding a second one).
4. **Write this week's content calendar** in `docs/calendar.json` (move the old file to
   `docs/calendar/<its week>.json` first). `week` = this Monday's date. One item per publish day in
   `config.publish_days`, in order; pattern: Shorts on Mon/Wed/Fri/Sun, long-form on Tue/Thu/Sat (owner's plan). Each
   item: `day` ("Mon 16 Nov"), `format` ("short"/"long"), `topic` (the true story in one line), `angle`, `title`
   (draft, playbook rules), `why` (the data behind it: research score / trend / our own results, one line),
   `status: "planned"`. Owner ideas still in the queue go first. Never repeat a story already in `state.json`.
   Keep a planned item from last week that was never scripted only if it is still a good fit.
5. Commit + push, then post 5-8 short lines to the owner with
   `python3 pipeline/scripts/progress.py weekly-review "<line>"` — e.g. "📊 Hafta: 4 Shorts, 12.4K views, +86 subs",
   "🥇 Best: Disney swamp — 3 din mein 8K views (hook: brand + secret)", "📈 Niche mein barh raha: Pepsi, Sears",
   "🧠 Playbook update: …", "🧪 Agle hafte test: …", and the calendar in 2-3 lines
   ("📅 Is hafte: Mon Pudding Guy · Tue (long) Blockbuster …"). Simple Roman Urdu/English.

## Never
- publish, upload, or change anything on YouTube/Instagram/Facebook
- set `*_approved`, `published`, or change a job the owner has not released to you
- copy another creator's script, characters or sets; draw real logos; invent quotes; state myths as facts
- make the channel repetitive: each video must be a genuinely different story with its own sets and events
