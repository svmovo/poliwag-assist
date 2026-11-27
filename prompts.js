// By svmovo (github.com/svmovo) - Poliwag Assist
// Poliwag Assistance v7 — prompts sent to ChatGPT or Gemini, and matching of the subject filter.

// Poliwag transcription rules, sent with the preparation prompt AND with every segment (button Send).
const TAGS = {
  laugh: "laughter", cry: "crying", cough: "cough", throat_clear: "throat clearing", sigh: "sigh",
  sneeze: "sneeze", hiccup: "hiccup", burp: "burp", gasp: "sudden gasp", breath: "clearly audible inhale",
  gag: "gagging sound", melodic_vocalization: "humming / melodic sounds", yell: "yelling", cheer: "cheering",
  bool: "non-speech human sound (per guideline)", other_vocalization: "other human sound not listed here",
  unintelligible: "audible but not understandable speech", code_switch: "switch to another language"
};
// The language of the task = the language chosen in the bar (AR / FR / EN) when the task is created.
export const TASK_LANGS_ALL = {
  ar: { code: "ar-EG", name: "Arabic", native: "العربية",
        line: "هذه المهمة بالعربية (غالبًا عامية مصرية): اكتب بالحروف العربية كل كلمة كما قيلت بالضبط وبنفس اللهجة، بدون تحويلها للفصحى وبدون ترجمة.",
        script: [
          `Write it in ARABIC SCRIPT only, never Latin letters, no vowel marks (tashkeel).`,
          `  The speakers often talk in a DIALECT, very often EGYPTIAN ARABIC (عامية مصرية). First recognise the dialect,`,
          `  then write the dialect words EXACTLY as they are said in that dialect — NEVER turn them into standard Arabic (فصحى):`,
          `  Egyptian examples: عايز / عايزة (not أريد)، دلوقتي (not الآن)، مش (not ليس)، إزاي (not كيف)، كده، ليه، فين، إيه،`,
          `  بتاع، أوي، خلاص، يعني، بقى، هو ده، احنا، انتو، هما، بيقول، هيروح، مفيش، معلش — keep b- / h- verb prefixes as said (بيشتغل، هنروح).`,
          `  For letters pronounced the Egyptian way, keep the normal spelling of the word: ق said like a hamza stays ق (قال، قلبي),`,
          `  ج said like "g" stays ج (جميل), ث said like ت/س is written as said in the dialect word (تلاتة، كتير).`,
          `  Standard Arabic said by the speaker stays standard Arabic. Do not mix dialects: write each word as the speaker said it.`
        ].join("\n"),
        numbers: `as pronounced in the speaker's dialect, e.g. Egyptian "تلاتة وعشرين", "ألفين ستة وعشرين", "خمسين في المية", "الساعة تلاتة ونص" — never "23", "2026", "50%", never Arabic-Indic digits like "٢٣"`,
        mistakes: `keep the words, endings and grammar exactly as said (dialect grammar included), do not correct them into standard Arabic`,
        punct: `use the Arabic comma "،" where the speaker pauses, ALWAYS end with a period (.), "؟" only for a real question` },
  fr: { code: "fr-FR", name: "French", native: "français",
        line: "Cette tâche est en français : transcris en français, mot à mot, exactement comme c'est dit, sans traduire.",
        script: `Write it in normal French spelling (with accents).`,
        numbers: `"vingt-trois", "deux mille vingt-six", "quinze heures trente", "cinquante pour cent" — never "23", "2026", "15h30", "50%"`,
        mistakes: `e.g. "j'ai allé" stays "j'ai allé", "les visite de parc" stays as said`,
        punct: `use commas (,) where the speaker pauses, ALWAYS end with a period (.), "?" only for a real question` },
  en: { code: "en-US", name: "English", native: "English",
        line: "This task is in English: transcribe in English, word for word, exactly as it is said, without translating.",
        script: `Write it in normal English spelling.`,
        numbers: `"twenty-three", "two thousand twenty-six", "fifty percent" — never "23", "2026", "50%"`,
        mistakes: `e.g. "he don't know" stays "he don't know"`,
        punct: `use commas (,) where the speaker pauses, ALWAYS end with a period (.), "?" only for a real question` }
};
export const TASK_LANGS = { ar: TASK_LANGS_ALL.ar };

