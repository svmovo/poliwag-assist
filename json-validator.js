// Poliwag Assistance v2 — safe JSON parsing and validation of ChatGPT results.

export const RECOMMENDATIONS = ["KEEP", "REMOVE", "REVIEW MANUALLY"];
const CONFIDENCE = ["high", "medium", "low"];

/**
 * Pulls every top-level {...} object out of a text (code fences, prose around it, etc.)
 * by scanning braces while respecting strings. Returns the raw substrings.
 */
export function extractJsonObjects(text) {
  const s = String(text || "");
  const found = [];
  let depth = 0;
  let start = -1;
  let inStr = false;
  let esc = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; continue; }
    if (c === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (c === "}" && depth > 0) {
      depth--;
      if (depth === 0 && start >= 0) {
        found.push(s.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return found;
}

/**
 * Parses JSON without ever throwing.
 * strict = true  -> only standard JSON is accepted.
 * strict = false -> also tolerates smart quotes and trailing commas.
 */
export function parseJsonSafe(text, { strict = true } = {}) {
  const raw = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch (e) {
    if (strict) return { ok: false, error: "Invalid JSON: " + e.message };
  }
  try {
    const relaxed = raw
      .replace(/[“”„‟″]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/,\s*([}\]])/g, "$1");
    return { ok: true, value: JSON.parse(relaxed), relaxed: true };
  } catch (e) {
    return { ok: false, error: "Invalid JSON: " + e.message };
  }
}

/** Every object of a given "type" inside free text, in page order. */
export function findTypedObjects(text, type, opts) {
  const out = [];
  for (const raw of extractJsonObjects(text)) {
    const p = parseJsonSafe(raw, opts);
    if (p.ok && p.value && typeof p.value === "object" && p.value.type === type) out.push({ value: p.value, raw });
  }
  return out;
}

export function isReady(obj, taskId) {
  return !!obj && obj.type === "status" && String(obj.status).toUpperCase() === "READY" && (!obj.task_id || !taskId || obj.task_id === taskId);
}

/** subject_filter: { type, status, task_id, subjects: [{ name, mentioned, evidence }] } */
export function validateFilter(obj, { taskId } = {}) {
  const errors = [];
  if (!obj || obj.type !== "subject_filter") errors.push('"type" must be "subject_filter".');
  if (obj?.task_id && taskId && obj.task_id !== taskId) errors.push(`"task_id" is ${obj.task_id}, expected ${taskId}.`);
  if (!Array.isArray(obj?.subjects)) errors.push('"subjects" must be an array.');
  const subjects = (obj?.subjects || []).filter((s) => s && typeof s.name === "string").map((s) => ({
    name: s.name.trim(),
    mentioned: s.mentioned === true || String(s.mentioned).toLowerCase() === "true",
    evidence: Array.isArray(s.evidence) ? s.evidence.join(" · ") : String(s.evidence || ""),
    annotationOk: s.annotation_ok === undefined || s.annotation_ok === null ? undefined : (s.annotation_ok === true || String(s.annotation_ok).toLowerCase() === "true"),
    annotationComment: String(s.annotation_comment || ""),
    decision: ["keep", "edit", "remove"].includes(String(s.decision || "").toLowerCase()) ? String(s.decision).toLowerCase() : null,
    correctedAnnotation: String(s.corrected_annotation || ""),
    duplicateOf: String(s.duplicate_of || "")
  })).map((s) => {
    // Topics Verification decision (keep / edit / remove) decides "mentioned" and the note check
    if (s.decision === "remove") s.mentioned = false;
    if (s.decision === "keep" || s.decision === "edit") s.mentioned = true;
    if (s.decision === "edit") s.annotationOk = false;
    if (s.decision === "keep") s.annotationOk = true;
    return s;
  });
  if (!errors.length && !subjects.length) errors.push("No subjects in the filter result.");
  return errors.length ? { ok: false, errors } : { ok: true, errors: [], value: { subjects, listComment: String(obj?.list_comment || "") } };
}

/** Finds the last object of a given "type" inside free text. */
export function findTypedObject(text, type, opts) {
  const candidates = extractJsonObjects(text);
  for (let i = candidates.length - 1; i >= 0; i--) {
    const p = parseJsonSafe(candidates[i], opts);
    if (p.ok && p.value && typeof p.value === "object" && p.value.type === type) {
      return { ok: true, value: p.value, raw: candidates[i] };
    }
  }
  if (candidates.length === 0) return { ok: false, error: "No JSON object found in the ChatGPT response." };
  return { ok: false, error: `No valid "${type}" JSON object found in the ChatGPT response.` };
}

const isStr = (v) => typeof v === "string";
const isNonEmptyStr = (v) => typeof v === "string" && v.trim().length > 0;
const isStrArray = (v) => Array.isArray(v) && v.every((x) => typeof x === "string");

/**
 * Validates a transcription_result.
 * Returns { ok, errors[], value } where value is normalised.
 */
// Gemini sometimes injects citation markers like "[cite: 21]" or "[cite_start]" into the text: remove them.
export function stripCitations(t) {
  return String(t)
    .replace(/\s*\[\s*cite(?:_start|_end)?\s*(?::[^\]]*)?\]/gi, " ")
    .replace(/\s*【[^】]*】/g, " ")
    .replace(/\s+([،.؟?!,])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function validateTranscription(obj, { taskId, strict = true } = {}) {
  const errors = [];
  if (obj && typeof obj === "object" && typeof obj.transcription === "string") obj = { ...obj, transcription: stripCitations(obj.transcription) };
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return { ok: false, errors: ["Result is not a JSON object."] };
  }
  if (obj.type !== "transcription_result") errors.push('"type" must be "transcription_result".');
  if (obj.status !== "completed") errors.push(`"status" is "${obj.status}", expected "completed" — the transcription is not finished.`);
  if (isNonEmptyStr(obj.task_id) && taskId && obj.task_id !== taskId) errors.push(`"task_id" is ${obj.task_id}, but the current task is ${taskId}.`);
  if (!isNonEmptyStr(obj.language)) errors.push('"language" is missing.');
  if (!isNonEmptyStr(obj.transcription)) errors.push('"transcription" is missing or empty.');
  else if (/^[\s.…<>]*$/.test(obj.transcription)) errors.push('"transcription" is only a placeholder.');

  if (strict) {
    if (!("uncertain_words" in obj) || !Array.isArray(obj.uncertain_words)) errors.push('"uncertain_words" must be an array.');
    if (!("notes" in obj) || !Array.isArray(obj.notes)) errors.push('"notes" must be an array.');
  }

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    errors: [],
    value: {
      type: "transcription_result",
      status: "completed",
      task_id: obj.task_id || taskId || "",
      audio_id: obj.audio_id || "",
      language: obj.language,
      transcription: obj.transcription,
      uncertain_words: Array.isArray(obj.uncertain_words) ? obj.uncertain_words.map(String) : [],
      notes: Array.isArray(obj.notes) ? obj.notes.map(String) : []
    }
  };
}

