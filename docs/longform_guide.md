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
title{text,sub,accent[],align,size,cast[]} · chapter{number,title} · photo{image:{q},move,grade,caption,fallback:{icon,label},frame} ·
stat{from,to,prefix,suffix,decimals,label,sub,color,icon,swarm,brand:{a,b},per,cast[]} · chart{kind:line|bar,data:[{x,y}],title,unit,highlight,color,note} ·
timeline{title,events:[{year,label}]} · map{region:us|world,highlight[],pins[{lon,lat,label}],arcs[{from,to,label}],title} ·
headline{kicker,text,source,stamp,art,caption,masthead} (our own front page, invented masthead) ·
compare{title,a:{name,color,icon,char},b:{...},rows:[{label,a,b,unit,dec,win:'a'|'b'}]} ·
list{title,items:[{title,sub,icon}],numbered} · quote{text,who,source} (only exact, cited quotes) ·
illustration{title,icons:[{name,label}],arrows} · endcard{title,sub} (last scene). `tone`: dark|blue|red|paper.
Icons: store factory dollar person people building truck cart box plane car phone tv bank barcode bulb warning lock document gavel globe clock fire tag key megaphone mail screen cross check question.

### Attention rules (owner feedback 13 Nov 2026: "simple type mat dikhao")
- **Cast.** Our own cartoon characters (never a real person's likeness) carry the story: `cast:[{side:'left'|'right'|'center', mood, outfit, suit, tie, label}]`.
  mood: laugh smug shock worried talk happy angry · outfit: suit hoodie · `label` = the company or role ("Blockbuster", "The founder"), never a real name on a face.
  Put a cast on the hook `title` and on at least 3 more scenes; match the mood to the beat (the side that loses looks worried, the winner smug).
- **Make numbers visible.** A count of things (stores, planes, users) gets `stat.icon` (`store` draws cartoon shops in `brand` colours) plus `per`
  ("each shop = about 100 stores"). A plain number with nothing behind it is a last resort.
- **Headlines** get a `stamp` (2-3 words: "DEAL REJECTED", "BANKRUPT") and `art` (Character props shown as the front-page photo).
  `source` = a real attribution only ("Reported by Reuters"); never "reconstruction" or our own name. Omit it if there is none.
- **Compare** values may be short text ("In a store") or numbers; mark the better side with `win`. Give each side an `icon` (or `char`).
- No real logos or brand marks are drawn; a brand is its name in its colour plus an icon.
- Fonts are bundled (Anton, Playfair Display, Inter, Space Mono); every scene already gets punch-in transitions, shakes on impacts and film grain.

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
