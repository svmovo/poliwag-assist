// By svmovo (github.com/svmovo) - Sam Poliwag Assist
// Sam Poliwag Assist v7 — background service worker (ChatGPT or Gemini).
// The bar on the Poliwag page and the ChatGPT tab both talk to it; it is the only writer of task data.

import { loadAll, mutate, createTask, nowIso, hashText, similarity } from "./storage.js";
import { findTypedObjects, validateTranscription, isReady, validateFilter } from "./json-validator.js";
import { buildPreparationPrompt, buildFilterPrompt, mergeFilter } from "./prompts.js";

const ENGINES = {
  chatgpt: { name: "ChatGPT", newUrl: "https://chatgpt.com/", match: "https://chatgpt.com/*", re: /^https:\/\/chatgpt\.com\//, conv: /\/c\/[\w-]+/ },
  gemini: { name: "Gemini", newUrl: "https://gemini.google.com/app", match: "https://gemini.google.com/*", re: /^https:\/\/gemini\.google\.com\//, conv: /\/app\/[\w-]+/ }
};
const AI_MATCHES = Object.values(ENGINES).map((e) => e.match);
const engineOf = (task) => ENGINES[task?.chat?.engine] || ENGINES.chatgpt;
const isAiUrl = (url) => Object.values(ENGINES).some((e) => e.re.test(url || ""));
const BAR_SCRIPT_ID = "poliwag-bar";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ================================================================ bar registration (Poliwag site)

async function barOrigins() {
  const all = await chrome.permissions.getAll();
  return (all.origins || []).filter((o) => !o.includes("chatgpt.com") && !o.includes("gemini.google.com"));
}

async function syncBarScript() {
  const origins = await barOrigins();
  const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [BAR_SCRIPT_ID] }).catch(() => []);
  if (!origins.length) {
    if (existing.length) await chrome.scripting.unregisterContentScripts({ ids: [BAR_SCRIPT_ID] }).catch(() => {});
    return;
  }
  const def = { id: BAR_SCRIPT_ID, matches: origins, js: ["bar.js"], runAt: "document_idle", persistAcrossSessions: true };
  if (existing.length) await chrome.scripting.updateContentScripts([def]);
  else await chrome.scripting.registerContentScripts([def]);
  // Show the bar right away in tabs that are already open on that site.
  const tabs = await chrome.tabs.query({ url: origins });
  for (const t of tabs) {
    chrome.scripting.executeScript({ target: { tabId: t.id }, files: ["bar.js"] }).catch(() => {});
  }
}

chrome.permissions.onAdded.addListener(() => syncBarScript());
chrome.permissions.onRemoved.addListener(() => syncBarScript());
chrome.runtime.onInstalled.addListener(() => { syncBarScript(); checkOnWake(); });
chrome.runtime.onStartup.addListener(() => { syncBarScript(); checkOnWake(); });

// ================================================================ ChatGPT tab helpers

async function tabAlive(tabId) {
  if (!tabId) return null;
  try {
    const t = await chrome.tabs.get(tabId);
    return isAiUrl(t.url || t.pendingUrl || "") ? t : null;
  } catch { return null; }
}

function waitTabComplete(tabId, timeoutMs = 30000) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (!done) { done = true; chrome.tabs.onUpdated.removeListener(onUpd); resolve(v); } };
    const onUpd = (id, info) => { if (id === tabId && info.status === "complete") finish(true); };
    chrome.tabs.onUpdated.addListener(onUpd);
    chrome.tabs.get(tabId).then((t) => { if (t.status === "complete") finish(true); }).catch(() => finish(false));
    setTimeout(() => finish(false), timeoutMs);
  });
}

async function ensureContentScript(tabId) {
  for (let i = 0; i < 10; i++) {
    try {
      const r = await chrome.tabs.sendMessage(tabId, { type: "PA_PING" });
      if (r?.ok) return true;
    } catch {
      if (i === 1) { try { await chrome.scripting.executeScript({ target: { tabId }, files: ["content-chatgpt.js"] }); } catch {} }
    }
    await sleep(700);
  }
  return false;
}