export function transcriptionRules(language) {
  const L = TASK_LANGS[language] || null;
  const langRules = L ? [
    `- LANGUAGE OF THIS TASK: ${L.name.toUpperCase()} (${L.native}). The audios are in ${L.name}: transcribe them in ${L.name}.`,
    `  ${L.script}`,
    `  Never translate. If the speaker says some words in another language, write those words as they are said`,
    `  (in their own language) and use [code_switch] per the guideline.`,
    `  In "language" write ${language === "ar" ? `the Arabic you heard: "ar-EG" for Egyptian, "ar-MA" Moroccan, "ar-SA" Gulf, "ar-LB" Levantine, "ar" standard Arabic` : `"${L.code}"`}.`
  ] : [
    `- LANGUAGE: listen and transcribe in the language that is REALLY spoken in the audio, whatever it is`,
    `  (Arabic, French, English…). Never translate it, never transliterate it into Latin letters.`,
    `  Arabic (standard Arabic or a dialect such as Darija) is written in ARABIC SCRIPT, exactly as pronounced,`,
    `  with the dialect words as they are said (do not turn a dialect into standard Arabic, do not add vowel marks).`,
    `  In "language" give the language you heard (e.g. "ar-EG", "ar", "fr-FR", "en-US").`
  ];
  return [
    `TRANSCRIPTION RULES (always apply them):`,
    ...langRules,
    `- Transcribe exactly what is said, word for word.`,
    `- The audio is exactly ONE segment of a call. If speech at the very start or the very end of the audio`,
    `  is CUT OFF (a word or sentence that continues outside the clip), do NOT write that cut-off part:`,
    `  transcribe only the complete speech of this segment, never what belongs to the segment before or after.`,
    `- VERBATIM: write what you HEAR, not what the speaker should have said.`,
    `  · Keep the speaker's grammar, conjugation, agreement and vocabulary mistakes exactly as spoken`,
    `    (${L ? L.mistakes : `e.g. French "j'ai allé" stays "j'ai allé"; Arabic: keep the words and endings as said, do not correct them`}).`,
    `  · Keep repetitions, false starts, hesitations, self-corrections and unfinished words as heard.`,
    `  · HESITATION FILLERS are speech, not vocal tags: when the speaker says a filler like "آآ", "إمم", "ممم", "اممم", "إيه", "يعني" as a thinking sound, write it in Arabic letters exactly as heard (e.g. آآ, إمم, ممم). Do not drop it, do not tag it, do not turn it into a word.`,
    `  · Do not reorder words, do not add missing words, do not remove words, do not improve the style.`,
    `  · Only fix spelling of a word that was clearly pronounced correctly; never change which word was said.`,
    `- NUMBERS: never write digits. Write every number in words, in the language spoken`,
    ...(L ? [`  (${L.numbers}). Write them exactly as they were said.`] : [
    `  (French: "vingt-trois", "deux mille vingt-six"; Arabic: "ثلاثة وعشرين", "ألفين وستة وعشرين", "خمسين في المية";`,
    `  never "23", "2026", "50%", never Arabic digits like "٢٣"). Write them exactly as they were said, in the same dialect.`]),
    `- Do not translate, summarise, correct the speaker, or answer the content.`,
    ...(L ? [`- PUNCTUATION: ${L.punct}.`] : [
    `- PUNCTUATION: use commas inside the sentence where the speaker pauses or between clauses`,
    `  (in Arabic the Arabic comma "،"), and ALWAYS end the transcription with a period (.) — "?" (Arabic "؟") only for a real question.`]),
    `  Punctuation never changes, adds or removes any word.`,
    `- VOCAL TAGS: put a tag in square brackets at the exact place of the sound, only these tags:`,
    ...Object.entries(TAGS).map(([k, v]) => `  · [${k}] — ${v}`),
    `  · Tell apart SPEECH and NON-SPEECH human sounds:`,
    `    - a human sound that is not words (laughing, coughing, sighing, clearing the throat, sneezing, crying…)`,
    `      gets ITS OWN tag at its exact place: [laugh], [cough], [sigh], [throat_clear], [sneeze], [cry]…`,
    `      Never write it as [unintelligible] and never write it as words ("haha", "hum", "euh" for a laugh or a cough).`,
    `    - [unintelligible] is ONLY for real words that are heard but cannot be understood.`,
    `    - laughing while speaking: write the words, and put [laugh] where the laugh is heard.`,
    `  · Use a tag only when the sound is clearly audible.`,
    ...(language === "ar" ? [
    `  · ARABIC TASK — COMPLETE COVERAGE: listen to the whole audio carefully and tag EVERY non-speech human sound that is audible (laugh, cry, cough, throat_clear, sigh, sneeze, hiccup, burp, gasp, breath, gag, melodic_vocalization, yell, cheer, other_vocalization), each at its exact place. Do not skip a clear sound.`,
    `    Only skip a sound if you truly cannot tell what it is; never invent a sound that is not there.`,
    `    [unintelligible] and [code_switch] only for real cases: words heard but not understood, or a real switch to another language.`] : []),
    `  · [breath] only for a clearly audible inhale; normal breathing that is not clearly audible is not tagged.`,
    `  · [unintelligible] for speech that is heard but cannot be understood — not for technical cuts.`,
    `  · [code_switch] when the speaker switches to another language, per the guideline.`,
    `  · Microphone noise, background noise and interference are NOT vocal tags.`,
    `  · Obsolete tags, never use them: [heavy_breathing], [boo].`,
    `- QUIET SPEECH — PRECISION: some speakers are very quiet, far from the microphone or whispering. Listen to the audio carefully, as many times as needed, and write EVERY audible word, even if it is faint or low in volume. Never skip, shorten or summarise a quiet part, and never leave out words just because they are hard to hear. Keep the exact words as spoken, in order, with nothing added.`,
    `  · Only when a part is truly impossible to understand after careful listening, mark just that part with [unintelligible], following the Poliwag guidelines. A faint word you can still make out must be written, not tagged.`,
    `  · If you are unsure of a faint word, write your best hearing and put it in "uncertain_words".`,
    `  · Listen to the SOUNDS, not to what would be likely: do not replace a faint word by a different common word that sounds a little like it, and do not complete a sentence from guesswork. The speech is natural Egyptian Arabic: use the context of the whole sentence to choose between words that sound close, but only write what is really said.`,
    `  · Listen to the audio a second time before answering, and check that every word you wrote is really in the audio.`,
    `- GOVERNING RULE: the most important thing is a CORRECT transcription of the speech, exactly as heard, following the Poliwag transcription guidelines. When anything in this prompt seems to conflict with the guidelines or with what is really heard, the guidelines and the audio win.`,
    `- EXACT PRONUNCIATION: write each word exactly as it is PRONOUNCED in the audio, letter by letter, in the speaker's own dialect. Do not normalize or correct it to standard Arabic spelling or to the "expected" word. If the speaker says a word with a "ج" sound (for example "دجايج" for "دقايق"), write it with ج; if a letter is pronounced differently from its standard form (ق as ج, ق as ء, ث as ت or س, ذ as د or ز, ظ as ز…), write the letter that is really heard. Never replace a heard word by a more common or "more correct" word.`,
    `- Put any word you are not sure about in "uncertain_words".`
  ];
}

