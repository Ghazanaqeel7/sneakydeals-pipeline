// Sneaky Deals pipeline — n8n side, Slack version.
// Modes: "send" (every 2 min), "replies" (every minute), "publish" (daily 04:40 PKT).
// Approvals: the bot posts in your #approvals channel and adds ✅ and ❌ reactions; you tap one. After ❌ type what to change.
const cfg = $input.first().json;
const mode = cfg.mode;
// network calls retry on timeouts / dropped connections (laptop wifi hiccups), not on real API errors
const _H = (typeof helpers !== 'undefined' && helpers) ? helpers : this.helpers;   // loader passes helpers in
const _req = (o) => _H.httpRequest(o);
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
// One runner at a time: when state.config.bot_runner is "github", the laptop n8n stands down (GitHub Actions runs this code).
{
  const _st = JSON.parse(Buffer.from((await http({ method: 'GET', url: `https://api.github.com/repos/${cfg.github_owner}/${cfg.github_repo}/contents/state.json?ref=main&t=${Date.now()}`, headers: { Authorization: `Bearer ${cfg.github_token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'sneakydeals-n8n' }, json: true })).content, 'base64').toString('utf8'));
  const want = ((_st.config || {}).bot_runner) || 'n8n';
  if (want !== (cfg.runner || 'n8n')) return [{ json: { mode, log: [`skipped: bot_runner is ${want}`] } }];
}
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
  const r = await http({ method: 'GET', url: `${SL}/${method}?${Object.entries(qs).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')}`, headers: slHeaders, json: true });
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
      if (j.status === 'script_ready') { j.status = 'script_sent'; j.updated = now(); j.vote_msg = ''; j.vote_kind = ''; toSend.push(['script', id, j]); ch = true; }
      else if ((j.status === 'video_sent' || j.status === 'script_sent') && !j.vote_msg && j.updated && Date.now() - new Date(j.updated).getTime() > 10 * 60000) {
        const k = j.status === 'video_sent' ? 'video' : 'script'; j.updated = now(); toSend.push([k, id, j]); ch = true; log.push(`re-sending stuck ${k} ${id}`);
      }
      else if (j.status === 'video_ready') { j.status = 'video_sent'; j.updated = now(); j.vote_msg = ''; j.vote_kind = ''; toSend.push(['video', id, j]); ch = true; }
    }
    return ch;
  }, 'n8n: sending to Slack');
  if (!toSend.length) log.push('nothing new to send (no job is script_ready / video_ready)');
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
        // the video itself is NOT uploaded to Slack (too slow for n8n's time limit) — watch it on the dashboard
        const DASH = `https://${cfg.github_owner.toLowerCase()}.github.io/${cfg.github_repo}/`;
        await dPost(`${head}\n▶️ *Video dekhein (dashboard):* ${DASH}\n⬇️ Full file: ${j.video_url}`);
        await sleep(500);
        try {
          const turl = `https://raw.githubusercontent.com/${cfg.github_owner}/${cfg.github_repo}/main/jobs/${id}/thumbnail.jpg?t=${Date.now()}`;
          const tb = Buffer.from(await http({ method: 'GET', url: turl, encoding: 'arraybuffer' }));
          await dPostFile(`🖼 *Thumbnail — ${id}* (YouTube par yahi lagega)`, `${id}_thumbnail.jpg`, tb);
        } catch (e) { await dPost(`⚠️ *${id}* ka thumbnail nahi mila — approve karne par default (logo) thumbnail lagega.`); }
        await sleep(500);
        for (const p of chunks(`*Description:*\n${meta.description}`)) { await dPost(p); await sleep(500); }
        vote = await dPost(`👆 *${id}* — ✅ = video + thumbnail dono approve (publish day par upload hoga).\n❌ = reject, phir likhein kya theek karna hai. Sirf thumbnail badalna ho to likhein: \`thumbnail: <kya change>\` — video dobara nahi banegi, sirf naya thumbnail aayega.\nFull quality file: ${j.video_url}`);
      }
      await react(vote.id, YES); await react(vote.id, NO);
      await updateState((st) => { st.jobs[id].vote_msg = vote.id; st.jobs[id].vote_kind = kind; return true; }, `n8n: vote message ${id}`);
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
    if (j.vote_kind !== (j.status === 'script_sent' ? 'script' : 'video')) continue;   // old/other-stage message: ignore its ✅
    const yes = (await reactors(j.vote_msg, YES)).length > 0; await sleep(300);
    const no = !yes && (await reactors(j.vote_msg, NO)).length > 0; await sleep(300);
    if (!yes && !no) continue;
    const kind = j.status === 'script_sent' ? 'script' : 'video';
    decided.push([id, kind, yes ? `${kind}_approved` : `${kind}_rejected`, j.status]);
  }
  for (const [id, kind, next, from] of decided) {
    let ok = false;
    await updateState((st) => { const j = st.jobs[id]; if (j.status !== from) return false; j.status = next; j.updated = now(); j.decided_via = 'slack'; ok = true; return true; }, `n8n: ${id} -> ${next}`);
    if (!ok) continue;
    const texts = {
      script_approved: `✅ Script approved: *${id}*. Claude ek ghante ke andar video banana shuru karega, aur har step ki update yahin aayegi.`,
      video_approved: `✅ Video approved: *${id}*. It goes live on the next publish day at 05:00 PKT (7 PM US Eastern).`,
      script_rejected: `❌ Script rejected: *${id}*. Type what to change in your next message (or type \`drop\` to throw this idea away).`,
      video_rejected: `❌ Video rejected: *${id}*. Type what to fix (shot / second / what looks wrong).`,
    };
    if (next === 'video_approved' && ((st0.jobs[id] || {}).type === 'long')) texts.video_approved = `✅ Long video approved: *${id}*. It is scheduled on YouTube automatically (next Tue/Thu/Sat 19:00 PKT slot); you get a 📅 message with the time. The dashboard Long tab keeps a manual upload helper as a backup.`;
    await dPost(texts[next]);
    if (next.endsWith('rejected')) data.awaiting = id;
    log.push(`${id}: ${next}`);
  }
  // typed messages
  // status changes + Claude's progress notes -> Slack (so the owner sees the video being made)
  const ANNOUNCE = {
    building: '🛠 Video build started: voice, scenes, frame checks. Estimate: scenes ~45-75 min + render ~30-50 min = video in ~1.5-2 hours. Every step is posted here.',
    render_queued: '🎞 Scenes ready. The GitHub render starts within 30 min and takes ~30-50 min.',
    rendering: '⏳ Rendering (GitHub Actions)...',
    render_failed: '⚠️ Render failed. Claude fixes it in the next check.',
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
      for (const p of fresh) {
        let done1 = false;
        if (p.image) {
          try {
            const url = `https://raw.githubusercontent.com/${cfg.github_owner}/${cfg.github_repo}/main/${p.image}`;
            const buf = Buffer.from(await http({ method: 'GET', url, encoding: 'arraybuffer' }));
            await dPostFile(`*${id}* — ${p.msg}`, p.image.split('/').pop(), buf); done1 = true;
          } catch (e) { log.push(`image post failed: ${e.message}`); }
        }
        if (!done1) await dPost(`*${id}* — ${p.msg}`);
        await sleep(400);
      }
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
      await dPost(t.toLowerCase() === 'drop' ? `🗑 Dropped *${id}*. Claude will pick a new story.` : `🛠 Changes noted: *${id}*. Claude starts on them in the next hourly run (within ~1 hour); every step is posted here and on the dashboard.`);
      log.push(`feedback ${id}`);
    }
  }
}

// YouTube schedule-ahead: approved videos go to YouTube right away as Private with a publish time (next free 05:00 PKT slot).
if (mode === 'replies') {
  try { await scheduleAhead(); } catch (e) { log.push(`schedule-ahead failed: ${String(e.message || e).slice(0, 160)}`); }
}

// ---------------- PUBLISH ----------------
if (mode === 'publish') {
  const stNow = JSON.parse((await ghGet('state.json')).text);
  const days = (stNow.config && stNow.config.publish_days) || ['Mon', 'Wed', 'Fri', 'Sun'];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Karachi' });
  const dayKey = (t) => new Date(t).toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
  const todayKey = dayKey(Date.now());
  const approved = Object.entries(stNow.jobs).filter(([, j]) => j.status === 'video_approved' && j.type !== 'long').sort((a, b) => (a[1].updated || '').localeCompare(b[1].updated || ''));
  // a job already scheduled on YouTube for today wins; jobs scheduled for a later day are left alone
  const pick = approved.find(([, j]) => j.yt_scheduled_for && dayKey(j.yt_scheduled_for) === todayKey) || approved.find(([, j]) => !j.yt_scheduled_for);
  const takenBy = Object.entries(stNow.jobs).find(([, j]) => (j.live_at && dayKey(j.live_at) === todayKey) || (j.published_at && dayKey(j.published_at) === todayKey));
  if (!days.includes(today)) log.push(`not a publish day (${today})`);
  else if (takenBy) log.push(`today's slot already used by ${takenBy[0]}`);
  else if (!pick) {
    log.push('nothing approved to publish');
    await dPost(`⚠️ Publish day (${today}) but no approved video is waiting. Type \`!status\` to see the board.`);
  } else {
    const [id, j] = pick;
    const meta = JSON.parse((await ghGet(`jobs/${id}/meta.json`)).text);
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const RAW = `https://raw.githubusercontent.com/${cfg.github_owner}/${cfg.github_repo}/main`;
    let thumbUrl = `${RAW}/assets/default_thumbnail.jpg`;
    try { await http({ method: 'GET', url: `${GH}/contents/jobs/${id}/thumbnail.jpg?ref=main`, headers: ghHeaders, json: true }); thumbUrl = `${RAW}/jobs/${id}/thumbnail.jpg`; }
    catch (e) { log.push(`no thumbnail for ${id}, using default`); }
    const item = `<item>\n<title>${esc(meta.title)}</title>\n<description><![CDATA[${meta.description.replace(/]]>/g, '')}]]></description>\n<link>${esc(thumbUrl)}</link>\n<guid isPermaLink="false">${esc(id)}</guid>\n<pubDate>${new Date().toUTCString()}</pubDate>\n<enclosure url="${esc(j.video_url_direct || j.video_url)}" type="video/mp4" length="0"/>\n</item>\n`;
    for (let i = 0; i < 3 && !j.yt_scheduled_for; i++) {
      const f = await ghGet('feed/youtube.xml');
      if (f.text.includes(`<guid isPermaLink="false">${esc(id)}</guid>`)) break;
      try { await ghPut('feed/youtube.xml', f.text.replace('<!--ITEMS-->', '<!--ITEMS-->\n' + item), f.sha, `publish ${id}`); break; } catch (e) { if (i === 2) throw e; }
    }
    await updateState((st) => { st.jobs[id].status = 'published'; st.jobs[id].published_at = now(); return true; }, `n8n: published ${id}`);
    await dPost(j.yt_scheduled_for
      ? `🚀 Today's video: *${meta.title}*\nAlready scheduled on YouTube, goes live by itself at ${new Date(j.yt_scheduled_for).toLocaleTimeString('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit' })} PKT.\n\nAfter it is live, pin this comment:\n> ${meta.pinned_comment || ''}`
      : `🚀 Publishing now: *${meta.title}*\nZapier will upload it to YouTube within ~15 minutes.\n\nAfter it is live, pin this comment:\n> ${meta.pinned_comment || ''}`);
    log.push(`published ${id}`);

    // ---- Instagram + Facebook (added Nov 2026). Own feeds, own Zaps; YouTube above is untouched.
    // feed/reels.xml -> Zap "Sneaky Deals -> Instagram"; feed/facebook.xml -> Zap "Sneaky Deals -> Facebook".
    // Any error here only posts a Slack warning — it can never undo or block the YouTube publish.
    if (!(stNow.config && stNow.config.reels === false)) {
      const item = (title, body) => `<item>\n<title>${esc(title)}</title>\n<description><![CDATA[${String(body).replace(/]]>/g, '')}]]></description>\n<link>${esc(thumbUrl)}</link>\n<guid isPermaLink="false">${esc(id)}</guid>\n<pubDate>${new Date().toUTCString()}</pubDate>\n<enclosure url="${esc(j.video_url_direct || j.video_url)}" type="video/mp4" length="0"/>\n</item>\n`;
      const addTo = async (path, xml, label) => {
        for (let i = 0; i < 3; i++) {
          let f;
          try { f = await ghGet(path); } catch (e) { if (i === 2) throw e; await sleep(1500); continue; }
          if (f.text.includes(`<guid isPermaLink="false">${esc(id)}</guid>`)) return;
          try { await ghPut(path, f.text.replace('<!--ITEMS-->', '<!--ITEMS-->\n' + xml), f.sha, `${label} ${id}`); return; } catch (e) { if (i === 2) throw e; await sleep(1500); }
        }
      };
      const sent = [];
      try { await addTo('feed/reels.xml', item(meta.title, igCaption(meta)), 'instagram'); sent.push('ig'); }
      catch (e) { log.push(`instagram feed failed ${id}: ${String(e.message || e).slice(0, 160)}`); }
      try { const fb = fbPost(meta); await addTo('feed/facebook.xml', item(fb.title, fb.body), 'facebook'); sent.push('fb'); }
      catch (e) { log.push(`facebook feed failed ${id}: ${String(e.message || e).slice(0, 160)}`); }
      try {
        await updateState((st) => { const J = st.jobs[id]; const t = now(); if (sent.includes('ig')) J.ig_at = t; if (sent.includes('fb')) J.fb_at = t; if (sent.length) J.reels_at = t; return true; }, `n8n: social ${id}`);
      } catch (e) { log.push(`social state failed ${id}`); }
      if (sent.length === 2) await dPost(`📱 Instagram + Facebook: *${meta.title}* queued — Zapier posts it within ~15 min.`);
      else await dPost(`⚠️ YouTube theek hai, lekin ${sent.includes('ig') ? 'Facebook' : sent.includes('fb') ? 'Instagram' : 'Instagram aur Facebook'} feed update nahi hua (${id}). Claude se kahein check kare.`);
      log.push(`social ${id}: ${sent.join('+') || 'none'}`);
    }
  }
}

// Schedule-ahead (needs state.config.yt_schedule_ahead = true AND the YouTube Zap set to Privacy = private,
// Publish At = the RSS item's Category). Each approved short gets the next free publish-day slot that is 3+ hours away.
async function scheduleAhead() {
  const st = JSON.parse((await ghGet('state.json')).text);
  const C = st.config || {};
  if (!C.yt_schedule_ahead) return;
  const todo = Object.entries(st.jobs).filter(([, j]) => j.status === 'video_approved' && !j.yt_scheduled_for && !j.demo && (j.type !== 'long' || (C.long_auto !== false && (j.upload_url || j.video_url))))
    .sort((a, b) => (a[1].updated || '').localeCompare(b[1].updated || ''));
  if (!todo.length) return;
  const days = C.publish_days || ['Mon', 'Wed', 'Fri', 'Sun'];
  const [hh, mm] = String(C.publish_time_pkt || '05:00').split(':').map(Number);
  const dayKey = (t) => new Date(t).toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
  const used = new Set(), usedLong = new Set();
  for (const j of Object.values(st.jobs)) for (const t of [j.yt_scheduled_for, j.published_at, j.live_at]) if (t) (j.type === 'long' ? usedLong : used).add(dayKey(t));
  // long videos: their own slot (default Tue/Thu/Sat 19:00 PKT = 9 AM US Eastern), separate from the daily Short
  const longDays = C.long_days || ['Tue', 'Thu', 'Sat'];
  const [lh, lm] = String(C.long_publish_time_pkt || '19:00').split(':').map(Number);
  const esc = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const RAW = `https://raw.githubusercontent.com/${cfg.github_owner}/${cfg.github_repo}/main`;
  for (const [id, j] of todo) {
    const isLong = j.type === 'long', U = isLong ? usedLong : used, D = isLong ? longDays : days, H = isLong ? lh : hh, M = isLong ? lm : mm;
    let slot = null;
    for (let d = 0; d < 60 && !slot; d++) {
      const key = dayKey(Date.now() + d * 86400000);
      const wd = new Date(Date.parse(key + 'T12:00:00Z')).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
      if (!D.includes(wd) || U.has(key)) continue;
      const t = Date.parse(key + 'T00:00:00Z') + ((H - 5) * 60 + M) * 60000;   // PKT = UTC+5
      if (t - Date.now() < 3 * 3600e3) continue;
      slot = new Date(t).toISOString().replace(/\.\d+Z$/, 'Z');
    }
    if (!slot) { log.push(`no free slot for ${id}`); continue; }
    const meta = JSON.parse((await ghGet(`jobs/${id}/meta.json`)).text);
    let thumbUrl = `${RAW}/assets/default_thumbnail.jpg`;
    try { await http({ method: 'GET', url: `${GH}/contents/jobs/${id}/thumbnail.jpg?ref=main`, headers: ghHeaders, json: true }); thumbUrl = `${RAW}/jobs/${id}/thumbnail.jpg`; } catch (e) {}
    const item = `<item>\n<title>${esc(meta.title)}</title>\n<description><![CDATA[${meta.description.replace(/]]>/g, '')}]]></description>\n<link>${esc(thumbUrl)}</link>\n<guid isPermaLink="false">${esc(id)}</guid>\n<category>${slot}</category>\n<pubDate>${new Date().toUTCString()}</pubDate>\n<enclosure url="${esc(isLong ? (j.upload_url || j.video_url) : (j.video_url_direct || j.video_url))}" type="video/mp4" length="0"/>\n</item>\n`;
    let added = false;
    for (let i = 0; i < 3; i++) {
      const f = await ghGet('feed/youtube.xml');
      if (f.text.includes(`<guid isPermaLink="false">${esc(id)}</guid>`)) { log.push(`${id} already in youtube feed`); break; }
      try { await ghPut('feed/youtube.xml', f.text.replace('<!--ITEMS-->', '<!--ITEMS-->\n' + item), f.sha, `schedule ${id} for ${slot}`); added = true; break; }
      catch (e) { if (i === 2) throw e; await sleep(1500); }
    }
    if (!added) continue;
    U.add(dayKey(slot));
    await updateState((s2) => { const J = s2.jobs[id]; if (!J) return false; J.yt_scheduled_for = slot; J.yt_queued_at = now(); return true; }, `n8n: ${id} scheduled on YouTube for ${slot}`);
    const when = new Date(slot).toLocaleString('en-GB', { timeZone: 'Asia/Karachi', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    await dPost(isLong
      ? `📅 Long video scheduled: *${meta.title}*\nZapier uploads it as Private (takes a while for a long file); it goes public by itself on ${when} PKT. If it has not appeared in YouTube Studio within 2 hours, use the manual helper on the dashboard Long tab.`
      : `📅 YouTube schedule: *${meta.title}*\nZapier uploads it as Private within ~15 min; it goes public by itself on ${when} PKT. Instagram + Facebook go out the same morning.`);
    log.push(`scheduled ${id} ${slot}`);
  }
}

// function declarations (hoisted): the publish block above runs before this point in the file,
// so these must not be const arrow functions (that threw "Cannot access before initialization" on 12 Nov).
function tagLine(tags, max) {
  return (Array.isArray(tags) ? tags : String(tags || '').split(/[\s,]+/))
    .map((t) => String(t).trim()).filter(Boolean).map((t) => (t.startsWith('#') ? t : '#' + t)).slice(0, max).join(' ');
}
function cap2200(c) { return c.length > 2200 ? c.slice(0, 2190).replace(/\s+\S*$/, '') + '…' : c; }

// Instagram caption: meta.instagram {caption, hashtags} written by Claude / edited on the dashboard;
// older jobs fall back to meta.reels_caption or an automatic version of the YouTube description.
function igCaption(meta) {
  const ig = meta.instagram || {};
  if (ig.caption) return cap2200([String(ig.caption).trim(), tagLine(ig.hashtags, 5)].filter(Boolean).join('\n\n'));
  return reelsCaption(meta);
}

// Facebook: meta.facebook {title, description, hashtags}; falls back to the Instagram caption.
function fbPost(meta) {
  const fb = meta.facebook || {};
  const body = fb.description ? [String(fb.description).trim(), tagLine(fb.hashtags, 3)].filter(Boolean).join('\n\n') : igCaption(meta);
  return { title: String(fb.title || meta.title).slice(0, 250), body: cap2200(body) };
}

// Caption for IG/FB: meta.reels_caption if set, else the YouTube description without #shorts,
// max 5 hashtags, "follow" instead of "subscribe", plus the pinned-comment question. IG limit 2200 chars.
function reelsCaption(meta) {
  if (meta.reels_caption) return String(meta.reels_caption).slice(0, 2200);
  const parts = String(meta.description || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const out = [];
  let tags = [];
  for (const p of parts) {
    if (/^(#\w+\s*)+$/.test(p)) { tags = p.match(/#\w+/g).filter((t) => t.toLowerCase() !== '#shorts'); continue; }
    if (/^🔔/.test(p) || /subscribe/i.test(p)) { out.push('🔔 Follow for a new sneaky deal every week.'); continue; }
    out.push(p);
  }
  if (meta.pinned_comment) out.push('💬 ' + meta.pinned_comment);
  if (tags.length) out.push(tags.slice(0, 5).join(' '));
  let c = out.join('\n\n');
  if (c.length > 2200) c = c.slice(0, 2190).replace(/\s+\S*$/, '') + '…';
  return c;
}

return [{ json: { mode, log } }];