async function findTabByTaskId(task) {
  const tabs = await chrome.tabs.query({ url: engineOf(task).match });
  tabs.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
  for (const t of tabs) {
    for (let k = 0; k < 2; k++) {
      try {
        const r = await chrome.tabs.sendMessage(t.id, { type: "PA_HAS_TEXT", text: task.id });
        if (r?.found) return t;
        break;
      } catch {
        try { await chrome.scripting.executeScript({ target: { tabId: t.id }, files: ["content-chatgpt.js"] }); } catch { break; }
      }
    }
  }
  return null;
}

async function findTaskTab(task) {
  let t = await tabAlive(task?.chat?.tabId);
  if (!t && task?.chat?.url) {
    const tabs = await chrome.tabs.query({ url: engineOf(task).match });
    t = tabs.find((x) => (x.url || "").split("?")[0] === task.chat.url) || null;
  }
  if (!t && task) t = await findTabByTaskId(task);
  if (t && task && task.chat.tabId !== t.id) {
    await mutate((st, ts) => { if (ts[task.id]) ts[task.id].chat.tabId = t.id; st.chatgpt.tabId = t.id; });
  }
  return t;
}

async function sendPromptToTab(tabId, text) {
  await waitTabComplete(tabId);
  if (!(await ensureContentScript(tabId))) return { ok: false, error: "AI page not reachable." };
  try { return await chrome.tabs.sendMessage(tabId, { type: "PA_SEND_PROMPT", text }); }
  catch (e) { return { ok: false, error: String(e.message || e) }; }
}

// Button Send: the segment's .wav goes to the task's AI conversation with its prompt.
// The JSON reply is picked up like any other reply and shows in Trans ChatGPT.
async function sendSegment(m) {
  const { state, tasks } = await loadAll();
  const task = tasks[state.currentTaskId];
  if (!task) return { ok: false, error: "Pas de task — cliquez + d'abord." };
  const tab = await findTaskTab(task);
  if (!tab) return { ok: false, error: "Conversation de la task introuvable (onglet fermé ?)." };
  const name = m.name || `poliwag_seg_${m.n}.wav`;
  // The rules were given once in the first prompt of the conversation: only the .wav is sent.
  const prompt = "";
  await waitTabComplete(tab.id);
  if (!(await ensureContentScript(tab.id))) return { ok: false, error: "AI page not reachable." };
  await mutate((st, tasks2) => {
    const t2 = tasks2[st.currentTaskId];
    if (t2) { t2.pendingSends = (t2.pendingSends || 0) + 1; t2.sendCount = (t2.sendCount || 0) + 1; t2.lastSendAt = Date.now(); }
  });
  let r;
  try { r = await chrome.tabs.sendMessage(tab.id, { type: "PA_SEND_FILE", b64: m.b64, name, mime: "audio/wav", text: prompt, waitMs: m.waitMs }); }
  catch (e) { r = { ok: false, error: String(e.message || e) }; }
  if (!r?.ok) await mutate((st, ts) => { const t2 = ts[st.currentTaskId]; if (t2) t2.pendingSends = Math.max(0, (t2.pendingSends || 0) - 1); });
  return r || { ok: false, error: "No answer from the AI page." };
}

async function readLatestFromTab(tabId) {
  if (!(await ensureContentScript(tabId))) return { ok: false, error: "AI page not reachable." };
  try { return await chrome.tabs.sendMessage(tabId, { type: "PA_READ_LATEST" }); }
  catch (e) { return { ok: false, error: String(e.message || e) }; }
}

async function setChat(status, message = "", extra = {}) {
  await mutate((s) => { s.chatgpt = { ...s.chatgpt, status, message, updatedAt: nowIso(), ...extra }; });
}