/** Validates a READY handshake. */
export function validateReady(obj, { taskId } = {}) {
  if (!obj || obj.type !== "status") return { ok: false, errors: ['"type" must be "status".'] };
  if (String(obj.status).toUpperCase() !== "READY") return { ok: false, errors: ['"status" must be "READY".'] };
  if (taskId && obj.task_id && obj.task_id !== taskId) return { ok: false, errors: ["READY belongs to another task."] };
  return { ok: true, errors: [] };
}

/** Validates a subject_analysis. */
export function validateAnalysis(obj, { taskId, strict = true } = {}) {
  const errors = [];
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return { ok: false, errors: ["Result is not a JSON object."] };
  }
  if (obj.type !== "subject_analysis") errors.push('"type" must be "subject_analysis".');
  if (obj.status !== "completed") errors.push(`"status" is "${obj.status}", expected "completed".`);
  if (!isNonEmptyStr(obj.task_id)) errors.push('"task_id" is missing.');
  else if (taskId && obj.task_id !== taskId) errors.push(`"task_id" is ${obj.task_id}, but the task is ${taskId}.`);
  if (!Array.isArray(obj.subjects)) errors.push('"subjects" must be an array.');

  const subjects = [];
  (Array.isArray(obj.subjects) ? obj.subjects : []).forEach((s, i) => {
    const where = `subjects[${i}]`;
    if (!s || typeof s !== "object") { errors.push(`${where} is not an object.`); return; }
    const rec = String(s.recommendation || "").toUpperCase().replace(/_/g, " ").trim();
    if (!isNonEmptyStr(s.name)) errors.push(`${where}.name is missing.`);
    if (!RECOMMENDATIONS.includes(rec)) errors.push(`${where}.recommendation "${s.recommendation}" must be KEEP, REMOVE or REVIEW MANUALLY.`);
    if (strict && !isStrArray(s.evidence)) errors.push(`${where}.evidence must be an array of strings.`);
    if (strict && !isStr(s.reason)) errors.push(`${where}.reason is missing.`);
    const conf = String(s.confidence || "").toLowerCase();
    subjects.push({
      name: String(s.name || "").trim(),
      recommendation: rec,
      evidence: Array.isArray(s.evidence) ? s.evidence.map(String) : [],
      reason: String(s.reason || ""),
      confidence: CONFIDENCE.includes(conf) ? conf : "medium"
    });
  });

  if (errors.length) return { ok: false, errors };
  return { ok: true, errors: [], value: { type: "subject_analysis", status: "completed", task_id: obj.task_id, subjects } };
}
