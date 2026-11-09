# Sneaky Deals pipeline

Automatic Shorts factory for **@SneakyDeals**: Claude researches and writes → owner approves on Telegram →
Claude builds the video → GitHub Actions renders it → owner approves on Telegram → published on YouTube.

```
Claude (daily scheduled task)  ──push──▶  this repo (state.json = the job board)
        ▲                                     │   ▲              │
        │ approvals/feedback                  │   │ status        │ render_queued
        │                                     ▼   │              ▼
   n8n on the owner's laptop ◀──polls──  GitHub API        GitHub Actions (render.yml)
        │  ▲                                                     │ final.mp4 as a release asset
        ▼  │ buttons                                             ▼
     Telegram bot  ──────────────▶ publish day 04:40 PKT: n8n adds the video to feed/youtube.xml
                                                                 │
                                         Zapier (RSS → YouTube Upload Video) uploads it, Public
```

Files: `PIPELINE.md` (Claude's rules), `state.json` (job board), `jobs/<id>/` (one folder per video),
`pipeline/` (video kit, scripts, thumbnail tool), `.github/workflows/render.yml`, `feed/youtube.xml`,
`n8n/SneakyDeals_pipeline.n8n.json`, `docs/LEARNINGS.md`.

## One-time setup
1. **GitHub**: create a PUBLIC repo `sneakydeals-pipeline` (public = free, 4-core render machines and a public video
   link Zapier and Telegram can fetch). Upload everything in this folder. Then Settings → Actions → General →
   Workflow permissions → **Read and write permissions** → Save.
2. **GitHub token for n8n**: Settings → Developer settings → Fine-grained tokens → Generate. Repository access: only
   `sneakydeals-pipeline`. Permissions: **Contents: Read and write**. Copy the token.
3. **Telegram bot**: in Telegram open @BotFather → `/newbot` → name `Sneaky Deals Studio` → copy the token. Open your
   new bot and press Start, send "hi". In a browser open `https://api.telegram.org/bot<TOKEN>/getUpdates` and copy
   `"chat":{"id": ...}` — that number is your chat id. (Do this before step 4 is switched on.)
4. **n8n**: Workflows → Import from file → `n8n/SneakyDeals_pipeline.n8n.json`. Open the **CONFIG** node and fill the
   5 values. Save, then switch the workflow **Active**. Keep n8n running and the laptop awake (Windows: Settings →
   System → Power → Sleep = Never when plugged in). Test: send `/status` to the bot.
5. **Zapier** (free plan works): Create Zap → Trigger **RSS by Zapier → New Item in Feed**, Feed URL
   `https://raw.githubusercontent.com/<you>/sneakydeals-pipeline/main/feed/youtube.xml` → Action **YouTube → Upload
   Video**: Video = *Enclosure Url* (or *Link*), Title = *Title*, Description = *Description*, Privacy = **Public**,
   Category = Education. If the action test would upload, set Privacy to Private for the test, delete that test video,
   then set Public. Turn the Zap on.
6. **Claude daily task**: created from the chat once the repo exists (Claude needs push access to the repo).

## Daily life
- Telegram: approve / reject scripts and videos. After ❌ reply with what to change. `/status` shows the board.
- Publish days: `state.json → config.publish_days` (default Mon, Wed, Fri, Sun) at 05:00 PKT = 7 PM US Eastern.
- After a video goes live: pin the comment the bot sends you, and answer comments in the first hour.