// ================================================================ ChatGPT replies

// Removes copies created by older versions (same reply read twice) and recounts the possible duplicates.
function cleanCopies(task) {
  const used = new Set(Object.values(task.segments || {}).map((g) => g.audioN));
  const keep = [];
  const seenKey = new Map();
  for (const a of task.audios.slice().sort((x, y) => x.n - y.n)) {
    const key = (a.audioId || "") + "|" + a.hash;
    if (seenKey.has(key) && !used.has(a.n)) continue;
    if (!seenKey.has(key)) seenKey.set(key, a.n);
    keep.push(a);
  }
  if (keep.length !== task.audios.length) task.audios = keep;
  const ids = new Set(task.audios.map((a) => a.n));
  task.dupCount = task.audios.filter((a) => a.dupOf !== null && a.dupOf !== undefined && ids.has(a.dupOf)).length;
}

async function handleReply(tabId, reply) {
  const text = [reply.codeText, reply.text].filter(Boolean).join("\n\n");
  await mutate((state, tasks) => {
    const task = tasks[state.currentTaskId];
    if (!task) return;
    const sameTab = task.chat.tabId === tabId || (task.chat.url && reply.url && reply.url.startsWith(task.chat.url));
    if (!sameTab && !text.includes(task.id)) return;
    if (!sameTab) { task.chat.tabId = tabId; state.chatgpt.tabId = tabId; }
    if (reply.url && engineOf(task).conv.test(reply.url)) task.chat.url = reply.url.split("?")[0];
    const opts = { strict: state.settings.strictJson };
    cleanCopies(task);
    // Each JSON is identified by its content only. ChatGPT / Gemini load long conversations in pieces,
    // so the same reply can show up at another place on the page: it must never be counted twice.
    const sources = Array.isArray(reply.blocks) && reply.blocks.length
      ? reply.blocks.map((b, i) => ({ text: b, pos: "b" + i }))
      : [{ text, pos: `${reply.preCount || 0}.${reply.msgCount || 0}` }];
    // A JSON already read is never counted again (the page can show the same block twice, or load it
    // again while scrolling). Only exception: after a Send that has not been answered yet, an identical
    // JSON in the LAST block of the page is that Send's answer (same segment sent again → same answer).
    const lastPos = Array.isArray(reply.blocks) && reply.blocks.length ? "b" + (reply.blocks.length - 1) : null;
    const seen = (raw, pos) => {
      const sig = "j" + hashText(raw);
      if (task.seen.includes(sig)) {
        const again = "j" + hashText(raw) + "@" + (task.sendCount || 0);
        if ((task.pendingSends || 0) > 0 && pos === lastPos && !task.seen.includes(again) && (task.lastSendAt || 0) > (task.lastReplyAt || 0)) {
          task.seen.push(again);
          return false;
        }
        return true;
      }
      task.seen.push(sig);
      if (task.seen.length > 3000) task.seen = task.seen.slice(-3000);
      return false;
    };
    const found = (type, o) => sources.flatMap((src) => findTypedObjects(src.text, type, o).map((r) => ({ ...r, pos: src.pos })));

    // READY handshake
    for (const r of found("status", { strict: false })) {
      if (isReady(r.value, task.id) && state.chatgpt.status !== "ready") {
        state.chatgpt = { ...state.chatgpt, status: "ready", message: "", manualPrompt: null, updatedAt: nowIso() };
      }
    }

    // Transcriptions
    for (const r of found("transcription_result", opts)) {
      if (seen(r.raw, r.pos)) continue;
      const v = validateTranscription(r.value, { taskId: task.id, strict: opts.strict });
      if (!v.ok) {
        if (r.value.task_id && r.value.task_id !== task.id) continue;
        // keep what the AI said (e.g. "no audio file was received") so Auto can send the audio again
        state.lastEvent = { kind: "invalid", errors: v.errors, at: nowIso(), taskId: task.id,
          audioId: String(r.value.audio_id || ""), notes: Array.isArray(r.value.notes) ? r.value.notes.map(String) : [] };
        continue;
      }
      const t = v.value.transcription;
      // A JSON that looks like an earlier one is SAVED anyway (so the numbering stays in sync with Poliwag)
      // and only flagged, so you can check it.
      const like = task.audios.find((a) => similarity(a.chatText, t) >= state.settings.dupThreshold);
      const n = task.audios.length ? Math.max(...task.audios.map((a) => a.n)) + 1 : 0;
      task.pendingSends = Math.max(0, (task.pendingSends || 0) - 1);
      task.lastReplyAt = Date.now();
      task.audios.push({
        n, audioId: v.value.audio_id, language: v.value.language, chatText: t, draft: null, dupOf: like ? like.n : null,
        uncertainWords: v.value.uncertain_words, notes: v.value.notes, hash: hashText(t), receivedAt: nowIso(), json: r.value
      });
      if (like) task.dupCount = (task.dupCount || 0) + 1;
      task.updatedAt = nowIso();
      state.chatgpt = { ...state.chatgpt, status: "ready", message: "", manualPrompt: null, updatedAt: nowIso() };
      state.lastEvent = { kind: "new", n, dupOf: like ? like.n : null, at: nowIso(), taskId: task.id };
    }

    // Subject filter
    for (const r of found("subject_filter", { strict: false })) {
      if (seen(r.raw, r.pos)) continue;
      const v = validateFilter(r.value, { taskId: task.id });
      if (!v.ok) {
        task.filter = { ...task.filter, status: "error", error: v.errors.join(" "), at: nowIso() };
      } else {
        task.filter = { ...task.filter, status: "completed", results: mergeFilter(task.subjects, v.value), listComment: v.value.listComment || "", error: null, at: nowIso() };
        state.lastEvent = { kind: "filter", at: nowIso(), taskId: task.id };
      }
      state.chatgpt = { ...state.chatgpt, status: "ready", message: "", updatedAt: nowIso() };
    }
  });
}

