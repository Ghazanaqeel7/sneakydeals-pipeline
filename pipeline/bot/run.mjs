// Runs the n8n pipeline code (n8n/src/main_slack.js) on GitHub Actions, so Slack + publishing work without the laptop.
// Usage: node pipeline/bot/run.mjs <send|replies|publish>   (env: GH_TOKEN, SLACK_BOT_TOKEN, SLACK_CHANNEL_ID, REPO=owner/name, STATIC_FILE)
import fs from 'node:fs';

const mode = process.argv[2];
const [owner, repo] = (process.env.REPO || 'Ghazanaqeel7/sneakydeals-pipeline').split('/');
const staticFile = process.env.STATIC_FILE || '.bot-static.json';
let store = {};
try { store = JSON.parse(fs.readFileSync(staticFile, 'utf8')); } catch (e) {}
store.global = store.global || {};

// the subset of n8n's helpers.httpRequest the pipeline code uses
async function httpRequest(o) {
  const headers = { ...(o.headers || {}) };
  let body = o.body;
  if (body !== undefined && !(body instanceof Uint8Array) && typeof body === 'object') {
    body = JSON.stringify(body);
    if (!Object.keys(headers).some((k) => k.toLowerCase() === 'content-type')) headers['Content-Type'] = 'application/json';
  }
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 60000);
  let r;
  try { r = await fetch(o.url, { method: o.method || 'GET', headers, body, signal: ctl.signal }); }
  catch (e) { const err = new Error(`${e.name === 'AbortError' ? 'timeout' : e.message} (${o.method || 'GET'} ${o.url.split('?')[0]})`); err.code = e.name === 'AbortError' ? 'ETIMEDOUT' : 'ECONNRESET'; throw err; }
  finally { clearTimeout(timer); }
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    const err = new Error(`HTTP ${r.status} ${o.method || 'GET'} ${o.url.split('?')[0]}: ${t.slice(0, 200)}`);
    err.httpCode = r.status; throw err;
  }
  if (o.encoding === 'arraybuffer') return await r.arrayBuffer();
  const text = await r.text();
  if (o.json) { try { return JSON.parse(text); } catch (e) { return text; } }
  return text;
}

const cfg = {
  mode, runner: 'github',
  github_owner: owner, github_repo: repo,
  github_token: process.env.GH_TOKEN,
  slack_bot_token: process.env.SLACK_BOT_TOKEN,
  slack_channel_id: process.env.SLACK_CHANNEL_ID,
};
const $input = { first: () => ({ json: cfg }) };
const $getWorkflowStaticData = () => store.global;
const helpers = { httpRequest };

const code = fs.readFileSync(new URL('../../n8n/src/main_slack.js', import.meta.url), 'utf8');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
let exit = 0;
try {
  const out = await new AsyncFunction('$input', '$getWorkflowStaticData', 'helpers', code).call({ helpers }, $input, $getWorkflowStaticData, helpers);
  console.log(JSON.stringify(out && out[0] && out[0].json, null, 1));
} catch (e) {
  console.error(`${mode} failed:`, e.stack || e.message); exit = 1;
}
fs.writeFileSync(staticFile, JSON.stringify(store));
process.exit(exit);