export function buildPreparationPrompt(taskId, language) {
  return [
    `You are the transcription engine for Poliwag task ${taskId}.`,
    ...(TASK_LANGS[language] ? [`TASK LANGUAGE: ${TASK_LANGS[language].name} — ${TASK_LANGS[language].line}`] : []),
    `Read these instructions once and apply them to EVERY message of this conversation.`,
    ``,
    `HOW THE AUDIOS ARRIVE:`,
    `- From now on I will send you audio files, one per message, WITHOUT any text.`,
    `- Each file is one segment and is named poliwag_seg_<N>.wav (N = the segment number, e.g. poliwag_seg_12.wav).`,
    `- Every time a message contains an audio file: listen to it, transcribe it with the rules below,`,
    `  and reply with the JSON only. Do not ask questions, do not comment, do not wait for instructions.`,
    `- "audio_id" is "SEG_" + N on three digits, taken from the file name (poliwag_seg_12.wav -> "SEG_012").`,
    `- EVERY message I send you contains an audio file. NEVER answer that no audio file or voice input`,
    `  was provided, and never copy a note from an earlier answer: always listen and transcribe what you hear.`,
    `- Always take "audio_id" from the file name of THIS message (never "AUDIO_…").`,
    `- LISTEN to each audio file directly with your own audio understanding (like a voice message).`,
    `  NEVER open it with Python, code or data-analysis tools: they cannot hear speech.`,
    ``,
    ...transcriptionRules(language),
    ``,
    `REPLY FORMAT — ONLY one JSON code block, nothing else, in exactly this shape:`,
    "```json",
    JSON.stringify({
      type: "transcription_result", status: "completed", task_id: taskId, audio_id: "SEG_012",
      language: TASK_LANGS[language]?.code || "<language heard, e.g. ar-EG>", transcription: "…", uncertain_words: [], notes: []
    }, null, 2),
    "```",
    `If a part of the audio is not understandable, write [unintelligible] at that place and keep "status": "completed".`,
    ``,
    `Now reply with ONLY this JSON code block to confirm you are ready:`,
    "```json",
    JSON.stringify({ type: "status", status: "READY", task_id: taskId }),
    "```"
  ].join("\n");
}