// ================================================================ actions

async function newTask(subjects, engineKey) {
  const eng = ENGINES[engineKey] ? engineKey : "chatgpt";
  const task = await mutate((state, tasks) => {
    const t = createTask(tasks);
    t.chat.engine = eng;
    if (Array.isArray(subjects) && subjects.length) { t.subjects = subjects; t.subjectsReadAt = nowIso(); }
    state.currentTaskId = t.id;
    state.lastEvent = { kind: "task", at: nowIso(), taskId: t.id };
    state.chatgpt = { status: "opening", tabId: null, message: "Opening " + ENGINES[eng].name + "…", manualPrompt: null, updatedAt: nowIso() };
    return t;
  });
  const tab = await chrome.tabs.create({ url: ENGINES[eng].newUrl, active: true });
  await mutate((s, ts) => { ts[task.id].chat.tabId = tab.id; s.chatgpt.tabId = tab.id; });
  const { state } = await loadAll();
  // the task is in the language chosen in the bar (AR / FR / EN): the prompt asks for that language
  const lang = "ar";
  await mutate((s, ts) => { ts[task.id].language = lang; });
  const prompt = buildPreparationPrompt(task.id, lang);
  const r = await sendPromptToTab(tab.id, prompt);
  if (!r?.ok) {
    await setChat("manual", "Auto-send failed — copy the prompt and paste it into " + ENGINES[eng].name + ".", { manualPrompt: prompt });
    return { ok: false, error: r?.error, taskId: task.id };
  }
  await setChat("prompt_sent", "En attente de READY…", { manualPrompt: null });
  return { ok: true, taskId: task.id };
}

