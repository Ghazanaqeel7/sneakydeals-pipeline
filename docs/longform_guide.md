# Long-form (documentary) videos — Claude's guide

Only when `state.json config.longform_enabled` is true. Long jobs are numeric-id jobs with `"type": "long"` (set with
`set_status <id> script_ready type=long`). Shorts rules in PIPELINE.md do not change; this file adds the long-form path.

## Format (non-negotiable)
- 12-15 min (1,800-2,250 words at ~150 wpm; never under 1,200). 16:9.
- **REVISED 22 Nov 2026 (owner rejected job 013 as "bikar" / boring, too numbers-heavy, wants Shorts-level attention):**
  cast/character scenes are now the PRIMARY visual, not an accent. Every scene should default to a `title`/`headline`-with-`cast`
  or a `compare` with both sides' `cast`/`char` acting out the moment — charts/stat/map/timeline are now the EXCEPTION, used only
  for one or two moments that truly need a number (never two chart-type scenes back to back). If a draft scene list has more than
  ~20% chart/stat/map/timeline scenes, rewrite it before building. See "Attention rules" below.
- **ENGINE CHANGE requested 22 Nov 2026 (owner: "shorts wala he kardo long video mai")** — owner wants long-form to use the
  SAME 3D engine as the Shorts (`pipeline/template/`: three.js + `@react-three/fiber`, flat 2D cartoon cast inside a bright
  3D world, moving camera), not the current flat 2D "cast card" look. See "3D engine integration" below — this is a real,
  not-yet-finished build, tracked here so it survives a context reset.
