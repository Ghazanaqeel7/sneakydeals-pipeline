# Learnings (append one line per lesson; newest last)

- 001 Pepsi: owner said the first version had no hook because it opened with "In nineteen eighty-nine". New rule:
  brand + shock in the first 1.5 s, big hook text on screen, reveal shot (close-up → wide). Date goes later.
- 001 Pepsi: render in yuvj420p would not play on Windows/browser. finalize.sh now forces yuv420p + faststart.
- 001 Pepsi: thumbnail must not show the year or the twist ("TRUE STORY · 1989" was removed at the owner's request).
- 001 Pepsi: brand names are fine, brand logos are not (trademark risk on a new channel).
- Owner's laptop has Windows Smart App Control, which blocks Remotion's renderer: never ask him to render locally.
- 002 Disney: progress.py/set_status.py do `git reset --hard FETCH_HEAD`. If your own push failed (n8n pushed first), that wipes your unpushed commit. Always `git pull --rebase origin main && git push` and check it succeeded BEFORE calling them (recover with git reflog + cherry-pick).
- 002 Disney: in the first check round the camera flew through a background extra and foreground bushes hid the main character. Keep extras and bushes off the camera path.
- 2026-11-12: Owner saw thumbnail text cut off in the channel grid. All text/signs now live in the centre 1:1 square (make_thumb.py safe zone), so the thumb reads fully on YouTube, Instagram (3:4) and Facebook (4:5/1:1).
- 2026-11-13 long-form: owner found the demo "too simple" (plain text cards, basic fonts, a NaN compare, a "Sneaky Deals reconstruction" tag). Engine now has bundled fonts, our own cartoon cast, icon swarms for counts, stamped front pages, split-screen compare. Every long video needs cast on the hook + 3 scenes; numbers of things must be shown, not just written.
- 2026-11-13: 003 reached YouTube but never Instagram/Facebook. The publish was done by the OLD laptop n8n (commits by Ghazanaqeel7 at +05:00), whose social step still had the 12 Nov crash; the GitHub bot's 04:40 run started 1.5 h late and found the slot used. live_check.py now queues any live Short missing on IG/FB in the next posting window. Only one publisher should run (config.bot_runner).