// One Poliwag segment sent as an attached .wav file (button Send in the bar).
export function buildSegmentPrompt(taskId, n, fileName, language) {
  const id = "SEG_" + String(n).padStart(3, "0");
  return [
    `Poliwag task ${taskId} — segment #${n}. The attached audio file "${fileName}" is this segment only.`,
    `Listen to the attached audio and transcribe it.`,
    ``,
    ...transcriptionRules(language),
    ``,
    `Reply with ONLY one JSON code block, nothing else, in exactly this shape:`,
    "```json",
    JSON.stringify({
      type: "transcription_result", status: "completed", task_id: taskId, audio_id: id,
      language: language || "…", transcription: "…", uncertain_words: [], notes: []
    }, null, 2),
    "```",
    `If the audio is not clear, use "status": "incomplete" and explain in "notes".`
  ].join("\n");
}

export function buildFilterPrompt(task, subjects, audios) {
  const transcripts = audios.map((a) => `### Audio #${a.n}\n${a.text}`).join("\n\n");
  return [
    `POLIWAG – TOPICS VERIFICATION for task ${task.id}.`,
    `Below are the subjects (topics) listed in Maven with their note, and ALL the transcripts of this task.`,
    `Compare every subject with the WHOLE recording (all the audios), not with one sentence.`,
    ``,
    `For EACH subject give one decision:`,
    `- "keep": the topic is really talked about in the recording, even if only once, and its note describes the content correctly.`,
    `- "edit": the topic is really talked about, but its description / note does not reflect the content accurately`,
    `  (empty, wrong, too vague, or invents something). Then write the corrected note IN ENGLISH in "corrected_annotation".`,
    `  Write it like a normal person typing quickly: simple, plain English, short (one short sentence),`,
    `  everyday words, no fancy or formal words, no AI-style phrases (no "delve", "various", "highlights",`,
    `  "discusses", "explores", "in conclusion"), no lists, no quotes. Example: "they talk about a trip to the beach with friends".`,
    `- "remove": nobody talks about this topic anywhere in the recording, or it repeats another subject of the list`,
    `  (then put the other subject's name in "duplicate_of").`,
    `Important:`,
    `- Do NOT remove a subject only because it is mentioned few times.`,
    `- Do NOT keep a subject only because it is close to another topic.`,
    `- The only criterion: is it really talked about in the recording or not.`,
    `- Use the subject names exactly as written. Do not add new subjects.`,
    `- Give one short evidence with the audio number for every "keep" / "edit".`,
    `- The final list (after removals) must have between three and nine subjects, without duplicates:`,
    `  say in "list_comment" if this is not the case.`,
    ``,
    `## Subjects (with their current note)`,
    subjects.map((s, i) => `${i + 1}. ${s.name}\n   Note: ${s.annotation ? "«" + s.annotation + "»" : "(empty)"}`).join("\n"),
    ``,
    `## Transcripts`,
    transcripts,
    ``,
    `Reply with ONLY one JSON code block in exactly this shape:`,
    "```json",
    JSON.stringify({
      type: "subject_filter", status: "completed", task_id: task.id,
      subjects: [{ name: "<subject name>", decision: "keep", evidence: "Audio #0: …", corrected_annotation: "", duplicate_of: "" }],
      list_comment: ""
    }, null, 2),
    "```"
  ].join("\n");
}

export function normName(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
}

/** One result per Maven subject; anything ChatGPT invents is ignored. */
export function mergeFilter(subjects, value) {
  const map = new Map((value?.subjects || []).map((s) => [normName(s.name), s]));
  return subjects.map((s) => {
    const r = map.get(normName(s.name));
    return {
      name: s.name, mentioned: r ? r.mentioned : null, evidence: r ? r.evidence : "",
      decision: r ? r.decision : null,
      correctedAnnotation: r ? r.correctedAnnotation || "" : "",
      duplicateOf: r ? r.duplicateOf || "" : "",
      annotation: s.annotation || "",
      annotationOk: r && r.annotationOk !== undefined ? r.annotationOk : null,
      annotationComment: r ? r.annotationComment || "" : ""
    };
  });
    }