- **News hook + evergreen backstory**: cold open = a real headline of this week (from `docs/research/news_hooks.json` or the
  owner's `[LONG]` idea), then "but how did we get here?" and the full story. Business/money/consumer brands only; skip politics, tragedies, wars.
- Structure: cold open with the outcome (no "welcome back") -> setup -> ONE decision -> consequences (cause -> effect) ->
  aftermath with numbers -> one lesson + the link back to this week's news -> end card. A new visual every 8-15 s.
- Facts: write `jobs/<id>/factmap.md` first: every number/date/claim with **2 independent sources** (URLs). Drop what you cannot confirm.
  No invented quotes, no unlicensed news clips, no logos/trademarks drawn (use the icon/headline cards), no defamation:
  say "reported", "according to", and keep to court/official/company-filed facts.
- Do not copy source wording; rewrite in the channel voice (short, concrete, numbers, no hype adjectives).

## Files to write for a job (`pipeline/longform/new_long_job.sh <id>` creates the folder)
- `jobs/<id>/script.md` (readable script, with sections), `factmap.md`, `telegram.md` (short summary for Slack),
  `meta.json` (`type:"long"`, `title` <=100 chars, `description`, `tags`, `pinned_comment`, `news_hook:{title,url,source}`).
- `jobs/<id>/project/src/scenes.json` = `{ "title": "...", "scenes": [ {id, text, tone, chapter?, visual} ] }`
  `text` = exact narration of that scene (one voice file per scene; durations come from it). `chapter` = YouTube chapter name (>=3, each >=10 s apart).
  `visual` = one object or an array of beats (`at`: 0-1 position inside the scene; default evenly spaced).
- `jobs/<id>/project/src/thumb.json` = `{image:{q}, icon, line1, line2, box, box_color, line_color}` (1280x720, <=4 words big).

## Visual types (`visual.type`)
title{text,sub,accent[],align,size,cast[]} · chapter{number,title} · photo{image:{q},move,grade,caption,fallback:{icon,label},frame} ·
stat{from,to,prefix,suffix,decimals,label,sub,color,icon,swarm,brand:{a,b},per,cast[]} · chart{kind:line|bar,data:[{x,y}],title,unit,highlight,color,note} ·
timeline{title,events:[{year,label}]} · map{region:us|world,highlight[],pins[{lon,lat,label}],arcs[{from,to,label}],title} ·
headline{kicker,text,source,stamp,art,caption,masthead} (our own front page, invented masthead) ·
compare{title,a:{name,color,icon,char},b:{...},rows:[{label,a,b,unit,dec,win:'a'|'b'}]} ·
list{title,items:[{title,sub,icon}],numbered} · quote{text,who,source} (only exact, cited quotes) ·
illustration{title,icons:[{name,label}],arrows} · endcard{title,sub} (last scene). `tone`: dark|blue|red|paper.
Icons: store factory dollar person people building truck cart box plane car phone tv bank barcode bulb warning lock document gavel globe clock fire tag key megaphone mail screen cross check question.

### Attention rules (owner feedback 13 Nov 2026: "simple type mat dikhao"; tightened 22 Nov 2026 after job 013 rejection)
- **Cast carries almost every scene, not just the hook.** Our own cartoon characters (never a real person's likeness):
  `cast:[{side:'left'|'right'|'center', mood, outfit, suit, tie, label}]`. mood: laugh smug shock worried talk happy angry ·
  outfit: suit hoodie · `label` = the company or role ("Blockbuster", "The founder"), never a real name on a face.
  **Default every scene to having a cast** (on the `title`, `headline`, and `compare` types especially); match the mood to
  the beat (the side that loses looks worried, the winner smug). A scene with no cast and no photo of a real person/place
  needs a specific reason (it's a pure data moment) — it should be rare, not routine.
- **Numbers are a rare accent, not a running device.** Use `stat`/`chart`/`timeline`/`map` for at most 1-2 scenes in the
  whole video — only where a number is genuinely the point (e.g. the one big dollar figure in the story). Never stack two
  of these scene types back to back, and never let them replace a cast/character scene that could tell the same beat with
  people reacting to it instead. When a count needs to land, prefer `stat.icon`/`per` over a bare chart.
- **Headlines** get a `stamp` (2-3 words: "DEAL REJECTED", "BANKRUPT") and `art` (Character props shown as the front-page photo).
  `source` = a real attribution only ("Reported by Reuters"); never "reconstruction" or our own name. Omit it if there is none.
- **Compare** values may be short text ("In a store") or numbers; mark the better side with `win`. Give each side an `icon` (or `char`).
- No real logos or brand marks are drawn; a brand is its name in its colour plus an icon.
- Fonts are bundled (Anton, Playfair Display, Inter, Space Mono); every scene already gets punch-in transitions, shakes on impacts and film grain.

## 3D engine integration (wired 22 Nov 2026 — NOT yet render-tested, read before using it)
Owner wants long-form built with the same engine as the Shorts (`3d-story-shorts` skill / `pipeline/template/`), not the
old flat 2D cast-card look.

**Status: code written and wired, zero real renders yet.** No `npm install`, no `remotion render`, no GitHub Actions run
has executed any of this. Treat the first long job built with it as the test, exactly like the Shorts' "60-90 s sample"
step — not a guaranteed calendar slot.

- `pipeline/template-long/src/engine3d/` holds a copy of the Shorts engine files (`kit.js`, `char.js`, `props.js`,
  `dress.js`, `worlds.js`, `camera.js`, `extra-props.js`, `Full.jsx`). `worlds.js`, `camera.js` and `Full.jsx` are left
  UNUSED on purpose — they import the Shorts' own `timing.json` (shot-keyed) which does not exist in a long-form project
  and would crash the build. Only `kit.js`, `char.js`, `dress.js`, `props.js` (no `timing.json` dependency) are actually used.
- `pipeline/template-long/src/scenes/Scene3D.jsx` is the new renderer, registered in `Doc.jsx`'s `REGISTRY` as `scene3d`.
  It is a deliberately SIMPLER first version than the Shorts' `Full.jsx` (plain lights + fog, no bloom/sky-dome/bokeh/colour
  grade yet) so the first real render has the best chance of just working; add the extra cinematic passes back in once a
  `scene3d` scene has actually rendered once.
- **`visual.type: "scene3d"` schema for `scenes.json`** (use this now, it's implemented):
  ```json
  {"type": "scene3d",
   "location": "street | night_street | office | yard | workshop | newsroom",
   "light": "day | night | office | yard | joint | weather | morning",
   "cast": [{"palette": "engineer|student|welder|clerk|official|red|teal|mustard|pink|navy", "hat": "none|cap|bowler|top", "glasses": false, "x": -1.0, "z": 3.2, "ry": 0}],
   "camFrom": [0, 2, 10], "camTo": [2, 1.6, 6],
   "lookFrom": [0, 1, 0], "lookTo": [0, 1, 0]}
  ```
  One scene = one dressed location (ambient crowd/traffic/props come free from the location's `dress*` preset) + up to a
  few named `cast` characters placed where you want them + a camera that eases from `camFrom`/`lookFrom` to `camTo`/`lookTo`
  over the scene's duration. Mix with the usual 2D types (`title`, `compare`, etc.) in the same `scenes.json` — `scene3d`
  does not have to be every scene, just the primary one per the "Format"/"Attention rules" above.
- `validate_long.py` now accepts `scene3d` in `TYPES` and checks `location` is one of the six presets.
- `render_long.yml` / `render_chunk.sh` still render composition id `"Doc"` and needed NO changes — `scene3d` scenes render
  inside the existing `Doc` composition via the normal `<Sequence>`/`REGISTRY` mechanism, same as every other type.
- **Cost/risk to flag to the owner before relying on this for the regular calendar:** 3D frames are much heavier to render
  than the old 2D cards (headless Chrome + software GL/`swangle`, no GPU on GitHub Actions runners) — a 12-15 min video is
  roughly 12-15x a Short's frame count, so render time per chunk will likely be noticeably longer, and the chunk size (2700
  frames) / concurrency (4) in `render_chunk.sh` may need retuning once real numbers come back from a first run.
- **Known gaps for a v2** (not blocking a first test, but real limits): only 6 location presets exist (reuse/re-dress them
  across scenes like the Shorts reuse locations); no moving/animated cast poses yet (characters stand still, Shorts-style
  idle sway not ported); no bloom/grade/vignette/film grain yet (flagged above).

## Images
`image.q` = a Wikimedia Commons search phrase (specific: "Sears Tower Chicago 1980s", "mail order catalog 1897").
GitHub Actions (`fetch_assets.py`) finds and downloads a licence-checked file (public domain / CC0 / CC BY / CC BY-SA) and writes credits
into the description. You cannot reach Commons from the sandbox, so always give photos a `fallback` icon; never rely on one image.
Use real photos for people/places/objects of history; charts/maps/stats for numbers; never AI-generated faces of real people.

## Run steps
1. Script stage (story hour 11:00-11:59 PKT, or when a `[LONG]` idea exists): `python3 pipeline/scripts/pop_idea.py --long`; else pick the best hook from
   `docs/research/news_hooks.json` whose brand has a real backstory. Max ONE long job in the pipeline at a time.
   **Token-saving draft:** check `docs/research/gemini_draft.json` first — if `format` is `long` and the topic matches,
   it has an UNVERIFIED outline + a `claims` list from Gemini (free GitHub Actions run, not your session). Treat it as
   a rough starting skeleton only: verify every claim with your own 2-source rule before it goes in `factmap.md`,
   rewrite everything in the channel voice, and drop anything unconfirmed. Missing/stale/mismatched → write from
   scratch as before. Write the files above,
   run `python3 pipeline/longform/validate_long.py jobs/<id>` until it has no ERROR, commit, push, then `set_status <id> script_ready type=long`.
2. `script_approved` (long): `set_status <id> building`; fix any scene problems with `bash pipeline/longform/stills_long.sh jobs/<id>` (needs sample timing: run
   locally only if `timing.json` was generated; otherwise skip), then commit/push and `set_status <id> render_queued`. **Do not render locally** — `render_long.yml` does voice, images, music, render, thumbnail and sets `video_ready`.
3. `render_failed`: read the failed run's log, fix the files, push, `set_status <id> render_queued`.
4. After `video_approved` the bot schedules it on YouTube by itself (feed → YouTube Zap, Private + publish time, next Tue/Thu/Sat 19:00 PKT; `upload.mp4` is a <95 MB copy because Zapier times out above ~100 MB). The dashboard upload helper stays as a backup if the Zap fails. Never publish yourself. `video_rejected` with feedback: change scenes/thumb/script as asked, push, `render_queued`.
