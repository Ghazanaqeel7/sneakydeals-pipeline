// Sneaky Deals — Pipeline node LOADER (paste this ONCE; never needs changing again).
// Every run it downloads the latest pipeline code from GitHub (n8n/src/main_slack.js) and runs it,
// so fixes and new features arrive automatically. If GitHub cannot be reached, it uses the last copy it got.
const cfg = $input.first().json;
const store = $getWorkflowStaticData('global');
let code = null;
try {
  const r = await this.helpers.httpRequest({
    method: 'GET', json: true,
    url: `https://api.github.com/repos/${cfg.github_owner}/${cfg.github_repo}/contents/n8n/src/main_slack.js?ref=main&t=${Date.now()}`,
    headers: { Authorization: `Bearer ${cfg.github_token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'sneakydeals-n8n' },
  });
  code = Buffer.from(r.content, 'base64').toString('utf8');
  store._code = code; store._codeSha = r.sha;
} catch (e) {
  code = store._code;
  if (!code) throw new Error('Could not download the pipeline code from GitHub: ' + e.message);
}
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const run = new AsyncFunction('$input', '$getWorkflowStaticData', code);
return await run.call(this, $input, $getWorkflowStaticData);
