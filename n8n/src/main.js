// Sneaky Deals pipeline — n8n side. Modes: "send" (every 2 min), "replies" (every minute), "publish" (daily 04:40 PKT).
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
const TG = `https://api.telegram.org/bot${cfg.telegram_token}`;
const log = [];

async function ghGet(path) {
  const r = await http({ method: 'GET', url: `${GH}/contents/${path}?ref=main&t=${Date.now()}`, headers: ghHeaders, json: true });
  return { text: Buffer.from(r.content, 'base64').toString('utf8'), sha: r.sha };
}
async function ghPut(path, text, sha, message) {
  return http({ method: 'PUT', url: `${GH}/contents/${path}`, headers: ghHeaders, json: true,
    body: { message, content: Buffer.from(text, 'utf8').toString('base64'), sha, branch: 'main' } });
}
// read state.json, apply fn(state) -> true if changed, write back with compare-and-swap; retries on conflict
async function updateState(fn, message) {
  for (let i = 0; i < 4; i++) {
    const f = await ghGet('state.json');
    const st = JSON.parse(f.text);
    const changed = await fn(st);
    if (!changed) return st;
    try { await ghPut('state.json', JSON.stringify(st, null, 2) + '\n', f.sha, message); return st; }
    catch (e) { if (i === 3) throw e; await new Promise((r) => setTimeout(r, 1500)); }
  }
}
const now = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z');
async function tg(method, body) { return http({ method: 'POST', url: `${TG}/${method}`, body, json: true }); }
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

// ---------------- SEND: new scripts and new videos to Telegram ----------------
if (mode === 'send') {
  const toSend = [];
  await updateState((st) => {
    let ch = false;
    for (const [id, j] of Object.entries(st.jobs)) {
      if (j.status === 'script_ready') { j.status = 'script_sent'; j.updated = now(); toSend.push(['script', id, j]); ch = true; }
      else if (j.status === 'video_ready') { j.status = 'video_sent'; j.updated = now(); toSend.push(['video', id, j]); ch = true; }
    }
    return ch;
  }, 'n8n: sending to Telegram');
  for (const [kind, id, j] of toSend) {
    try {
      if (kind === 'script') {
        let msg; try { msg = (await ghGet(`jobs/${id}/telegram.md`)).text; } catch (e) { msg = `New script ready: ${id}`; }
        await tg('sendMessage', { chat_id: cfg.telegram_chat_id, text: clip(`📝 SCRIPT FOR APPROVAL — ${id}\n\n${msg}`, 4000),
          disable_web_page_preview: true,
          reply_markup: { inline_keyboard: [[{ text: '✅ Approve script', callback_data: `sa|${id}` }, { text: '❌ Reject', callback_data: `sr|${id}` }]] } });
      } else {
        const meta = JSON.parse((await ghGet(`jobs/${id}/meta.json`)).text);
        await tg('sendVideo', { chat_id: cfg.telegram_chat_id, video: j.video_url, supports_streaming: true,
          caption: clip(`🎬 VIDEO FOR APPROVAL — ${id}\n\nTitle: ${meta.title}\n\n${meta.description}`, 1000),
          reply_markup: { inline_keyboard: [[{ text: '✅ Approve & schedule', callback_data: `va|${id}` }, { text: '❌ Reject', callback_data: `vr|${id}` }]] } });
      }
      log.push(`sent ${kind} ${id}`);
    } catch (e) {
      log.push(`FAILED to send ${kind} ${id}: ${e.message}`);
      await updateState((st) => { st.jobs[id].status = kind === 'script' ? 'script_ready' : 'video_ready'; st.jobs[id].send_error = String(e.message).slice(0, 300); return true; }, `n8n: send failed ${id}`);
    }
  }
}

