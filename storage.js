// By svmovo (github.com/svmovo) - Sam Poliwag Assist
// Poliwag Assistance v2 — local storage (chrome.storage.local only; nothing leaves the PC).
//
// pa_state : { currentTaskId, settings, chatgpt, lastEvent }
// pa_tasks : { [taskId]: Task }
//
// Task {
//   id, createdAt, updatedAt,
//   chat: { tabId, url },
//   audios:   [{ n, audioId, language, chatText, draft, uncertainWords, notes, hash, receivedAt, json }],
//             n = the Poliwag segment number (0, 1, 2 … like the ▶ button on the page)
//   segments: { [n]: { action: "replaced"|"kept", chatText, finalText, pageTextBefore, at } },
//   subjects: [{ name, code, key }], subjectsReadAt,
//   filter:   { status: "not_started"|"waiting"|"completed"|"error", results: [{ name, mentioned, evidence }], at, error, prompt },
//   dupCount, seen: [signature]
// }

export const VERSION = "15.4.0";
const STATE_KEY = "pa_state";
const TASKS_KEY = "pa_tasks";

export const DEFAULT_SETTINGS = {
  defaultLanguage: "ar-EG",
  strictJson: true,
  dupThreshold: 0.9
};

function defaultState() {
  return {
    currentTaskId: null,
    settings: { ...DEFAULT_SETTINGS },
    chatgpt: { status: "disconnected", tabId: null, message: "", manualPrompt: null, updatedAt: null },
    lastEvent: null
  };
}

export async function loadAll() {
  const data = await chrome.storage.local.get([STATE_KEY, TASKS_KEY]);
  const state = { ...defaultState(), ...(data[STATE_KEY] || {}) };
  state.settings = { ...DEFAULT_SETTINGS, ...(state.settings || {}) };
  state.chatgpt = { ...defaultState().chatgpt, ...(state.chatgpt || {}) };
  return { state, tasks: data[TASKS_KEY] || {} };
}

export async function saveAll(state, tasks) {
  await chrome.storage.local.set({ [STATE_KEY]: state, [TASKS_KEY]: tasks });
}

// Every read-modify-write goes through this queue so two events never overwrite each other.
let queue = Promise.resolve();
export function mutate(fn) {
  const run = queue.then(async () => {
    const { state, tasks } = await loadAll();
    const result = await fn(state, tasks);
    await saveAll(state, tasks);
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

export const nowIso = () => new Date().toISOString();

export function createTask(tasks) {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const day = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  let i = 1;
  let id;
  do { id = `TASK_${day}_${pad(i)}`; i++; } while (tasks[id]);
  const t = nowIso();
  tasks[id] = {
    id,
    createdAt: t,
    updatedAt: t,
    chat: { tabId: null, url: null },
    audios: [],
    segments: {},
    subjects: [],
    subjectsReadAt: null,
    filter: { status: "not_started", results: [], at: null, error: null, prompt: null },
    dupCount: 0,
    seen: []
  };
  return tasks[id];
}

export function hashText(s) {
  let h = 0x811c9dc5;
  const str = String(s || "").replace(/\s+/g, " ").trim().toLowerCase();
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function words(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/\[[a-z_]+\]/g, " ")
    .replace(/[^a-z0-9؀-ۿ]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

/** 0..1 — word-level similarity (1 = identical), used to spot an audio sent twice. */
export function similarity(a, b) {
  const x = words(a);
  const y = words(b);
  if (!x.length && !y.length) return 1;
  if (!x.length || !y.length) return 0;
  let prev = Array.from({ length: y.length + 1 }, (_, j) => j);
  for (let i = 1; i <= x.length; i++) {
    const cur = [i];
    for (let j = 1; j <= y.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return 1 - prev[y.length] / Math.max(x.length, y.length);
}