async function readNow() {
  const { state, tasks } = await loadAll();
  const task = tasks[state.currentTaskId];
  if (!task) return { ok: false, error: "Pas de task." };
  const tab = await findTaskTab(task);
  if (!tab) {
    if (state.chatgpt.status !== "manual") await setChat("disconnected", "AI tab of the task not found.");
    return { ok: false, error: "AI tab not found." };
  }
  const latest = await readLatestFromTab(tab.id);
  if (!latest?.ok) return { ok: false, error: latest?.error };
  if (latest.generating) return { ok: true, generating: true };
  if (latest.hasMessage) await handleReply(tab.id, latest);
  return { ok: true, pageError: latest.pageError || "" };
}

async function runFilter(pageSubjects) {
  // Fresh list from the page, with what is written in each annotation box.
  if (Array.isArray(pageSubjects) && pageSubjects.length) {
    await mutate((s, ts) => {
      const t = ts[s.currentTaskId];
      if (t) { t.subjects = pageSubjects; t.subjectsReadAt = nowIso(); }
    });
  }
  const { state, tasks } = await loadAll();
  const task = tasks[state.currentTaskId];
  if (!task) return { ok: false, error: "Pas de task." };
  if (!task.subjects.length) return { ok: false, error: "Aucun subject lu dans la page." };
  const audios = task.audios
    .map((a) => {
      const seg = task.segments[a.n];
      return { n: a.n, text: seg?.action === "replaced" ? seg.finalText : (a.draft || a.chatText) };
    })
    .filter((a) => a.text);
  if (!audios.length) return { ok: false, error: "Aucune transcription reçue pour l'instant." };
  const prompt = buildFilterPrompt(task, task.subjects, audios);
  await mutate((s, ts) => { ts[task.id].filter = { ...ts[task.id].filter, status: "waiting", error: null, prompt, at: nowIso() }; });
  const tab = await findTaskTab(task);
  if (!tab) {
    await setChat("manual", "Onglet ChatGPT fermé — copiez le prompt Filtres et collez-le dans ChatGPT.", { manualPrompt: prompt });
    return { ok: false, error: "ChatGPT tab not found.", manualPrompt: true };
  }
  const r = await sendPromptToTab(tab.id, prompt);
  if (!r?.ok) {
    await setChat("manual", "Auto-send failed — copy the filter prompt and paste it into the AI.", { manualPrompt: prompt });
    return { ok: false, error: r?.error, manualPrompt: true };
  }
  await setChat("analysing", "Checking subjects…");
  return { ok: true };
}

async function reconnect() {
  const { state, tasks } = await loadAll();
  const task = tasks[state.currentTaskId];
  if (!task) return { ok: false, error: "Pas de task." };
  let tab = await findTaskTab(task);
  if (!tab && task.chat.url) {
    tab = await chrome.tabs.create({ url: task.chat.url, active: false });
    await mutate((s, ts) => { ts[task.id].chat.tabId = tab.id; s.chatgpt.tabId = tab.id; });
    await waitTabComplete(tab.id);
    await ensureContentScript(tab.id);
  }
  if (!tab) return { ok: false, error: "Conversation de la task introuvable." };
  await setChat("ready", "");
  return { ok: true };
}

function askAudioHelper(message) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendNativeMessage("com.poliwag.audio", message, (reply) => {
        if (chrome.runtime.lastError) resolve({ ok: false, offline: true, error: chrome.runtime.lastError.message });
        else resolve(reply || { ok: false, error: "Empty reply." });
      });
    } catch (e) { resolve({ ok: false, offline: true, error: String(e) }); }
  });
}

// ================================================================ messages

