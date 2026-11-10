// ===================== FILL THESE IN ONCE =====================
const SETTINGS = {
  github_owner: 'Ghazanaqeel7',
  github_repo: 'sneakydeals-pipeline',
  github_token: 'PASTE_GITHUB_FINE_GRAINED_TOKEN',   // only this repo, Contents = Read and write
  discord_bot_token: 'PASTE_DISCORD_BOT_TOKEN',
  discord_channel_id: 'PASTE_CHANNEL_ID',            // the private #approvals channel
};
// ==============================================================
return [{ json: { mode: $input.first().json.mode, ...SETTINGS } }];
