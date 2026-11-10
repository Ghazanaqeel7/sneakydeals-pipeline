// Sneaky Deals pipeline — n8n side, Slack version.
// Modes: "send" (every 2 min), "replies" (every minute), "publish" (daily 04:40 PKT).
// Approvals: the bot posts in your #approvals channel and adds ✅ and ❌ reactions; you tap one. After ❌ type what to change.
const cfg = $input.first().json;
const mode = cfg.mode;
// network calls retry on timeouts / dropped connections (laptop wifi hiccups), not on real API errors
const _req = (o) => this.helpers.httpRequest(o);
async function http(o) {
  for (let i = 0; ; i++) {
    try { return await _req(o); }
    catch (e) {
      const msg = String((e && (e.code || e.message)) || e);
      if (i >= 3 || !/ETIMEDOUT|ECONNRESET|ECONNREFUSED|EAI_AGAIN|ENOTFOUND|socket hang up|timeout/i.test(msg)) throw e;
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
}
const data = $getWorkflowStaticData('global');
const GH = `https://api.github.com/repos/${cfg.github_owner}/${cfg.github_repo}`;
const ghHeaders = { Authorization: `Bearer ${cfg.github_token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'sneakydeals-n8n', 'X-GitHub-Api-Version': '2022-11-28' };
const SL = 'https://slack.com/api';
const slHeaders = { Authorization: `Bearer ${cfg.slack_bot_token}` };
const CH = String(cfg.slack_channel_id);
const YES = 'white_check_mark', NO = 'x';
const log = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ghGet(path) {
  const r = await http({ method: 'GET', url: `${GH}/contents/${path}?ref=main&t=${Date.now()}`, headers: ghHeaders, json: true });
  return { text: Buffer.from(r.content, 'base64').toString('utf8'), sha: r.sha };
}
async function ghPut(path, text, sha, message) {
  return http({ method: 'PUT', url: `${GH}/contents/${path}`, headers: ghHeaders, json: true,
    body: { message, content: Buffer.from(text, 'utf8').toString('base64'), sha, branch: 'main' } });
}
async function updateState(fn, message) {
  for (let i = 0; i < 4; i++) {
    const f = await ghGet('state.json');
    const st = JSON.parse(f.text);
    const changed = await fn(st);
    if (!changed) return st;
    try { await ghPut('state.json', JSON.stringify(st, null, 2) + '\n', f.sha, message); return st; }
    catch (e) { if (i === 3) throw e; await sleep(1500); }
  }
}
const now = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z');

// ---- Slack helpers ----
async function sl(method, body) {   // write methods: JSON body
  const r = await http({ method: 'POST', url: `${SL}/${method}`, headers: { ...slHeaders, 'Content-Type': 'application/json; charset=utf-8' }, body, json: true });
  if (!r.ok && r.error !== 'already_reacted') throw new Error(`slack ${method}: ${r.error}`); return r;
}
async function slGet(method, qs) {  // read methods: query string
  const r = await http({ method: 'GET', url: `${SL}/${method}?${new URLSearchParams(qs).toString()}`, headers: slHeaders, json: true });
  if (!r.ok) throw new Error(`slack ${method}: ${r.error}`); return r;
}
const dPost = async (text) => { const r = await sl('chat.postMessage', { channel: CH, text, unfurl_links: false, unfurl_media: false }); return { id: r.ts }; };
function chunks(text, n = 3500) {
  const out = []; let cur = '';
  for (let line of text.split('\n')) {
    while (line.length > n) { if (cur) { out.push(cur); cur = ''; } out.push(line.slice(0, n)); line = line.slice(n); }
    if ((cur + '\n' + line).length > n) { out.push(cur); cur = line; } else cur = cur ? cur + '\n' + line : line;
  }
  if (cur) out.push(cur); return out;
}
async function react(ts, name) { await sl('reactions.add', { channel: CH, timestamp: ts, name }); await sleep(300); }
let BOT_ID = null;
async function reactors(ts, name) {
  if (!BOT_ID) BOT_ID = (await sl('auth.test', {})).user_id;
  const r = await slGet('reactions.get', { channel: CH, timestamp: ts, full: 'true' });
  const re = ((r.message && r.message.reactions) || []).find((x) => x.name === name);
  return re ? re.users.filter((u) => u !== BOT_ID) : [];
}
// upload a video file into the channel (Slack's external upload flow)
async function dPostFile(text, filename, buf) {
  const u = await slGet('files.getUploadURLExternal', { filename, length: String(buf.length) });
  await http({ method: 'POST', url: u.upload_url, headers: { 'Content-Type': 'application/octet-stream' }, body: buf });
  await sl('files.completeUploadExternal', { files: [{ id: u.file_id, title: filename }], channel_id: CH, initial_comment: text });
}
// ---------------- SEND ----------------
if (mode === 'send') {
  const toSend = [];
  await updateState((st) => {
    let ch = false;
    for (const [id, j] of Object.entries(st.jobs)) {
      if (j.status === 'script_ready') { j.status = 'script_sent'; j.updated = now(); toSend.push(['script', id, j]); ch = true; }
      else if (j.status === 'video_ready') { j.status = 'video_sent'; j.updated = now(); toSend.push(['video', id, j]); ch = true; }
    }
    return ch;
  }, 'n8n: sending to Slack');
  for (const [kind, id, j] of toSend) {
    try {
      let vote;
      if (kind === 'script') {
        let msg; try { msg = (await ghGet(`jobs/${id}/telegram.md`)).text; } catch (e) { msg = `New script ready: ${id}`; }
        const parts = chunks(`📝 *SCRIPT FOR APPROVAL — ${id}*\n\n${msg}`);
        for (const p of parts) { await dPost(p); await sleep(500); }
        vote = await dPost(`👆 *${id}* — tap ✅ to approve the script, or ❌ to reject it (then type what to change in this channel).`);
      } else {
        const meta = JSON.parse((await ghGet(`jobs/${id}/meta.json`)).text);
        const head = `🎬 *VIDEO FOR APPROVAL — ${id}*\n*Title:* ${meta.title}`;
        let posted = false;
        if (j.preview_url) {
          try { const buf = await http({ method: 'GET', url: j.preview_url, encoding: 'arraybuffer' });
            await dPostFile(head, `${id}.mp4`, Buffer.from(buf)); posted = true; } catch (e) { log.push(`preview upload failed: ${e.message}`); }
        }
        if (!posted) await dPost(`${head}\nWatch: ${j.video_url}`);
        await sleep(500);
        for (const p of chunks(`*Description:*\n${meta.description}`)) { await dPost(p); await sleep(500); }
        vote = await dPost(`👆 *${id}* — tap ✅ to approve & schedule, or ❌ to reject (then type what to fix).\nFull quality file: ${j.video_url}`);
      }
      await react(vote.id, YES); await react(vote.id, NO);
      await updateState((st) => { st.jobs[id].vote_msg = vote.id; return true; }, `n8n: vote message ${id}`);
      log.push(`sent ${kind} ${id}`);
    } catch (e) {
      log.push(`FAILED to send ${kind} ${id}: ${e.message}`);
      await updateState((st) => { st.jobs[id].status = kind === 'script' ? 'script_ready' : 'video_ready'; st.jobs[id].send_error = String(e.message).slice(0, 300); return true; }, `n8n: send failed ${id}`);
    }
  }
}

// ---------------- REPLIES: reactions + typed feedback + !status ----------------
if (mode === 'replies') {
  const st0 = JSON.parse((await ghGet('state.json')).text);
  const decided = [];
  for (const [id, j] of Object.entries(st0.jobs)) {
    if (!j.vote_msg || !['script_sent', 'video_sent'].includes(j.status)) continue;
    const yes = (await reactors(j.vote_msg, YES)).length > 0; await sleep(300);
    const no = !yes && (await reactors(j.vote_msg, NO)).length > 0; await sleep(300);
    if (!yes && !no) continue;
    const kind = j.status === 'script_sent' ? 'script' : 'video';
    decided.push([id, kind, yes ? `${kind}_approved` : `${kind}_rejected`, j.status]);
  }
  for (const [id, kind, next, from] of decided) {
    let ok = false;
    await updateState((st) => { const j = st.jobs[id]; if (j.status !== from) return false; j.status = next; j.updated = now(); ok = true; return true; }, `n8n: ${id} -> ${next}`);
    if (!ok) continue;
    const texts = {
      script_approved: `✅ Script approved: *${id}*. Claude ek ghante ke andar video banana shuru karega, aur har step ki update yahin aayegi.`,
      video_approved: `✅ Video approved: *${id}*. It goes live on the next publish day at 05:00 PKT (7 PM US Eastern).`,
      script_rejected: `❌ Script rejected: *${id}*. Type what to change in your next message (or type \`drop\` to throw this idea away).`,
      video_rejected: `❌ Video rejected: *${id}*. Type what to fix (shot / second / what looks wrong).`,
    };
    await dPost(texts[next]);
    if (next.endsWith('rejected')) data.awaiting = id;
    log.push(`${id}: ${next}`);
  }
  // typed messages
  // status changes + Claude's progress notes -> Slack (so the owner sees the video being made)
  const ANNOUNCE = {
    building: '🛠 Video banana shuru: voice, scenes, check frames. Har step ki update yahan aayegi.',
    render_queued: '🎞 Scenes tayyar. GitHub par render shuru hone wala hai (~30-60 min).',
    rendering: '⏳ Render chal raha hai (GitHub Actions)...',
    render_failed: '⚠️ Render fail hua. Claude agle check mein theek karega.',
    script_ready: '📝 Naya / updated script tayyar, abhi bhejta hoon.',
  };
  const stP = JSON.parse((await ghGet('state.json')).text);
  data.seen = data.seen || {}; data.prog = data.prog || {};
  const seeded = data.seeded; data.seeded = true;
  for (const [id, j] of Object.entries(stP.jobs)) {
    const total = j.progress_count || 0;
    if (!seeded) { data.seen[id] = j.status; data.prog[id] = total; continue; }   // first run: no flood of old news
    if (data.seen[id] !== j.status) {
      data.seen[id] = j.status;
      if (ANNOUNCE[j.status]) { await dPost(`*${id}* — ${ANNOUNCE[j.status]}`); await sleep(400); }
    }
    const done = data.prog[id] || 0;
    if (total > done) {
      const fresh = (j.progress || []).slice(-(total - done));
      for (const p of fresh) { await dPost(`*${id}* — ${p.msg}`); await sleep(400); }
      data.prog[id] = total;
    }
  }

  // typed messages since the last check (Slack ts = seconds.micro)
  if (!data.lastTs) data.lastTs = (Date.now() / 1000).toFixed(6);
  if (!BOT_ID) BOT_ID = (await sl('auth.test', {})).user_id;
  const hist = await slGet('conversations.history', { channel: CH, oldest: data.lastTs, limit: '50' });
  const msgs = (hist.messages || []).sort((a, b) => Number(a.ts) - Number(b.ts));
  for (const m of msgs) {
    data.lastTs = m.ts;
    if (m.bot_id || m.user === BOT_ID || m.subtype) continue;
    const t = (m.text || '').trim();
    if (!t) continue;
    if (t === '!status' || t === 'status') {
      const st = JSON.parse((await ghGet('state.json')).text);
      await dPost('*Sneaky Deals pipeline*\n' + Object.entries(st.jobs).slice(-12).map(([id, j]) => `• ${id}: ${j.status}`).join('\n'));
    } else if (data.awaiting) {
      const id = data.awaiting; data.awaiting = null;
      await updateState((st) => {
        const j = st.jobs[id]; if (!j) return false;
        if (t.toLowerCase() === 'drop') j.status = 'dropped';
        j.feedback = ((j.feedback ? j.feedback + '\n' : '') + `[${now()}] ${t}`).slice(-3000); j.updated = now(); return true;
      }, `n8n: feedback for ${id}`);
      await dPost(t.toLowerCase() === 'drop' ? `🗑 Dropped *${id}*. Claude will pick a new story.` : `📝 Got it. Claude will fix *${id}* in its next run and post it again.`);
      log.push(`feedback ${id}`);
    }
  }
}

// ---------------- PUBLISH ----------------
if (mode === 'publish') {
  const stNow = JSON.parse((await ghGet('state.json')).text);
  const days = (stNow.config && stNow.config.publish_days) || ['Mon', 'Wed', 'Fri', 'Sun'];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Karachi' });
  const pick = Object.entries(stNow.jobs).filter(([, j]) => j.status === 'video_approved').sort((a, b) => (a[1].updated || '').localeCompare(b[1].updated || ''))[0];
  if (!days.includes(today)) log.push(`not a publish day (${today})`);
  else if (!pick) {
    log.push('nothing approved to publish');
    await dPost(`⚠️ Publish day (${today}) but no approved video is waiting. Type \`!status\` to see the board.`);
  } else {
    const [id, j] = pick;
    const meta = JSON.parse((await ghGet(`jobs/${id}/meta.json`)).text);
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const item = `<item>\n<title>${esc(meta.title)}</title>\n<description><![CDATA[${meta.description.replace(/]]>/g, '')}]]></description>\n<link>${esc(j.video_url)}</link>\n<guid isPermaLink="false">${esc(id)}</guid>\n<pubDate>${new Date().toUTCString()}</pubDate>\n<enclosure url="${esc(j.video_url)}" type="video/mp4" length="0"/>\n</item>\n`;
    for (let i = 0; i < 3; i++) {
      const f = await ghGet('feed/youtube.xml');
      if (f.text.includes(`<guid isPermaLink="false">${esc(id)}</guid>`)) break;
      try { await ghPut('feed/youtube.xml', f.text.replace('<!--ITEMS-->', '<!--ITEMS-->\n' + item), f.sha, `publish ${id}`); break; } catch (e) { if (i === 2) throw e; }
    }
    await updateState((st) => { st.jobs[id].status = 'published'; st.jobs[id].published_at = now(); return true; }, `n8n: published ${id}`);
    await dPost(`🚀 Publishing now: *${meta.title}*\nZapier will upload it to YouTube within ~15 minutes.\n\nAfter it is live, pin this comment:\n> ${meta.pinned_comment || ''}`);
    log.push(`published ${id}`);
  }
}

return [{ json: { mode, log } }];