const handlers = {
  PA_NEW_TASK: (m) => newTask(m.subjects, m.engine),
  PA_READ_NOW: () => readNow(),
  PA_FILTER: (m) => runFilter(m.subjects),
  PA_SEND_SEGMENT: (m) => sendSegment(m),
  // The JSON is late: show the AI page for a moment (Chrome lets a visible page finish and render
  // its answer), read it, then go back to Maven.
  PA_NUDGE_AI: async (m, sender) => {
    const { state, tasks } = await loadAll();
    const task = tasks[state.currentTaskId];
    const tab = task ? await findTaskTab(task) : null;
    const back = sender?.tab;
    if (!tab || !back) return { ok: false };
    try {
      await chrome.windows.update(tab.windowId, { focused: true });
      await chrome.tabs.update(tab.id, { active: true });
      await new Promise((res) => setTimeout(res, 2500));
      await readNow();
    } finally {
      await chrome.windows.update(back.windowId, { focused: true }).catch(() => {});
      await chrome.tabs.update(back.id, { active: true }).catch(() => {});
    }
    return { ok: true };
  },
  // Auto stopped: reload the task's AI page (Gemini can stay stuck on an upload / a reply)
  PA_RELOAD_AI: async () => {
    const { state, tasks } = await loadAll();
    const task = tasks[state.currentTaskId];
    const tab = task ? await findTaskTab(task) : null;
    if (!tab) return { ok: false, error: "AI tab not found." };
    await chrome.tabs.reload(tab.id);
    return { ok: true };
  },
  PA_RECONNECT: () => reconnect(),
  PA_SET_SUBJECTS: (m) => mutate((s, ts) => {
    const t = ts[s.currentTaskId];
    if (!t) return { ok: false };
    t.subjects = m.subjects || [];
    t.subjectsReadAt = nowIso();
    if (t.filter.status === "completed") t.filter.results = mergeFilter(t.subjects, { subjects: t.filter.results });
    return { ok: true };
  }),
  PA_AUDIO_DRAFT: (m) => mutate((s, ts) => {
    const a = ts[s.currentTaskId]?.audios.find((x) => x.n === m.n);
    if (a) a.draft = m.text === a.chatText ? null : m.text;
    return { ok: !!a };
  }),
  PA_SEGMENT_SAVE: (m) => mutate((s, ts) => {
    const t = ts[s.currentTaskId];
    if (!t) return { ok: false, error: "Pas de task." };
    t.segments[m.n] = { action: m.action, audioN: m.audioN ?? m.n, chatText: m.chatText || "", finalText: m.finalText || "", pageTextBefore: m.pageTextBefore ?? "", at: nowIso() };
    t.updatedAt = nowIso();
    return { ok: true };
  }),
  PA_AUDIO_LIST: () => askAudioHelper({ cmd: "list" }),
  PA_AUDIO_SET: (m) => askAudioHelper({ cmd: "set", target: m.target }),
  PA_STATUS_CHECK: async () => {
    const { state, tasks } = await loadAll();
    const task = tasks[state.currentTaskId];
    if (!task) return { ok: true };
    const tab = await tabAlive(task.chat.tabId);
    if (!tab && ["ready", "prompt_sent", "analysing"].includes(state.chatgpt.status)) {
      const found = await findTaskTab(task);
      if (!found) await setChat("disconnected", "Onglet ChatGPT fermé.");
    }
    return { ok: true };
  },
  PA_SET_CURRENT: (m) => mutate((s, ts) => {
    if (!ts[m.taskId]) return { ok: false, error: "Task introuvable." };
    s.currentTaskId = m.taskId;
    s.lastEvent = { kind: "task", at: nowIso(), taskId: m.taskId };
    s.chatgpt = { ...s.chatgpt, status: "disconnected", tabId: ts[m.taskId].chat.tabId || null, message: "Task loaded — click the badge to find its AI conversation." };
    return { ok: true };
  }),
  PA_DELETE_TASK: (m) => mutate((s, ts) => {
    if (!ts[m.taskId]) return { ok: false, error: "Task introuvable." };
    delete ts[m.taskId];
    if (s.currentTaskId === m.taskId) {
      s.currentTaskId = null;
      s.chatgpt = { status: "disconnected", tabId: null, message: "", manualPrompt: null, updatedAt: nowIso() };
    }
    return { ok: true };
  }),
  // Lists the audio files the page itself loaded (all frames, page world). Read only.
  // Supprimer: click Maven's own Remove in the page itself, with its "OK?" confirmation answered yes,
  // so the subject is removed at once (no OK to press).
  PA_REMOVE_TOPIC: async (m, sender) => {
    if (!sender?.tab?.id) return { ok: false };
    const results = await chrome.scripting.executeScript({
      target: { tabId: sender.tab.id, allFrames: true }, world: "MAIN", args: [String(m.name || "")],
      func: (name) => {
        const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();
        const row = [...document.querySelectorAll(".pw-topic-row")].find((r) => norm(r.querySelector(".pw-topic-label")?.textContent) === name);
        const btn = row?.querySelector('[data-action="remove-topic"]');
        if (!btn) return false;
        const oc = window.confirm, oa = window.alert;
        window.confirm = () => true; window.alert = () => {};
        try { btn.click(); } finally { setTimeout(() => { window.confirm = oc; window.alert = oa; }, 2000); }
        return true;
      }
    }).catch(() => []);
    return { ok: (results || []).some((r) => r.result === true) };
  },
  PA_FIND_AUDIO: async (m, sender) => {
    const tabId = sender?.tab?.id;
    if (!tabId) return { ok: false, urls: [] };
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        world: "MAIN",
        func: () => {
          const re = /\.(wav|mp3|m4a|ogg|flac|opus|webm)(\?|$)/i;
          const now = performance.now();
          const out = performance.getEntriesByType("resource").filter((e) => e.initiatorType !== "script" && re.test(e.name)).map((e) => ({ url: e.name, t: e.startTime - now + Date.now() }));
          document.querySelectorAll("audio[src], video[src], source[src]").forEach((el) => { if (re.test(el.src)) out.push({ url: el.src, t: Date.now() }); });
          return out;
        }
      });
      const urls = [];
      for (const r of results || []) for (const u of r.result || []) urls.push(u);
      return { ok: true, urls };
    } catch (e) {
      return { ok: false, urls: [], error: String(e.message || e) };
    }
  },
  PA_SET_UI_LANG: (m) => mutate((s) => { s.settings = { ...s.settings, uiLang: "ar" }; return { ok: true }; }),
  PA_SYNC_BAR: () => syncBarScript().then(() => ({ ok: true })),
  PA_SET_BAR_HIDDEN: (m) => mutate((s) => { s.settings = { ...s.settings, barHidden: !!m.hidden }; return { ok: true }; })
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const fromChatGPT = sender.tab && isAiUrl(sender.tab.url || "");
  if (fromChatGPT) {
    if (msg?.type === "PA_REPLY_FINISHED") handleReply(sender.tab.id, msg).catch((e) => console.error("[Poliwag]", e));
    if (msg?.type === "PA_CHAT_URL") {
      mutate((s, ts) => {
        const t = ts[s.currentTaskId];
        if (t && t.chat.tabId === sender.tab.id && engineOf(t).conv.test(msg.url)) t.chat.url = msg.url.split("?")[0];
      }).catch(() => {});
    }
    return false; // the ChatGPT page can never trigger task actions
  }
  if (sender.id !== chrome.runtime.id) return false;
  const h = handlers[msg?.type];
  if (!h) return false;
  Promise.resolve().then(() => h(msg, sender)).then((r) => sendResponse(r ?? { ok: true }))
    .catch((e) => sendResponse({ ok: false, error: String(e?.message || e) }));
  return true;
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const { state } = await loadAll();
  if (state.chatgpt.tabId === tabId) await setChat("disconnected", "AI tab closed — transcriptions are saved.", { tabId: null });
});

async function checkOnWake() {
  const { state, tasks } = await loadAll();
  const task = tasks[state.currentTaskId];
  if (!task) return;
  const tab = await tabAlive(task.chat.tabId);
  if (!tab) await setChat("disconnected", "Navigateur redémarré — ouvrez la conversation de la task.", { tabId: null });
                           }

