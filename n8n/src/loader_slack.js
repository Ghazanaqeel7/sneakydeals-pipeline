// Sneaky Deals — Pipeline node LOADER (paste this ONCE; never needs changing again).
// Every run it downloads the latest pipeline code from GitHub (n8n/src/main_slack.js) and runs it,
// so fixes and new features arrive automatically. If GitHub cannot be reached, it uses the last copy it got.
const cfg = $input.first().json;
const store = $getWorkflowStaticData('global');
const H = this.helpers;
let code = null;
try {
  const r = await H.httpRequest({
    method: 'GET', json: true,
    url: `https://api.github.com/repos/${cfg.github_owner}/${cfg.github_repo}/contents/n8n/src/main_slack.js?ref=main&t=${Date.now()}`,
    headers: { Authorization: `Bearer ${cfg.github_token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'sneakydeals-n8n' },
  });
  code = Buffer.from(r.content, 'base64').toString('utf8');
  store._code = code;
} catch (e) {
  code = store._code;
  if (!code) throw new Error('Could not download the pipeline code from GitHub: ' + e.message);
}
let fn = null;
try { const AF = Object.getPrototypeOf(async function () {}).constructor; fn = new AF('$input', '$getWorkflowStaticData', 'helpers', code); } catch (e) {}
if (typeof fn !== 'function') { try { fn = eval('(async function ($input, $getWorkflowStaticData, helpers) {\n' + code + '\n})'); } catch (e) {} }
if (typeof fn !== 'function') throw new Error('LOADER_NOT_SUPPORTED: paste the full code file instead (tell Claude)');
return await fn($input, $getWorkflowStaticData, H);
