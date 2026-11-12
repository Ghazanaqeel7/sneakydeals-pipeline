# Long-form (documentary) videos — Claude's guide

Only when `state.json config.longform_enabled` is true. Long jobs are numeric-id jobs with `"type": "long"` (set with
`set_status <id> script_ready type=long`). Shorts rules in PIPELINE.md do not change; this file adds the long-form path.

## Format (non-negotiable)
- 12-15 min (1,800-2,250 words at ~150 wpm; never under 1,200). 16:9, motion-graphics documentary, NOT the 3D cartoon look.
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
title{text,sub,accent[],align,size} · chapter{number,title} · photo{image:{q},move,grade,caption,fallback:{icon,label},frame} ·
stat{from,to,prefix,suffix,decimals,label,sub,color} · chart{kind:line|bar,data:[{x,y}],title,unit,highlight,color,note} ·
timeline{title,events:[{year,label}]} · map{region:us|world,highlight[],pins[{lon,lat,label}],arcs[{from,to,label}],title} ·
headline{kicker,text,source} (our own generic news card) · compare{title,a:{name,color},b:{name,color},rows:[{label,a,b,unit}]} ·
list{title,items:[{title,sub,icon}],numbered} · quote{text,who,source} (only exact, cited quotes) ·
illustration{title,icons:[{name,label}],arrows} · endcard{title,sub} (last scene). `tone`: dark|blue|red|paper.
Icons: store factory dollar person people building truck cart box plane car phone tv bank barcode bulb warning lock document gavel globe clock fire tag key megaphone mail screen cross check question.

## Images
`image.q` = a Wikimedia Commons search phrase (specific: "Sears Tower Chicago 1980s", "mail order catalog 1897").
GitHub Actions (`fetch_assets.py`) finds and downloads a licence-checked file (public domain / CC0 / CC BY / CC BY-SA) and writes credits
into the description. You cannot reach Commons from the sandbox, so always give photos a `fallback` icon; never rely on one image.
Use real photos for people/places/objects of history; charts/maps/stats for numbers; never AI-generated faces of real people.

## Run steps
1. Script stage (story hour 11:00-11:59 PKT, or when a `[LONG]` idea exists): `python3 pipeline/scripts/pop_idea.py --long`; else pick the best hook from
   `docs/research/news_hooks.json` whose brand has a real backstory. Max ONE long job in the pipeline at a time. Write the files above,
   run `python3 pipeline/longform/validate_long.py jobs/<id>` until it has no ERROR, commit, push, then `set_status <id> script_ready type=long`.
2. `script_approved` (long): `set_status <id> building`; fix any scene problems with `bash pipeline/longform/stills_long.sh jobs/<id>` (needs sample timing: run
   locally only if `timing.json` was generated; otherwise skip), then commit/push and `set_status <id> render_queued`. **Do not render locally** — `render_long.yml` does voice, images, music, render, thumbnail and sets `video_ready`.
3. `render_failed`: read the failed run's log, fix the files, push, `set_status <id> render_queued`.
4. After `video_approved` the bot schedules it on YouTube by itself (feed → YouTube Zap, Private + publish time, next Tue/Thu/Sat 19:00 PKT; `upload.mp4` is a <95 MB copy because Zapier times out above ~100 MB). The dashboard upload helper stays as a backup if the Zap fails. Never publish yourself. `video_rejected` with feedback: change scenes/thumb/script as asked, push, `render_queued`.
