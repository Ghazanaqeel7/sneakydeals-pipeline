# Sneaky Deals playbook

The rules Claude follows when picking stories and writing titles, hooks and scripts. Claude rewrites this file every
Monday from the research bot's data (`docs/research/`) and our own videos' numbers. The owner can edit it too.

Confidence labels: **[proven]** = our own videos show it · **[signal]** = the niche shows it (research bot) ·
**[start]** = starting assumption, not tested yet.

_Last updated: 11 Nov 2026 (first version, before any of our videos had data)._

## Topics
- [signal] "Ordinary person beats a big company with a loophole" stories break out hardest (Pudding Guy ~100x, Worst Trade Ever ~1,900x on small channels).
- [signal] Famous US brands in the title (Coca-Cola, Pepsi, McDonald's, Disney) show up again and again in the hit Shorts.
- [signal] For long videos: "rise and fall" / "whatever happened to" nostalgia brands (Sears, Toys "R" Us, Blockbuster) win for small channels.
- [start] Brand rivalries (Pepsi vs Coca-Cola) pull extra comments.

## Owner instructions
_Pasted by the owner via the dashboard Inbox. Claude follows these from now on and never removes or rewrites them in the weekly rewrite; only the owner can edit/delete a line here._
- [owner 19 Nov 2026] Long-video pacing: change what is on screen every 3 to 5 seconds (clippings, kinetic typography, motion graphics, new visuals) to keep watch time up.
- [owner 19 Nov 2026] Voiceover pace for long videos: about 130 to 145 words per minute, crisp and energetic, not rushed; background music pulled well below the voice (about -22 to -26 dB under voice, voice near -14 to -16 LUFS).
- [owner 22 Nov 2026] Rejected job 013 (Kodak) as boring/"bikar" — too many number/chart-style scenes, not enough character/scene storytelling. Long videos must lead with cast/character scenes like the Shorts (same cartoon cast, acting out the story); charts/stats/maps/timelines are now a rare 1-2 scene accent only, never the main visual language. See `docs/longform_guide.md` "Format"/"Attention rules" (revised 22 Nov 2026).
- [owner 23 Nov 2026] Long-form paused until further notice — January target takes priority, focus all effort on Shorts. `config.longform_enabled` set to `false` (calendar items marked `format: "long"` are made as Shorts instead per the existing rule in `PIPELINE.md` step 5, with the long idea kept in `long_later`). Shorts cadence raised to **2 uploads/day** at two US-spread times: `config.publish_times_pkt` = `["05:00", "17:00"]` (05:00 PKT ≈ 7 PM US Eastern the evening before — evening/prime-time US viewers; 17:00 PKT ≈ 7 AM US Eastern same day — US morning/commute viewers). `pipeline_buffer` raised from 2 to 4 to keep enough Shorts ready ahead at double the daily consumption rate. Do not re-enable long-form or revert the publish schedule without the owner saying so.

## Titles
- [start] Brand + shocking action, no year, ≤ 60 characters (e.g. "Pepsi's Ad Showed a Fighter Jet. He Sent $700,000.").
- [signal] Hit titles are short. "Why…" / "How…" openers and one CAPS word (SECRET, GENIUS) show up often. (Exact shares: dashboard → Research → Trends.)
- [start] Use words people actually search (dashboard → Research → Title check).
- [signal 13 Nov] "Secretly" + fake-names hook (Disney swamp) had ~1,360 views at day 1 vs Pepsi submarines 222 (~6x), like rate 3.2% vs 1.8%. Both jumped on the evening of 12 Nov, so part of it may be channel-wide.

## Hooks (first 1.5 s)
- [proven by owner feedback, video 001] Brand name + the shock in the first words. Never open with a date.
- [start] Leave a question open ("Seventeen of them.").

## Length and pacing
- [signal] The business-story Shorts that broke out in our first scan were all under 60 s. Keep 45-60 s until our own numbers say otherwise.

## Instagram (Reels on @sneakydealstv)
- [start] First caption line = hook with the brand name, under 125 characters; captions are searchable, so use the words people search.
- [start] 3-5 precise hashtags (Instagram allows max 5): brand/topic + niche (#businesshistory) + #sneakydeals.
- [start] End with a question + "follow for a new sneaky deal every day".

## Facebook (Sneaky Deals Page)
- [start] Short brand + shock title; description ends with a question to pull comments; 0-3 hashtags.

## What to avoid
- Memes, politics, war, non-US-market stories (they show up in searches but are not our audience).
- Copying a competitor's script, title or angle — topics yes, their words no.
