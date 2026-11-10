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
3. **Approvals app — Discord (recommended)**: see "Discord setup" below and import
   `n8n/SneakyDeals_pipeline_DISCORD.n8n.json` in step 4. (Telegram version: `n8n/SneakyDeals_pipeline.n8n.json`.)
   **Telegram (alternative)**: in Telegram open @BotFather → `/newbot` → name `Sneaky Deals Studio` → copy the token. Open your
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

## Discord setup (approvals)
1. Discord app/website → make an account → **+ (Add a Server) → Create My Own → For me and my friends**, name it
   `Sneaky Deals Studio`. Create a text channel `approvals`.
2. https://discord.com/developers/applications → **New Application** `Sneaky Deals Bot` → **Bot** tab → **Reset Token**
   → copy it (this is `discord_bot_token`). On the same page switch ON **Message Content Intent** → Save.
3. Invite the bot: open (replace APP_ID with the Application ID from **General Information**)
   `https://discord.com/oauth2/authorize?client_id=APP_ID&scope=bot&permissions=117824` → pick your server → Authorize.
4. Discord **Settings → Advanced → Developer Mode ON**. Right-click the `approvals` channel → **Copy Channel ID**
   (this is `discord_channel_id`).
5. In n8n: import `n8n/SneakyDeals_pipeline_DISCORD.n8n.json`, fill CONFIG, Save, Active. Type `!status` in the channel.
How it works: the bot posts the script / the video with ✅ and ❌ under it. Tap one. After ❌, type what to change.

## Slack setup (approvals)
1. Make a free Slack workspace (slack.com → Create a workspace) if you don't have one, and a channel `#sneaky-deals-approval`.
2. https://api.slack.com/apps → **Create New App → From a manifest** → pick the workspace → paste
   `n8n/slack_app_manifest.json` → Create → **Install to Workspace** → Allow.
3. **OAuth & Permissions** → copy **Bot User OAuth Token** (`xoxb-…`) = `slack_bot_token`.
4. In Slack, open `#sneaky-deals-approval` and type `/invite @Sneaky Deals Bot`. Click the channel name → bottom of the About tab
   → copy **Channel ID** (`C…`) = `slack_channel_id`.
5. n8n: import `n8n/SneakyDeals_pipeline_SLACK.n8n.json`, fill CONFIG, Save, Active. Type `status` in the channel.
