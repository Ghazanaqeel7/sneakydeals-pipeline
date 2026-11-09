// ===================== FILL THESE IN ONCE =====================
const SETTINGS = {
  github_owner: 'YOUR_GITHUB_USERNAME',
  github_repo: 'sneakydeals-pipeline',
  github_token: 'PASTE_GITHUB_FINE_GRAINED_TOKEN',   // repo access: Contents = Read and write
  telegram_token: 'PASTE_BOT_TOKEN_FROM_BOTFATHER',
  telegram_chat_id: 'PASTE_YOUR_CHAT_ID',           // only this chat can approve
};
// ==============================================================
return [{ json: { mode: $input.first().json.mode, ...SETTINGS } }];
