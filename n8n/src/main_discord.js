// Sneaky Deals pipeline — n8n side, Discord version.
// Modes: "send" (every 2 min), "replies" (every minute), "publish" (daily 04:40 PKT).
// Approvals: the bot posts in your private channel and adds ✅ and ❌; you tap one. After ❌ type what to change.
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
const DC = 'https://discord.com/api/v10';
const dcHeaders = { Authorization: `Bot ${cfg.discord_bot_token}`, 'User-Agent': 'DiscordBot (https://github.com/Ghazanaqeel7/sneakydeals-pipeline, 1.0)' };
const CH = String(cfg.discord_channel_id);
const YES = '✅', NO = '❌';
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

// ---- Discord helpers ----
async function dPost(content, extra = {}) {
  return http({ method: 'POST', url: `${DC}/channels/${CH}/messages`, headers: dcHeaders, json: true, body: { content, allowed_mentions: { parse: [] }, ...extra } });
}
// Discord messages max 2000 chars: split on line breaks
function chunks(text, n = 1900) {
  const out = []; let cur = '';
  for (let line of text.split('\n')) {
    while (line.length > n) { if (cur) { out.push(cur); cur = ''; } out.push(line.slice(0, n)); line = line.slice(n); }
    if ((cur + '\n' + line).length > n) { out.push(cur); cur = line; } else cur = cur ? cur + '\n' + line : line;
  }
  if (cur) out.push(cur); return out;
}
async function react(msgId, emoji) {
  await http({ method: 'PUT', url: `${DC}/channels/${CH}/messages/${msgId}/reactions/${encodeURIComponent(emoji)}/@me`, headers: dcHeaders });
  await sleep(400);
}
async function reactors(msgId, emoji) {
  const r = await http({ method: 'GET', url: `${DC}/channels/${CH}/messages/${msgId}/reactions/${encodeURIComponent(emoji)}`, headers: dcHeaders, json: true });
  return (r || []).filter((u) => !u.bot);
}
// upload a file (Buffer) with a message; multipart built by hand (Code node has no form-data)
async function dPostFile(content, filename, buf) {
  const b = '----sd' + Date.now();
  const payload = JSON.stringify({ content, allowed_mentions: { parse: [] }, attachments: [{ id: 0, filename }] });
  const body = Buffer.concat([
    Buffer.from(`--${b}\r\nContent-Disposition: form-data; name="payload_json"\r\nContent-Type: application/json\r\n\r\n${payload}\r\n`),
    Buffer.from(`--${b}\r\nContent-Disposition: form-data; name="files[0]"; filename="${filename}"\r\nContent-Type: video/mp4\r\n\r\n`), buf,
    Buffer.from(`\r\n--${b}--\r\n`)]);
  const r = await http({ method: 'POST', url: `${DC}/channels/${CH}/messages`, headers: { ...dcHeaders, 'Content-Type': `multipart/form-data; boundary=${b}` }, body });
  return typeof r === 'string' ? JSON.parse(r) : r;
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
  }, 'n8n: sending to Discord');
  for (const [kind, id, j] of toSend) {
    try {
      let vote;
      if (kind === 'script') {
        let msg; try { msg = (await ghGet(`jobs/${id}/telegram.md`)).text; } catch (e) { msg = `New script ready: ${id}`; }
        const parts = chunks(`📝 **SCRIPT FOR APPROVAL — ${id}**\n\n${msg}`);
        for (const p of parts) { await dPost(p); await sleep(500); }
        vote = await dPost(`👆 **${id}** — tap ${YES} to approve the script, or ${NO} to reject it (then type what to change).`);
      } else {
        const meta = JSON.parse((await ghGet(`jobs/${id}/meta.json`)).text);
        const head = `🎬 **VIDEO FOR APPROVAL — ${id}**\n**Title:** ${meta.title}`;
        let posted = false;
        if (j.preview_url) {
          try { const buf = await http({ method: 'GET', url: j.preview_url, encoding: 'arraybuffer' });
            await dPostFile(head, `${id}.mp4`, Buffer.from(buf)); posted = true; } catch (e) { log.push(`preview upload failed: ${e.message}`); }
        }
        if (!posted) await dPost(`${head}\nWatch: ${j.video_url}`);
        await sleep(500);
        for (const p of chunks(`**Description:**\n${meta.description}`)) { await dPost(p); await sleep(500); }
        vote = await dPost(`👆 **${id}** — tap ${YES} to approve & schedule, or ${NO} to reject (then type what to fix).\nFull quality file: ${j.video_url}`);
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
      script_approved: `✅ Script approved: **${id}**. Claude will build the video in its next daily run (11:23 PKT) and post it here.`,
      video_approved: `✅ Video approved: **${id}**. It goes live on the next publish day at 05:00 PKT (7 PM US Eastern).`,
      script_rejected: `❌ Script rejected: **${id}**. Type what to change in your next message (or type \`drop\` to throw this idea away).`,
      video_rejected: `❌ Video rejected: **${id}**. Type what to fix (shot / second / what looks wrong).`,
    };
    await dPost(texts[next]);
    if (next.endsWith('rejected')) data.awaiting = id;
    log.push(`${id}: ${next}`);
  }
  // typed messages
  // first run: start reading from "now" (Discord ids are time-based), so old messages are ignored
  if (!data.lastMsg) data.lastMsg = String((BigInt(Date.now()) - 1420070400000n) << 22n);
  const msgs = (await http({ method: 'GET', url: `${DC}/channels/${CH}/messages?after=${data.lastMsg}&limit=50`, headers: dcHeaders, json: true })) || [];
  msgs.sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1));
  for (const m of msgs) {
    data.lastMsg = m.id;
    if (m.author.bot) continue;
    const t = (m.content || '').trim();
    if (!t) continue;
    if (t === '!status' || t === '/status') {
      const st = JSON.parse((await ghGet('state.json')).text);
      await dPost('**Sneaky Deals pipeline**\n' + Object.entries(st.jobs).slice(-12).map(([id, j]) => `• ${id}: ${j.status}`).join('\n'));
    } else if (data.awaiting) {
      const id = data.awaiting; data.awaiting = null;
      await updateState((st) => {
        const j = st.jobs[id]; if (!j) return false;
        if (t.toLowerCase() === 'drop') j.status = 'dropped';
        j.feedback = ((j.feedback ? j.feedback + '\n' : '') + `[${now()}] ${t}`).slice(-3000); j.updated = now(); return true;
      }, `n8n: feedback for ${id}`);
      await dPost(t.toLowerCase() === 'drop' ? `🗑 Dropped **${id}**. Claude will pick a new story.` : `📝 Got it. Claude will fix **${id}** in its next run and post it again.`);
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
    await dPost(`🚀 Publishing now: **${meta.title}**\nZapier will upload it to YouTube within ~15 minutes.\n\nAfter it is live, pin this comment:\n> ${meta.pinned_comment || ''}`);
    log.push(`published ${id}`);
  }
}

return [{ json: { mode, log } }];
