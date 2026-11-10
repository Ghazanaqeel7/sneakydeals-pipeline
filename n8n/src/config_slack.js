// ===================== FILL THESE IN ONCE =====================
const SETTINGS = {
  github_owner: 'Ghazanaqeel7',
  github_repo: 'sneakydeals-pipeline',
  github_token: 'PASTE_GITHUB_FINE_GRAINED_TOKEN',   // only this repo, Contents = Read and write
  slack_bot_token: 'PASTE_xoxb_BOT_TOKEN',           // Slack app -> OAuth & Permissions -> Bot User OAuth Token
  slack_channel_id: 'PASTE_CHANNEL_ID',              // e.g. C0123ABCD (channel details, bottom)
};
// ==============================================================
return [{ json: { mode: $input.first().json.mode, ...SETTINGS } }];