// ---------------- REPLIES: buttons, feedback text, /status ----------------
if (mode === 'replies') {
  const r = await http({ method: 'GET', url: `${TG}/getUpdates?timeout=0&offset=${data.offset || 0}&allowed_updates=${encodeURIComponent('["message","callback_query"]')}`, json: true });
  for (const u of r.result || []) {
    data.offset = u.update_id + 1;
    const cq = u.callback_query, m = u.message;
    const chatId = String((cq && cq.message && cq.message.chat.id) || (m && m.chat.id) || '');
    if (chatId !== String(cfg.telegram_chat_id)) { log.push(`ignored update from chat ${chatId}`); continue; }
    if (cq) {
      const [act, id] = (cq.data || '').split('|');
      const map = { sa: ['script_sent', 'script_approved'], sr: ['script_sent', 'script_rejected'], va: ['video_sent', 'video_approved'], vr: ['video_sent', 'video_rejected'] };
      if (!map[act]) continue;
      let ok = false, cur = '';
      await updateState((st) => {
        const j = st.jobs[id]; if (!j) return false; cur = j.status;
        if (j.status !== map[act][0]) return false;
        j.status = map[act][1]; j.updated = now(); ok = true; return true;
      }, `n8n: ${id} -> ${map[act][1]}`);
      await tg('answerCallbackQuery', { callback_query_id: cq.id, text: ok ? 'Saved ✅' : `Already handled (status: ${cur})` });
      if (!ok) continue;
      try { await tg('editMessageReplyMarkup', { chat_id: chatId, message_id: cq.message.message_id, reply_markup: { inline_keyboard: [] } }); } catch (e) {}
      const texts = {
        sa: `✅ Script approved: ${id}\nClaude will make the video in its next daily run, then send it here for a final check.`,
        va: `✅ Video approved: ${id}\nIt will be published on the next publish day at 05:00 PKT (7 PM US Eastern).`,
        sr: `❌ Script rejected: ${id}\nReply to this chat with what to change (or send "drop" to throw this idea away).`,
        vr: `❌ Video rejected: ${id}\nReply with what to fix (be specific: shot, second, what looks wrong).`,
      };
      await tg('sendMessage', { chat_id: chatId, text: texts[act] });
      if (act === 'sr' || act === 'vr') data.awaiting = id;
      log.push(`${id}: ${map[act][1]}`);
    } else if (m && m.text) {
      const t = m.text.trim();
      if (t === '/status' || t === '/start') {
        const st = JSON.parse((await ghGet('state.json')).text);
        const lines = Object.entries(st.jobs).slice(-12).map(([id, j]) => `• ${id}: ${j.status}`);
        await tg('sendMessage', { chat_id: chatId, text: `Sneaky Deals pipeline\n\n${lines.join('\n')}\n\nChat id: ${chatId}` });
      } else if (data.awaiting) {
        const id = data.awaiting; data.awaiting = null;
        await updateState((st) => {
          const j = st.jobs[id]; if (!j) return false;
          if (t.toLowerCase() === 'drop') { j.status = 'dropped'; }
          j.feedback = ((j.feedback ? j.feedback + '\n' : '') + `[${now()}] ${t}`).slice(-3000); j.updated = now(); return true;
        }, `n8n: feedback for ${id}`);
        await tg('sendMessage', { chat_id: chatId, text: t.toLowerCase() === 'drop' ? `🗑 Dropped ${id}. Claude will pick a new story.` : `📝 Got it. Claude will fix ${id} in its next run and send it again.` });
        log.push(`feedback ${id}`);
      }
    }
  }
}

// ---------------- PUBLISH: one approved video on publish days, via the RSS feed Zapier watches ----------------
if (mode === 'publish') {
  const stNow = JSON.parse((await ghGet('state.json')).text);
  const days = (stNow.config && stNow.config.publish_days) || ['Mon', 'Wed', 'Fri', 'Sun'];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Karachi' });
  const pick = Object.entries(stNow.jobs).filter(([, j]) => j.status === 'video_approved').sort((a, b) => (a[1].updated || '').localeCompare(b[1].updated || ''))[0];
  if (!days.includes(today)) log.push(`not a publish day (${today})`);
  else if (!pick) {
    log.push('nothing approved to publish');
    await tg('sendMessage', { chat_id: cfg.telegram_chat_id, text: `⚠️ Publish day (${today}) but no approved video is waiting. Check Telegram for pending approvals or send /status.` });
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
    await tg('sendMessage', { chat_id: cfg.telegram_chat_id, text: `🚀 Publishing now: ${meta.title}\nZapier will upload it to YouTube within ~15 minutes.\n\nAfter it is live, pin this comment:\n${meta.pinned_comment || ''}` });
    log.push(`published ${id}`);
  }
}

return [{ json: { mode, log } }];
