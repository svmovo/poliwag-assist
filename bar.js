// By svmovo (github.com/svmovo) - Redwood Assist
// Redwood Assist v7 — floating top bar on the Poliwag (Maven) page.
//
// What it touches on the page:
//   • it adds ONE element (the bar, isolated in a Shadow DOM) floating above the page;
//   • Search only READS a segment (and scrolls to it) — no colour, no marker is added;
//   • Remplace writes into ONE segment text box, and only when you click it.
// It never touches times, speakers, sentiment, language, Split / Merge / Delete / PII, Subjects or Submit.

(() => {
  if (window.top !== window) return;
  if (window.__poliwagBarV7) return;
  window.__poliwagBarV7 = true;

  // ------------------------------------------------------------------ constants

  // ------------------------------------------------------------------ languages (AR / EN / FR)

  const AI_NAMES = { chatgpt: "ChatGPT", gemini: "Gemini" };

  const TAGS = ["laugh", "cry", "cough", "throat_clear", "sigh", "sneeze", "hiccup", "burp", "gasp", "breath", "gag",
    "melodic_vocalization", "yell", "cheer", "bool", "other_vocalization", "unintelligible", "code_switch"];
  const OBSOLETE = ["heavy_breathing", "boo"];

  const I18N = {
    ar: {
      dir: "rtl",
      tags: {
        laugh: "الضحك", cry: "البكاء", cough: "السعال", throat_clear: "تنحنح / تصفية الحلق", sigh: "تنهيدة",
        sneeze: "العطس", hiccup: "الفواق / الحازوقة", burp: "التجشؤ", gasp: "شهقة مفاجئة", breath: "صوت الشهيق المسموع",
        gag: "صوت التهوع", melodic_vocalization: "إصدار أصوات بنغمة أو لحن", yell: "الصراخ", cheer: "الهتاف / التشجيع",
        bool: "صوت بشري غير كلامي حسب تصنيف الدليل", other_vocalization: "صوت بشري آخر غير مصنف أعلاه",
        unintelligible: "كلام مسموع ولكن غير مفهوم", code_switch: "تغيير اللغة داخل الكلام"
      },
      rules: [
        "استخدم Tag بس لو الصوت مسموع بوضوح.",
        "[breath] للشهيق المسموع بوضوح.",
        "[sigh] للتنهيدة.",
        "[unintelligible] للكلام غير المفهوم، مش للتقطيع التقني.",
        "[code_switch] عند الانتقال للغة أخرى، حسب قواعد الدليل.",
        "ضجيج الميكروفون والتشويش مش بيتكتبوا كـ Vocal Tags.",
        "التنفس العادي اللي مش مسموع بوضوح مش بيتسجل."
      ],
      pwEdited: "⚠ اتعدّل — مش اتسجل في Maven لحد ما تدوس احتفاظ", pwLose: "تعديلات #{n} لسه ما اتسجلتش في Maven. تسيبها وتكمل؟",
      subjCorr: "تصحيح", subjNoCorr: "مفيش تصحيح", subjCorrFail: "ما اتكتبش التصحيح في {name}", subjCorrDone: "✓ اتصحح وصف {name}", subjDup: "مكرر مع {name}", subjRange: "{n} subjects (لازم من 3 لـ 9)",
      subjDelete: "مسح", subjDeleteTitle: "مسح {name} من Maven", subjNotOnPage: "مش لاقي {name} في الصفحة.", subjStill: "{name} لسه في الصفحة — ممكن Maven بيطلب تأكيد.", subjDeleted: "{name} اتمسح من Maven.",
      play: "تشغيل التفريغ", pause: "إيقاف",
      timeLbl: "الوقت", speedLbl: "السرعة", timeBtn: "ضبط", timeWorking: "بحلل الصوت…", timeNoAudio: "مش لاقي ملف الصوت في الصفحة دي.", audioExpired: "رابط الصوت خلص (403) — اعمل تحديث للصفحة (F5)", timeShort: "الملف اللي لقيته أقصر من الـ segment (مش ملف المكالمة كلها) — اعمل تحديث للصفحة (F5) وجرب تاني", timeBad: "بداية ونهاية التفريغ ده مش صح.", timeNoSpeech: "مش لاقي كلام واضح في التفريغ ده.", timeSame: "✓ الوقت مضبوط بالفعل", timeFail: "الصفحة ما قبلتش الأوقات.", timeDone: "✓ اتضبط (قبل: {s} ← {e})", timeErr: "ما قدرتش أقرا الصوت: ", timeUndo: "رجّع الوقت الأصلي", timeUndoTip: "رجّع الوقت الأصلي: {s} ← {e}", timeRestored: "↶ الوقت الأصلي اترجع: {s} ← {e}", timeManual: "✓ اتغيّر بإيدك: {s} ← {e}", sendNoTask: "مفيش Task — دوس على + الأول", autoTip: "غير مستخدم", autoStopTip: "غير مستخدم", gptWarnTitle: "Gemini هو الأحسن للتفريغ الصوتي", gptWarnText: "من التجربة، Gemini هو الأحسن في التفريغ الصوتي: بيسمع ملف الصوت مباشرة، وChatGPT بيفتحه بـ Python وبيرجّع تفريغ فاضي أو غلط.\nلو عايز تكمّل بـ ChatGPT، ده اختيارك وإنت المسؤول عنه.", gptGo: "كمّل بـ ChatGPT", gptBack: "ارجع لـ Gemini", sendLbl: "إرسال", aiError: "صفحة Gemini عرضت رسالة: ", nudgeAi: "لسه ما جاش رد Gemini — هفتح صفحته لحظة وأرجع (ده مش خطأ)…", playBlocked: "الصوت ما اشتغلش (يمكن الصفحة في الخلفية؟)", subjTitle: "المواضيع", tasksTitle: "Tasks", dlTitle: "تحميل الـ .wav بتاع الـ segment", nothingCopy: "مفيش حاجة تتنسخ.", dupIgnored: "⚠ اتبعت قبل كده — تجاهلت النسخة المكررة، #{n} هو اللي فضل",  autoStopping: "بيقف…", autoAt: "Auto — segment #{n}…", autoNoReply: "الرد ما جاش في الوقت المناسب", autoEmpty: "رد #{n} فاضي", autoResend: "#{n}: Gemini ما استلمش الصوت كويس — هبعته تاني…", autoIncomplete: "#{n}: Gemini رد incomplete مرتين — ", autoDone: "✓ خلص — آخر segment #{n}", autoCountdown: "🔔 استبدال #{n} بعد {s}", autoFail: "وقف عند #{n}: ", sendWorking: "باعت الصوت بتاع #{n}…", sendLoading: "#{n}: الملف بيتحمّل في Gemini — هيتبعت أول ما يخلص التحميل…", sendDone: "✓ #{n} اتبعت — مستني رد JSON", sendFail: "ما اتبعتش: ", bandAuto: "فلتر auto", bandManual: "فلتر", bandSet: "✓ الفلتر اتغيّر — زر الضبط هيستخدمه", bandReset: "الفلتر رجع auto",
      sentiment: "الإحساس", sentPos: "إيجابي", sentNeu: "محايد", sentNeg: "سلبي", sentPending: "⚠ مش اتسجل لحد ما تدوس احتفاظ أو استبدال", sentFail: "ما قدرتش أكتب الـ Sentiment في التفريغ ده.",
      noAnnot: "(مفيش حاجة مكتوبة)",
      annotCheck: "راجع الـ annotation", waitNext: "مستني تفريغ جديد من {ai}…", latest: "آخر تفريغ من {ai}",
      next: "التالي", replace: "استبدال", keep: "احتفاظ", previous: "↶ السابق", search: "بحث", tagsBtn: "Tags ▾",
      transAi: "تفريغ {ai}", transPw: "تفريغ Poliwag", subjects: "Subjects", filter: "فلترة", rereadPage: "↻ اقرا الصفحة تاني",
      newTask: "Task جديدة", collapse: "تصغير", lang: "اللغة", pickAi: "اختار الأداة",
      vocalTags: "Vocal Tags", rulesTitle: "قواعد مهمة", obsoleteTitle: "Tags قديمة — ما تستخدمهاش",
      noTask: "مفيش Task — دوس +", noTaskShort: "مفيش TASK",
      st_ready: "READY", st_prompt_sent: "WAITING", st_opening: "OPENING", st_analysing: "FILTRE…", st_manual: "MANUAL", st_disconnected: "OFFLINE",
      pillManual: "دوس عشان تنسخ البرومبت", pillOffline: "دوس عشان تلاقي تاب {ai}",
      summary: "{n} أوديو محفوظ · أوتوماتيك", dupSummary: " · {n} مكرر محتاج مراجعة",
      typeNumber: "اكتب رقم ودوس بحث.", empty: "(فاضي)",
      segNotFound: "التفريغ #{n} مش موجود — لقيت {k} تفريغ في الصفحة (الترقيم بيبدأ من 0).",
      noSegs: "مش لاقي أي تفريغ في الصفحة دي. افتح محرر التفريغ وابحث تاني.",
      verb_replaced: "اتبدّل", verb_kept: "اتسابت", verb_restored: "اترجع (السابق)",
      already: "↺ اتعمل قبل كده · {verb} الساعة {time}", mapNote: "{ai} #{k} → Poliwag #{n}", noJsonK: "مفيش JSON من {ai} #{k}",
      reread: "↻ اقرا {ai} تاني · لقيت #{k}", notYet: "لسه ما جاش JSON بتاع #{k}", reading: "↻ بقرا {ai}…",
      dupLike: "⚠ شبه تفريغ سابق — مكرر؟", same: "✓ زي المكتوب", diff: "⚠ مختلف عن المكتوب", found: "لقيت #{n}",
      subjMeta: "{n} اتقرت من Maven", subjChecked: " · اتراجعت مع {n} أوديو", subjWaiting: " · {ai} بيراجع…", subjError: " · خطأ: ",
      subjNone: "ما قريتش أي Subject — افتح صفحة الـ Subjects ودوس ↻.", toDelete: "لازم يتمسح",
      cntKeep: "{n} متذكّر", cntDel: "{n} لازم يتمسحوا",
      e_noTask: "مفيش Task. دوس + عشان تبدأ.", e_noNum: "اكتب رقم التفريغ ودوس بحث.",
      e_emptyAi: "تفريغ {ai} فاضي — مفيش حاجة تتكتب.", e_segNF: "التفريغ #{n} مش موجود في الصفحة.",
      e_pageRefused: "الصفحة ما قبلتش النص. ما اتسجلش حاجة.", e_histFail: "النص اتكتب في الصفحة لكن السجل ما اتحفظش: ",
      ok_replaced: "#{n} اتبدّل في Poliwag — دوس التالي", ok_kept: "#{n} اتساب زي ما هو — دوس التالي",
      ok_last: "#{n} خلص — ده آخر تفريغ في الصفحة.", e_noUndo: "مفيش تعديل يترجع.",
      ok_undo: "#{n}: النص القديم اترجع في Poliwag.", err: "خطأ.",
      confirmNew: "تبدأ Task جديدة؟\n{id} هتفضل محفوظة في السجل.",
      opening: "Task جديدة — بفتح {ai}…", clickManual: "\nدوس على MANUAL عشان تنسخ البرومبت.",
      tasksTitle: "Tasks ({n})", noTasks: "مفيش Task — دوس + عشان تبدأ.",
      taskSub: "{date} {time} · {a} أوديو · {d} اتعملوا", current: " · الحالية", load: "فتح", del: "مسح",
      loaded: "{id} اتفتحت.", confirmDel: "تمسح {id} مع سجلها؟\nما فيش رجوع.", deleted: "{id} اتمسحت.",
      tagHint: "[{tag}] متحدد — دوس في النص عشان تدخله",
      noSubjPage: "مفيش أي Subject في الصفحة دي.", subjRead: "{n} Subjects اتقرت.",
      filterSent: "برومبت الفلترة اتبعت لـ {ai}…", promptCopied: "البرومبت اتنسخ — الصقه في {ai}.", copyFail: "ما قدرتش أنسخ.",
      reconnected: "لقيت محادثة {ai}.", notFound: "ما لقيتهاش.",
      helperOff: "برنامج الصوت مش متثبت (native-host\\install.bat)", notDetected: "مش موجود", audioFail: "ما قدرتش أبدّل الصوت.",
      dupSaved: "⚠ تفريغ جديد شبه واحد سابق — راجعه", newSaved: "✓ تفريغ جديد من {ai} — اتحط في الخانة",
      newWhileEditing: "✓ أوديو #{n} اتسجل (إنت بتعدّل #{c} — اكتب {n} ودوس بحث)",
      invalid: "JSON من {ai} مرفوض:\n", filterReady: "الفلترة جاهزة — افتح أيقونة الـ Subjects.",
      chatNoTitle: "غيّر الرقم ده لو المزامنة مع Poliwag مش مظبوطة", undoTitle: "رجّع آخر كلمة غيّرتها أو مسحتها (Ctrl+Z)"
    },
    en: {
      dir: "ltr",
      tags: {
        laugh: "Laughter", cry: "Crying", cough: "Cough", throat_clear: "Throat clearing", sigh: "Sigh",
        sneeze: "Sneeze", hiccup: "Hiccup", burp: "Burp", gasp: "Sudden gasp", breath: "Audible inhale",
        gag: "Gagging sound", melodic_vocalization: "Humming / melodic sounds", yell: "Yelling", cheer: "Cheering",
        bool: "Non-speech human sound (per guideline)", other_vocalization: "Other human sound not listed above",
        unintelligible: "Audible but not understandable speech", code_switch: "Switch to another language"
      },
      rules: [
        "Use a tag only when the sound is clearly audible.",
        "[breath] for a clearly audible inhale.",
        "[sigh] for a sigh.",
        "[unintelligible] for speech that can't be understood — not for technical cuts.",
        "[code_switch] when switching to another language, per the guideline.",
        "Microphone noise and interference are not Vocal Tags.",
        "Normal breathing that isn't clearly audible is not tagged."
      ],
      pwEdited: "⚠ edited — not saved to Maven until you press Keep", pwLose: "Your edits on #{n} are not saved to Maven. Leave them?",
      subjCorr: "Correction", subjNoCorr: "No correction given", subjCorrFail: "Could not write the correction for {name}", subjCorrDone: "✓ Note of {name} corrected", subjDup: "duplicate of {name}", subjRange: "{n} subjects (must be 3 to 9)",
      subjDelete: "Delete", subjDeleteTitle: "Remove {name} in Maven", subjNotOnPage: "{name} is not on the page.", subjStill: "{name} is still on the page — Maven may be asking for a confirmation.", subjDeleted: "{name} removed in Maven.",
      play: "Play this segment", pause: "Pause",
      timeLbl: "Time", speedLbl: "Speed", timeBtn: "Tighten", timeWorking: "analysing the audio…", timeNoAudio: "No audio file found on this page.", audioExpired: "The audio link has expired (403) — reload the page (F5)", timeShort: "The audio file found on the page is shorter than this segment (not the full call) — reload the page (F5) and try again", timeBad: "This segment's start / end are not valid.", timeNoSpeech: "No clear speech found in this segment.", timeSame: "✓ times already tight", timeFail: "The page did not accept the times.", timeDone: "✓ tightened (before: {s} → {e})", timeErr: "Could not read the audio: ", timeUndo: "Back to the original times", timeUndoTip: "Back to the original times: {s} → {e}", timeRestored: "↶ original times restored: {s} → {e}", timeManual: "✓ set by hand: {s} → {e}", sendNoTask: "No task — click + first", autoTip: "Auto: every segment, one after the other, to the last", autoStopTip: "Click to stop Auto", gptWarnTitle: "Gemini is the best for audio transcription", gptWarnText: "Our tests showed that Gemini is the best for audio transcription: it listens to the audio files directly, while ChatGPT opens them with Python and returns empty or wrong transcriptions.\nIf you want to continue with ChatGPT, it is your choice and your responsibility.", gptGo: "Continue", gptBack: "Back to Gemini",  sendLbl: "Send", aiError: "The AI page shows a message: ", nudgeAi: "No Gemini answer yet — opening its page for a moment and coming back (not an error)…", playBlocked: "Playback did not start (page in the background?) — Auto goes on", subjTitle: "Subjects", tasksTitle: "Tasks", dlTitle: "Download the segment .wav", nothingCopy: "Nothing to copy.", dupIgnored: "⚠ already sent — duplicate ignored, #{n} kept",  autoStopping: "Stopping…", autoAt: "Auto — segment #{n}…", autoNoReply: "no reply in time", autoEmpty: "the reply for #{n} is empty", autoResend: "#{n}: the AI did not get the audio — sending it again…", autoIncomplete: "#{n}: the AI answered incomplete twice — ", autoDone: "✓ Auto finished — last segment #{n}", autoCountdown: "🔔 Replace #{n} in {s}s — click Auto to stop", autoFail: "Auto stopped at #{n}: ", sendWorking: "Sending the audio of #{n}…", sendLoading: "#{n}: loading in the AI page — Send once it is open and nothing is loading…", sendDone: "✓ #{n} sent — waiting for the JSON", sendFail: "Not sent: ", bandAuto: "filter auto", bandManual: "filter", bandSet: "✓ filter set — Tighten will use it", bandReset: "filter back to auto",
      sentiment: "Sentiment", sentPos: "Positive", sentNeu: "Neutral", sentNeg: "Negative", sentPending: "⚠ saved on Keep or Replace", sentFail: "Could not set the sentiment on this segment.",
      noAnnot: "(nothing written)",
      annotCheck: "check annotation", waitNext: "waiting for the next {ai} transcription…", latest: "latest from {ai}",
      next: "Next", replace: "Replace", keep: "Keep", previous: "↶ Previous", search: "Search", tagsBtn: "Tags ▾",
      transAi: "{ai} trans", transPw: "Poliwag trans", subjects: "Subjects", filter: "Filter", rereadPage: "↻ Re-read page",
      newTask: "New task", collapse: "Collapse", lang: "Language", pickAi: "Choose the tool",
      vocalTags: "Vocal Tags", rulesTitle: "Important Rules", obsoleteTitle: "Obsolete Tags — Do Not Use",
      noTask: "No task — click +", noTaskShort: "NO TASK",
      st_ready: "READY", st_prompt_sent: "WAITING", st_opening: "OPENING", st_analysing: "FILTERING…", st_manual: "MANUAL", st_disconnected: "OFFLINE",
      pillManual: "Click to copy the prompt", pillOffline: "Click to find the {ai} tab",
      summary: "{n} audios saved · auto", dupSummary: " · {n} possible duplicates",
      typeNumber: "Type a number, then Search.", empty: "(empty)",
      segNotFound: "Segment #{n} not found — {k} segments on the page (numbers start at 0).",
      noSegs: "No segment found on this page. Open the transcription editor, then Search.",
      verb_replaced: "Replaced", verb_kept: "Kept", verb_restored: "Restored (Previous)",
      already: "↺ already done · {verb} at {time}", mapNote: "{ai} #{k} → Poliwag #{n}", noJsonK: "no {ai} JSON #{k}",
      reread: "↻ {ai} re-read · #{k} found", notYet: "no JSON for #{k} yet", reading: "↻ reading {ai}…",
      dupLike: "⚠ looks like an earlier transcription — duplicate?", same: "✓ matches what was written", diff: "⚠ differs from what was written", found: "#{n} found",
      subjMeta: "{n} read from Maven", subjChecked: " · checked against {n} audios", subjWaiting: " · {ai} checking…", subjError: " · error: ",
      subjNone: "No subject read — open the Subjects page, then ↻.", toDelete: "to remove",
      cntKeep: "{n} mentioned", cntDel: "{n} to remove",
      e_noTask: "No task. Click + to start.", e_noNum: "Type the segment number, then Search.",
      e_emptyAi: "{ai} trans is empty — nothing to write.", e_segNF: "Segment #{n} not found on the page.",
      e_pageRefused: "The page did not accept the text. Nothing was saved.", e_histFail: "Text written to the page, but history wasn't saved: ",
      ok_replaced: "#{n} replaced in Poliwag — press Next", ok_kept: "#{n} kept as is — press Next",
      ok_last: "#{n} done — that was the last segment on the page.", e_noUndo: "Nothing to undo.",
      ok_undo: "#{n}: previous text put back in Poliwag.", err: "Error.",
      confirmNew: "Start a new task?\n{id} stays saved in the history.",
      opening: "New task — opening {ai}…", clickManual: "\nClick the MANUAL badge to copy the prompt.",
      tasksTitle: "Tasks ({n})", noTasks: "No task yet — click + to start.",
      taskSub: "{date} {time} · {a} audios · {d} done", current: " · current", load: "Load", del: "Delete",
      loaded: "{id} loaded.", confirmDel: "Delete {id} and all its history?\nThis cannot be undone.", deleted: "{id} deleted.",
      tagHint: "[{tag}] selected — click in the text to insert it",
      noSubjPage: "No subject visible on this page.", subjRead: "{n} subjects read.",
      filterSent: "Filter prompt sent to {ai}…", promptCopied: "Prompt copied — paste it into {ai}.", copyFail: "Copy failed.",
      reconnected: "{ai} conversation found.", notFound: "Not found.",
      helperOff: "Audio helper not installed (native-host\\install.bat)", notDetected: "Not detected", audioFail: "Could not switch the audio output.",
      dupSaved: "⚠ New transcription looks like an earlier one — check it", newSaved: "✓ New {ai} transcription — placed in the box",
      newWhileEditing: "✓ Audio #{n} saved (you are editing #{c} — type {n}, then Search)",
      invalid: "{ai} JSON rejected:\n", filterReady: "Filter ready — open the Subjects icon.",
      chatNoTitle: "Change this number if it drifts out of sync with Poliwag", undoTitle: "Bring back the last word you changed or deleted (Ctrl+Z)"
    },
    fr: {
      dir: "ltr",
      tags: {
        laugh: "Rire", cry: "Pleurs", cough: "Toux", throat_clear: "Raclement de gorge", sigh: "Soupir",
        sneeze: "Éternuement", hiccup: "Hoquet", burp: "Rot", gasp: "Halètement soudain", breath: "Inspiration audible",
        gag: "Haut-le-cœur", melodic_vocalization: "Fredonnement / sons mélodiques", yell: "Cri", cheer: "Acclamation / encouragement",
        bool: "Son humain non verbal (selon le guide)", other_vocalization: "Autre son humain non listé ci-dessus",
        unintelligible: "Parole audible mais incompréhensible", code_switch: "Passage à une autre langue"
      },
      rules: [
        "N'utilisez un tag que si le son est clairement audible.",
        "[breath] pour une inspiration clairement audible.",
        "[sigh] pour un soupir.",
        "[unintelligible] pour une parole incompréhensible — pas pour une coupure technique.",
        "[code_switch] lors du passage à une autre langue, selon le guide.",
        "Le bruit et les parasites du micro ne sont pas des Vocal Tags.",
        "Une respiration normale pas clairement audible n'est pas notée."
      ],
      pwEdited: "⚠ modifié — pas enregistré dans Maven tant que vous n'appuyez pas sur Garder", pwLose: "Vos modifications du #{n} ne sont pas enregistrées dans Maven. Les abandonner ?",
      subjCorr: "Correction", subjNoCorr: "Pas de correction proposée", subjCorrFail: "Correction non écrite pour {name}", subjCorrDone: "✓ Note de {name} corrigée", subjDup: "doublon de {name}", subjRange: "{n} subjects (il en faut 3 à 9)",
      subjDelete: "Supprimer", subjDeleteTitle: "Supprimer {name} dans Maven", subjNotOnPage: "{name} introuvable dans la page.", subjStill: "{name} est toujours là — Maven demande peut-être une confirmation.", subjDeleted: "{name} supprimé dans Maven.",
      play: "Écouter ce segment", pause: "Pause",
      timeLbl: "Temps", speedLbl: "Vitesse", timeBtn: "Équilibrer", timeWorking: "analyse du son…", timeNoAudio: "Aucun fichier audio trouvé dans la page.", audioExpired: "Lien audio expiré (403) — rechargez la page (F5)", timeShort: "Le fichier audio trouvé est plus court que ce segment (ce n'est pas l'appel entier) — rechargez la page (F5) puis réessayez", timeBad: "Le start / end de ce segment n'est pas valide.", timeNoSpeech: "Pas de parole claire dans ce segment.", timeSame: "✓ temps déjà ajustés", timeFail: "La page n'a pas accepté les temps.", timeDone: "✓ ajusté (avant : {s} → {e})", timeErr: "Lecture du son impossible : ", timeUndo: "Revenir aux temps d'origine", timeUndoTip: "Revenir aux temps d'origine : {s} → {e}", timeRestored: "↶ temps d'origine remis : {s} → {e}", timeManual: "✓ réglé à la main : {s} → {e}", sendNoTask: "Pas de task — cliquez + d'abord", autoTip: "Auto : chaque segment, l'un après l'autre, jusqu'au dernier", autoStopTip: "Cliquez pour arrêter Auto", gptWarnTitle: "Gemini est le meilleur pour la transcription audio", gptWarnText: "Nos tests ont montré que Gemini est le meilleur pour la transcription audio : il écoute directement les fichiers son, alors que ChatGPT les ouvre avec Python et renvoie des transcriptions vides ou fausses.\nSi vous voulez continuer avec ChatGPT, c'est votre choix et votre responsabilité.", gptGo: "Continuer avec ChatGPT", gptBack: "Revenir à Gemini", sendLbl: "Envoyer", aiError: "La page IA affiche : ", nudgeAi: "Pas encore de réponse de Gemini — passage par sa page puis retour (pas une erreur)…", playBlocked: "La lecture n'a pas démarré (page en arrière-plan ?) — Auto continue", subjTitle: "Sujets", tasksTitle: "Tâches", dlTitle: "Télécharger le .wav du segment", nothingCopy: "Rien à copier.", dupIgnored: "⚠ déjà envoyé — doublon ignoré, #{n} gardé", autoStopping: "Arrêt en cours…", autoAt: "Auto — segment #{n}…", autoNoReply: "pas de réponse à temps", autoEmpty: "la réponse de #{n} est vide", autoResend: "#{n} : l'IA n'a pas reçu le son — nouvel envoi…", autoIncomplete: "#{n} : l'IA a répondu incomplete deux fois — ", autoDone: "✓ Auto terminé — dernier segment #{n}", autoCountdown: "🔔 Remplace #{n} dans {s} s — cliquez Auto pour arrêter", autoFail: "Auto arrêté à #{n} : ", sendWorking: "Envoi du son de #{n}…", sendLoading: "#{n} : chargement dans l'IA — envoi dès que Send est ouvert, sans chargement…", sendDone: "✓ #{n} envoyé — en attente du JSON", sendFail: "Non envoyé : ", bandAuto: "filtre auto", bandManual: "filtre", bandSet: "✓ filtre réglé — Équilibrer va l'utiliser", bandReset: "filtre revenu en auto",
      sentiment: "Sentiment", sentPos: "Positif", sentNeu: "Neutre", sentNeg: "Négatif", sentPending: "⚠ enregistré au Garder ou Remplace", sentFail: "Impossible de mettre le sentiment sur ce segment.",
      noAnnot: "(rien d'écrit)",
      annotCheck: "vérifier l'annotation", waitNext: "en attente du prochain JSON {ai}…", latest: "dernier JSON {ai}",
      next: "Suivant", replace: "Remplace", keep: "Garder", previous: "↶ Précédent", search: "Chercher", tagsBtn: "Tags ▾",
      transAi: "Trans {ai}", transPw: "Trans Poliwag", subjects: "Subjects", filter: "Filtres", rereadPage: "↻ Relire la page",
      newTask: "Nouvelle task", collapse: "Réduire", lang: "Langue", pickAi: "Choisir l'outil",
      vocalTags: "Vocal Tags", rulesTitle: "Règles importantes", obsoleteTitle: "Tags obsolètes — ne pas utiliser",
      noTask: "Pas de task — cliquez +", noTaskShort: "PAS DE TASK",
      st_ready: "READY", st_prompt_sent: "WAITING", st_opening: "OPENING", st_analysing: "FILTRES…", st_manual: "MANUAL", st_disconnected: "OFFLINE",
      pillManual: "Cliquer pour copier le prompt", pillOffline: "Cliquer pour retrouver l'onglet {ai}",
      summary: "{n} audios sauvegardés · auto", dupSummary: " · {n} doublons à vérifier",
      typeNumber: "Tapez un numéro puis Search.", empty: "(vide)",
      segNotFound: "Segment #{n} introuvable — {k} segments détectés (les numéros commencent à 0).",
      noSegs: "Aucun segment détecté dans cette page. Ouvrez l'éditeur de transcription puis Search.",
      verb_replaced: "Remplacé", verb_kept: "Gardé", verb_restored: "Restauré (Précédent)",
      already: "↺ déjà traité · {verb} à {time}", mapNote: "{ai} #{k} → Poliwag #{n}", noJsonK: "pas de JSON {ai} #{k}",
      reread: "↻ {ai} relu · #{k} trouvé", notYet: "pas encore de JSON pour #{k}", reading: "↻ lecture de {ai}…",
      dupLike: "⚠ ressemble à un JSON déjà reçu — doublon ?", same: "✓ identique à ce qui a été écrit", diff: "⚠ différent de ce qui a été écrit", found: "#{n} trouvé",
      subjMeta: "{n} lus depuis Maven", subjChecked: " · vérifiés contre {n} audios", subjWaiting: " · {ai} vérifie…", subjError: " · erreur : ",
      subjNone: "Aucun subject lu — ouvrez la page des Subjects puis ↻.", toDelete: "à supprimer",
      cntKeep: "{n} mentionnés", cntDel: "{n} à supprimer",
      e_noTask: "Pas de task. Cliquez + pour commencer.", e_noNum: "Tapez d'abord le numéro du segment puis Search.",
      e_emptyAi: "Trans {ai} est vide — rien à écrire.", e_segNF: "Segment #{n} introuvable dans la page.",
      e_pageRefused: "La page n'a pas accepté le texte. Rien n'a été enregistré.", e_histFail: "Texte écrit dans la page, mais l'historique n'a pas été sauvegardé : ",
      ok_replaced: "#{n} remplacé dans Poliwag — appuyez sur Suivant", ok_kept: "#{n} gardé — le texte original reste — appuyez sur Suivant",
      ok_last: "#{n} fait — c'était le dernier segment de la page.", e_noUndo: "Rien à annuler.",
      ok_undo: "#{n} : texte précédent remis dans Poliwag.", err: "Erreur.",
      confirmNew: "Commencer une nouvelle task ?\n{id} reste sauvegardée dans l'historique.",
      opening: "Nouvelle task — ouverture de {ai}…", clickManual: "\nCliquez sur la pastille MANUAL pour copier le prompt.",
      tasksTitle: "Tasks ({n})", noTasks: "Aucune task — cliquez + pour commencer.",
      taskSub: "{date} {time} · {a} audios · {d} traités", current: " · en cours", load: "Load", del: "Delete",
      loaded: "{id} chargée.", confirmDel: "Supprimer {id} et tout son historique ?\nCette action est définitive.", deleted: "{id} supprimée.",
      tagHint: "[{tag}] sélectionné — cliquez dans le texte pour l'insérer",
      noSubjPage: "Aucun subject visible dans cette page.", subjRead: "{n} subjects lus.",
      filterSent: "Prompt Filtres envoyé à {ai}…", promptCopied: "Prompt copié — collez-le dans {ai}.", copyFail: "Copie impossible.",
      reconnected: "Conversation {ai} retrouvée.", notFound: "Introuvable.",
      helperOff: "Helper audio non installé (native-host\\install.bat)", notDetected: "Non détecté", audioFail: "Impossible de changer la sortie son.",
      dupSaved: "⚠ Nouveau JSON qui ressemble à un précédent — vérifiez-le", newSaved: "✓ Nouveau JSON {ai} — placé dans la case",
      newWhileEditing: "✓ Audio #{n} sauvegardé (vous modifiez #{c} — tapez {n} puis Search)",
      invalid: "JSON de {ai} refusé :\n", filterReady: "Filtres prêts — ouvrez l'icône Subjects.",
      chatNoTitle: "Changez ce numéro si l'IA et Poliwag ne sont plus synchronisés", undoTitle: "Revenir au dernier mot modifié ou supprimé (Ctrl+Z)"
    }
  };

  let LANG = "ar";
  const L = () => I18N[LANG] || I18N.fr;
  function t_(key, vars = {}) {
    let s = L()[key] ?? I18N.fr[key] ?? key;
    if (typeof s !== "string") return s;
    return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : k === "ai" ? aiName() : "{" + k + "}"));
  }

  const ICON = {
    copy: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    swap: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h11"/><path d="m12 4 3 3-3 3"/><path d="M20 17H9"/><path d="m12 14-3 3 3 3"/></svg>',
    shield: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7z"/><path d="m9 12 2 2 4-4"/></svg>',
    headset: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-6h3z"/><path d="M3 19a2 2 0 0 0 2 2h1v-6H3z"/></svg>',
    speaker: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>',
    tag: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>',
    plus: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    up: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></svg>',
    search: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    filter: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h18l-7 8v6l-4-2v-4z"/></svg>',
    check: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>',
    globe: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z"/></svg>',
    x: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>'
  };

  const STYLE = `
:host{all:initial}
*{box-sizing:border-box}
.wrap{position:fixed;top:8px;left:12px;right:12px;z-index:2147483000;font:13px/1.45 "Segoe UI",Inter,system-ui,sans-serif;color:#E7E7EA}
.bar{background:rgba(24,24,27,.86);backdrop-filter:blur(10px) saturate(1.2);-webkit-backdrop-filter:blur(10px) saturate(1.2);border:1px solid #2A2A30;border-radius:14px;box-shadow:0 12px 32px rgba(0,0,0,.35),0 2px 6px rgba(0,0,0,.25);
  display:flex;flex-wrap:wrap;align-items:center;gap:10px 12px;padding:10px 14px}
.hidden{display:none!important}
.brand{display:flex;flex-direction:column;line-height:1.2;flex:none}
.brand b{font-size:13px}
.mono{font-family:Consolas,"JetBrains Mono",ui-monospace,monospace}
.brand .mono{font-size:11px;color:#A1A1AA}
.sep{width:1px;height:36px;background:#2A2A30;flex:none}
.status{display:flex;flex-direction:column;gap:3px;flex:none}
.status small{font-size:11px;color:#A1A1AA}
.pill{display:inline-flex;align-items:center;gap:6px;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:600;border:1px solid;white-space:nowrap}
button.pill{cursor:pointer;font-family:inherit}
.pill i{width:7px;height:7px;border-radius:50%;background:currentColor;display:inline-block}
.ok{background:#16291E;color:#6EE7A0;border-color:#1F4D33}
.wait{background:#2A2113;color:#FCD34D;border-color:#4A3A17}
.err{background:#2E1517;color:#FCA5A5;border-color:#5A2226}
.spacer{flex:1}
button{font-family:inherit}
.btn{height:38px;border-radius:9px;border:1px solid;padding:0 14px;font-weight:600;font-size:13px;display:inline-flex;align-items:center;gap:6px;flex:none;cursor:pointer;transition:filter .15s}
.btn:hover:not(:disabled){filter:brightness(1.12)}
.btn:disabled{opacity:.45;cursor:not-allowed}
.silver{background:#D4D4D8;border-color:#C0C0C8;color:#18181B}
.green{background:#15803D;border-color:#22A052;color:#fff}
.wine{background:#7A1C38;border-color:#9B2A4B;color:#fff}
.brown{background:#6B4226;border-color:#8A5A36;color:#fff}
.yellow{background:#EAB308;border-color:#FACC15;color:#18181B}
.seg2{display:flex;padding:3px;border-radius:999px;background:#1E1E22;border:1px solid #2A2A30;flex:none}
.seg2 button{height:30px;padding:0 11px;border-radius:999px;display:inline-flex;align-items:center;gap:5px;font-size:12px;color:#C4C4CC;border:1px solid transparent;background:transparent;cursor:pointer}
.seg2 button[aria-checked="true"]{background:#7A1C38;border-color:#9B2A4B;color:#fff;font-weight:600}
.seg2 button:disabled{opacity:.4;cursor:not-allowed}
.round{width:36px;height:36px;border-radius:50%;flex:none;display:inline-flex;align-items:center;justify-content:center;border:1px solid;cursor:pointer;position:relative;padding:0}
.r-wine{background:#7A1C38;border-color:#9B2A4B;color:#fff}
@keyframes pwBlink{0%,100%{box-shadow:0 0 0 0 rgba(242,179,196,.85);background:#7A1C38}50%{box-shadow:0 0 0 7px rgba(242,179,196,0);background:#B8325A}}
.round.blink{animation:pwBlink 1.1s ease-in-out infinite}
@keyframes pwBlinkB{0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,.75);filter:none}50%{box-shadow:0 0 0 6px rgba(255,255,255,0);filter:brightness(1.3)}}
.blinkb:not(:disabled){animation:pwBlinkB 1.1s ease-in-out infinite}
.bar.subjmode .trs,.bar.subjmode .wave{display:none!important}
.r-dark{background:#222226;border-color:#3A3A42;color:#D4D4D8}
.r-dark.on{background:#6B4226;border-color:#8A5A36;color:#fff}
.badge{position:absolute;top:-5px;right:-5px;min-width:18px;height:18px;padding:0 4px;border-radius:999px;background:#6B4226;border:1px solid #8A5A36;color:#fff;font-size:10px;font-weight:700;display:inline-flex;align-items:center;justify-content:center}
.trs{order:9;flex:1 1 100%;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:start}
.tr{min-width:0;display:flex;flex-direction:column;gap:5px}
.tr-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-height:26px}
.tr-head b{font-size:13px}
.meta{font-size:12px;color:#A1A1AA}
.num{font:700 12px Consolas,monospace;padding:1px 8px;border-radius:6px;background:#fff;color:#18181B}
.note{font-size:11px;font-weight:600;white-space:nowrap}
.note.green{color:#6EE7A0;background:none;border:0}
.note.muted{color:#A1A1AA}
.note.white{padding:2px 9px;border-radius:999px;background:#fff;color:#18181B}
.note.orange{padding:2px 9px;border-radius:999px;background:#2E1F0E;color:#FDBA74;border:1px solid #7C4A14}
.note.redish{color:#FDBA74}
.tagbtn{height:24px;padding:0 10px;border-radius:999px;border:1px solid #fff;background:#fff;color:#18181B;font-weight:700;font-size:11px;display:inline-flex;align-items:center;gap:5px;cursor:pointer}
.tagbtn.on{background:#F2B3C4;border-color:#F2B3C4}
.tagbtn:disabled{opacity:.4;cursor:not-allowed}
textarea.box{width:100%;min-height:36px;resize:none;overflow:hidden;background:#151517;border:1px solid #7A1C38;border-radius:8px;color:#E7E7EA;font:14px/1.45 "Segoe UI",Inter,system-ui,sans-serif;padding:6px 10px;outline:none;display:block}
textarea.box:focus{border-color:#B8325A}
textarea.box.armed{cursor:copy;border-color:#F2B3C4}
.box-pw{min-height:36px;white-space:pre-wrap;overflow-wrap:anywhere;background:#151517;border:1px solid #3A3A42;border-radius:8px;color:#C4C4CC;font-size:14px;line-height:1.45;padding:6px 10px}
.box-pw.empty{color:#71717A;font-style:italic}
.sentrow{display:flex;align-items:center;gap:10px;margin-top:6px;flex-wrap:nowrap}
.sentrow{gap:8px}
.sentrow>.find.sent{flex:1 1 0;min-width:0;justify-content:space-between;height:34px;box-sizing:border-box;gap:4px}
.sentrow>.find.sent.spdg{flex:0 0 auto;gap:6px;padding-right:4px}
.sentrow>#time-group{flex:1.25 1 0}
.sentrow .sbtn{padding:0 8px}
.sentwrap{container-type:inline-size;margin-top:6px}
.sentwrap>.sentrow{margin-top:0}
@container (max-width: 900px){.sentrow>.find.sent>label{display:none}.sentrow>.find.sent{padding-left:6px}}
@container (max-width: 640px){.sentrow .sbtn{padding:0 5px;font-size:11px}.sentrow .tv{font-size:11px}.spdv{min-width:38px}}
.sentrow>.find.sent label{white-space:nowrap}
.sentnotes{display:flex;gap:12px;min-height:0}
.sentnotes .note:empty{display:none}
.wavetop{display:none!important}
.ctrlrow{order:9;flex:1 1 100%;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:start;margin-top:-6px}
.ctrlrow .cl{display:flex;align-items:center;margin-top:6px}
.ctrlrow .cl .find.sent{height:34px;box-sizing:border-box;gap:8px;padding-right:4px}
.ctrlrow .cr .sentwrap{margin-top:6px}
.bar.subjmode .ctrlrow{display:none!important}
.wavetop .find.sent{height:34px;box-sizing:border-box;gap:8px;padding-right:4px}
.pbtn.spd{width:26px;height:26px}
.playcd{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;border:2px solid #EAB308;color:#EAB308;font:800 13px Consolas,monospace;box-sizing:border-box;margin-left:4px;animation:pwCdPulse 1s ease-in-out infinite}
.playcd.hidden{display:none}
@keyframes pwCdPulse{0%,100%{box-shadow:0 0 0 0 rgba(234,179,8,.6)}50%{box-shadow:0 0 0 5px rgba(234,179,8,0)}}
.spdv{min-width:44px;text-align:center}
.bar.subjmode .wavetop{display:none!important}
.find.sent{padding:2px 3px 2px 12px;border-color:#EAB308}
.find.sent label{margin-right:4px}
.pbtn{width:28px;height:28px;border-radius:50%;border:1px solid #9B2A4B;background:#7A1C38;color:#fff;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:0;flex:none}
.pbtn:hover:not(:disabled){filter:brightness(1.15)}
.pbtn:disabled{opacity:.4;cursor:not-allowed}
.pbtn.on{background:#B8325A;box-shadow:0 0 0 3px rgba(242,179,196,.25)}
.tv{font:600 12px Consolas,"JetBrains Mono",monospace;color:#E7E7EA;padding:0 2px}
.tarrow{color:#71717A;font-size:12px}
#btn-eq:disabled{opacity:.5;cursor:progress}
.pbtn.undo-eq{width:26px;height:26px;margin-left:2px}
.sbtn{height:24px;padding:0 12px;border-radius:999px;border:1px solid transparent;background:transparent;color:#D4D4D8;font-weight:600;font-size:12px;cursor:pointer}
.sbtn:hover{background:#26262B}
.sbtn[aria-checked="true"]{background:#7A1C38;border-color:#9B2A4B;color:#fff}
textarea.box-pwta{border-color:#3A3A42;color:#D4D4D8}
.pwwrap{position:relative;border-radius:8px;background:#151517}
.pwwrap textarea.box-pwta{position:relative;z-index:1;background:transparent}
.pw-hl{position:absolute;inset:0;border:1px solid transparent;border-radius:8px;padding:6px 10px;font:14px/1.45 "Segoe UI",Inter,system-ui,sans-serif;white-space:pre-wrap;overflow-wrap:break-word;word-wrap:break-word;color:transparent;pointer-events:none;overflow:hidden}
.pw-hl mark{color:transparent;background:rgba(234,179,8,.45);border-radius:3px;box-shadow:0 0 0 2px rgba(234,179,8,.45)}
.pwwrap.reading textarea.box-pwta{color:#E7E7EA}
textarea.box-pwta.edited{border-color:#EAB308;color:#FFFFFF}
textarea.box-pwta::placeholder{color:#71717A;font-style:italic}
.find{display:inline-flex;align-items:center;gap:6px;padding:2px 3px 2px 10px;border-radius:999px;background:#151517;border:1px solid #3A3A42}
.find label{font-size:12px;color:#A1A1AA}
.find input[readonly]{color:#A1A1AA;cursor:default}
.find input{width:46px;height:24px;border:0;background:transparent;color:#fff;font:700 14px Consolas,monospace;text-align:center;outline:none}
.sendbtn{margin-left:0}
.ctrlrow .cl .dlbtn{width:30px;height:30px}
.ctrlrow .cl .autobtn{height:34px;padding:0 16px;font-size:13px;box-sizing:border-box;min-width:74px;justify-content:center}
.autobtn .dots{display:none;gap:4px;align-items:center}
.autobtn .dots i{width:6px;height:6px;border-radius:50%;background:#fff;animation:pwDot 1s ease-in-out infinite}
.autobtn .dots i:nth-child(2){animation-delay:.15s}.autobtn .dots i:nth-child(3){animation-delay:.3s}
.autobtn.running .dots{display:inline-flex}
.bar.automode button:not(#btn-auto):not(#btn-keep):not(#btn-lang):not(.langopt):not(#btn-play):not(#spd-down):not(#spd-up):not(.sbtn):not(#out-headset):not(#out-speakers):not(#btn-replace),
.bar.automode input,.bar.automode textarea,.bar.automode select{pointer-events:none;filter:grayscale(1);opacity:.45}
.bar.automode textarea{opacity:.75}
.autobtn.stopping{background:#EAB308;border-color:#CA8A04;color:#1A1A1D;cursor:progress}
.autobtn.stopping .dots i{background:#1A1A1D}.autobtn.running .autolbl{display:none}
@keyframes pwDot{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
.sendbtn .spin{display:none;width:13px;height:13px;border-radius:50%;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;animation:pwSpin .8s linear infinite}
.sendbtn.loading .spin{display:inline-block}
.sendbtn.loading .plane{display:none}
.sendbtn:disabled{cursor:progress;opacity:.75}
@keyframes pwSpin{to{transform:rotate(360deg)}}
.ctrlrow .cl{gap:10px}
.ctrlrow .cl .sendbtn{height:34px;padding:0 16px;font-size:13px;box-sizing:border-box}
.findbtn{height:24px;padding:0 10px;border-radius:999px;border:1px solid #9B2A4B;background:#7A1C38;color:#fff;font-weight:600;font-size:12px;display:inline-flex;align-items:center;gap:5px;cursor:pointer}
.wave{order:9;flex:1 1 100%;position:relative;border-radius:10px;background:#151517;border:1px solid #2A2A30;overflow:hidden}
.wave canvas{display:block;width:100%;height:170px;touch-action:none}
.wave-msg{position:absolute;left:12px;top:8px;font-size:11px;color:#A1A1AA}
.subj{order:10;flex:1 1 100%;display:flex;flex-direction:column;gap:8px;border-top:1px solid #2A2A30;padding-top:10px}
.subj-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.cnt{font-size:12px;font-weight:600;padding:3px 9px;border-radius:999px;border:1px solid}
.chips{display:flex;flex-direction:column;gap:3px;max-height:min(46vh,420px);overflow-y:auto}
.srow{display:grid;grid-template-columns:20px minmax(150px,230px) minmax(0,1fr) auto;align-items:start;gap:10px;padding:6px 10px;border-radius:8px;background:#151517;border:1px solid #26262B}
.srow .si{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;margin-top:1px;color:#71717A}
.srow .sn{font-weight:600;font-size:13px;color:#E7E7EA}
.srow .sa{font-size:13px;color:#C4C4CC;white-space:pre-wrap;overflow-wrap:anywhere}
.srow .sa.empty{color:#71717A;font-style:italic}
.srow .sw{display:block;margin-top:3px;font-size:11px;color:#A1A1AA;font-style:normal}
.srow .st{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.srow .st em{font-style:normal;font-size:10px;font-weight:700;padding:2px 7px;border-radius:999px;background:#5A2226;color:#FFE4E6;white-space:nowrap}
.srow .st em.warn{background:#7C4A14;color:#FFEDD5}
.srow .sdel{height:22px;padding:0 10px;border-radius:999px;border:1px solid #3A3A42;background:transparent;color:#D4D4D8;font:600 11px "Segoe UI",system-ui,sans-serif;cursor:pointer;white-space:nowrap}
.srow .sdel:hover{background:#2E1517;border-color:#5A2226;color:#FCA5A5}
.srow .sdel.hot{background:#7F1D1D;border-color:#B91C1C;color:#fff}
.srow .sdel:disabled{opacity:.5;cursor:progress}
.srow.keep{background:#166534;border-color:#22C55E}.srow.keep .si{background:#14532D;color:#BBF7D0}
.srow.keep .sn,.srow.keep .sa,.srow.keep .sw{color:#fff}
.srow.edit{border-color:#EAB308}.srow.edit .si{background:#3A2F0B;color:#FDE68A}
.srow .sfix{display:block;margin-top:4px;font-size:12px;color:#FDE68A}
.srow .sfixbtn{height:22px;padding:0 10px;border-radius:999px;border:1px solid #CA8A04;background:#EAB308;color:#1A1A1D;font:700 11px "Segoe UI",system-ui,sans-serif;cursor:pointer;white-space:nowrap}
.srow .sfixbtn:disabled{opacity:.5;cursor:default}
.srow.del{background:#B91C1C!important;border-color:#EF4444!important}
.srow.del .si{background:#7F1D1D;color:#fff}
.srow.del .sn,.srow.del .sa,.srow.del .sw,.srow.del .sa.empty{color:#fff!important}
.srow.del .sdel.hot{background:#fff;color:#B91C1C;border-color:#fff}
.srow.del .sdel.hot.blinkb{animation:pwDelBlink 1s ease-in-out infinite}
@keyframes pwDelBlink{0%,100%{background:#fff;color:#B91C1C;box-shadow:0 0 0 0 rgba(255,255,255,.8)}50%{background:#7F1D1D;color:#fff;box-shadow:0 0 0 5px rgba(255,255,255,0)}}
.srow.del .sn{text-decoration:line-through;text-decoration-color:rgba(255,255,255,.7)}
.sc{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-size:12px;border:1px solid}
.sc.n{background:#222226;color:#D4D4D8;border-color:#3A3A42}
.sc.keep{background:#16291E;color:#6EE7A0;border-color:#1F4D33}
.sc.del{background:#2E1517;color:#FCA5A5;border-color:#5A2226}
.sc.del span{text-decoration:line-through;text-decoration-color:rgba(252,165,165,.6)}
.sc em.warn{background:#7C4A14;color:#FFEDD5}
.sc em{font-style:normal;font-size:10px;font-weight:700;padding:0 6px;border-radius:999px;background:#5A2226;color:#FFE4E6}
.linkbtn{background:none;border:0;padding:0;color:#E38AA2;cursor:pointer;font-size:12px}
.linkbtn:hover{text-decoration:underline}
.panel{position:fixed;z-index:2147483001;font:13px/1.45 "Segoe UI",Inter,system-ui,sans-serif;color:#E7E7EA;background:#1E1E22;border:1px solid #3A3A42;border-radius:12px;box-shadow:0 18px 40px rgba(0,0,0,.45);padding:12px;display:flex;flex-direction:column;gap:10px;width:min(780px,calc(100vw - 48px))}
.tp-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
.tp-hint{font-size:11px;font-weight:600;color:#18181B;background:#fff;border-radius:999px;padding:3px 10px}
.tp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px}
.tg{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:30px;padding:3px 10px;border-radius:8px;border:1px solid transparent;background:#151517;color:#E7E7EA;font-size:12px;text-align:left;cursor:pointer}
.tg:hover{border-color:#3A3A42}
.tg code{font-family:Consolas,monospace;font-size:12px;color:#E38AA2}
.tg span{color:#C4C4CC}
.tg.sel{background:#fff;border-color:#fff}
.tg.sel code{color:#7A1C38;font-weight:700}
.tg.sel span{color:#18181B}
.tp-cols{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);gap:10px}
.tp-box{background:#151517;border:1px solid #2A2A30;border-radius:8px;padding:8px 10px;font-size:12px}
.tp-box ul{margin:6px 0 0;padding:0 18px 0 0;color:#C4C4CC;line-height:1.6}
.obs{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}
.obs code{font-family:Consolas,monospace;font-size:12px;padding:2px 8px;border-radius:6px;background:#2E1517;color:#FCA5A5;text-decoration:line-through}
.mini{position:fixed;top:8px;right:12px;z-index:2147483000;height:34px;padding:0 14px;border-radius:999px;background:#18181B;border:1px solid #3A3A42;color:#E7E7EA;font:600 12px "Segoe UI",system-ui,sans-serif;display:inline-flex;align-items:center;gap:8px;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.3)}
.toast{position:fixed;right:20px;z-index:2147483002;max-width:460px;padding:9px 14px;border-radius:10px;font-size:12px;box-shadow:0 8px 20px rgba(0,0,0,.3);border:1px solid;white-space:pre-line;font-family:"Segoe UI",system-ui,sans-serif}
.toast.ok{background:#16291E;color:#6EE7A0;border-color:#1F4D33}
.toast.warn{background:#2E1F0E;color:#FDBA74;border-color:#7C4A14}
.toast.err{background:#2E1517;color:#FCA5A5;border-color:#5A2226}
.toast.info{background:#222226;color:#E7E7EA;border-color:#3A3A42}
.brand{cursor:pointer;border-radius:8px;padding:2px 6px;margin:-2px -6px}
.brand:hover,.brand.on{background:#26262B}
.tasks{position:fixed;z-index:2147483003;background:#1E1E22;border:1px solid #3A3A42;border-radius:12px;box-shadow:0 18px 40px rgba(0,0,0,.45);padding:8px;width:440px;display:flex;flex-direction:column;gap:4px;font:13px/1.4 "Segoe UI",system-ui,sans-serif;color:#E7E7EA}
.tasks .th{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#A1A1AA;padding:4px 8px}
.trow{display:flex;align-items:center;gap:10px;padding:7px 8px;border-radius:8px}
.trow:hover{background:#26262B}
.trow.cur{background:#3A1421}
.trow .info{flex:1;min-width:0;display:flex;flex-direction:column}
.trow .info span{font-size:11px;color:#A1A1AA}
.mbtn{height:28px;padding:0 12px;border-radius:7px;border:1px solid;font-size:12px;font-weight:600;cursor:pointer}
.mbtn.load{background:#7A1C38;border-color:#9B2A4B;color:#fff}
.mbtn.del{background:#2E1517;border-color:#5A2226;color:#FCA5A5}
.mbtn:disabled{opacity:.4;cursor:default}
.tasks .empty{padding:10px 8px;color:#A1A1AA}
.menu{position:fixed;z-index:2147483003;background:#1E1E22;border:1px solid #3A3A42;border-radius:12px;box-shadow:0 18px 40px rgba(0,0,0,.45);padding:6px;display:flex;flex-direction:column;gap:2px;min-width:190px;font:13px/1.4 "Segoe UI",system-ui,sans-serif;color:#E7E7EA}
.menu .mh{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#A1A1AA;padding:6px 10px 4px}
.mi.grey{opacity:.45;filter:grayscale(1)}
.mi.grey:hover{opacity:.7}
.gptwarn{position:fixed;inset:0;z-index:2147483004;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;font:14px/1.5 "Segoe UI",system-ui,sans-serif}
.gw-box{width:min(560px,92vw);background:#1E1E22;border:2px solid #EAB308;border-radius:16px;padding:26px 28px;color:#E7E7EA;box-shadow:0 24px 60px rgba(0,0,0,.6);text-align:center}
.gw-icon{font-size:40px;line-height:1;color:#EAB308}
.gw-box h3{margin:10px 0 8px;font-size:20px;color:#fff}
.gw-text{margin:0 0 20px;font-size:15px;color:#D4D4D8;white-space:pre-line}
.gw-btns{display:flex;gap:12px;justify-content:center}
.gw-btns button{height:40px;padding:0 22px;border-radius:999px;font:700 14px "Segoe UI",system-ui,sans-serif;cursor:pointer}
.gw-back{background:#7A1C38;border:1px solid #9F2B4C;color:#fff}
.gw-go{background:transparent;border:1px solid #52525B;color:#D4D4D8}
.mi{display:flex;align-items:center;gap:10px;height:38px;padding:0 10px;border-radius:8px;border:0;background:transparent;color:#E7E7EA;font-size:13px;font-weight:600;cursor:pointer;text-align:start}
.mi:hover{background:#26262B}
.mi.sel{background:#3A1421}
.mi .dot{width:22px;height:22px;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff;flex:none}
.d-gpt{background:#10A37F}.d-gem{background:#4F6BED}
.langbtn{font:800 11px "Segoe UI",system-ui,sans-serif;letter-spacing:.02em}
[dir=rtl] .tp-box ul{padding:0 18px 0 0}[dir=ltr] .tp-box ul{padding:0 0 0 18px}
button:focus-visible,input:focus-visible{outline:2px solid #E38AA2;outline-offset:2px}
`;

  const HTML = `
<div class="wrap" id="wrap">
  <div class="bar" id="bar">
    <div class="brand" id="brand" tabindex="0" title="Tasks"><b>Poliwag ▾</b><span class="mono" id="task-id">—</span></div>
    <div class="sep"></div>
    <div class="status">
      <button type="button" class="pill wait" id="chat-pill" title=""><i></i><span id="chat-pill-text">…</span></button>
      <small id="summary" class="hidden"></small>
    </div>
    <div class="spacer"></div>
    <button type="button" class="btn green" id="btn-replace">${ICON.swap}<span id="lbl-replace">Remplace</span></button>
    <button type="button" class="btn yellow" id="btn-keep">${ICON.shield}<span id="lbl-keep">Garder</span></button>
    <button type="button" class="btn green" id="btn-next"><span id="lbl-next">التالي</span></button>
    <div class="sep"></div>
    <div class="seg2" role="radiogroup" aria-label="Audio output">
      <button type="button" role="radio" aria-checked="false" id="out-headset" disabled>${ICON.headset}Headset</button>
      <button type="button" role="radio" aria-checked="false" id="out-speakers" disabled>${ICON.speaker}PC</button>
    </div>
    <button type="button" class="round r-dark" id="btn-subjects" aria-label="Subjects" title="Subjects">${ICON.tag}<b class="badge" id="subj-badge">0</b></button>
    <button type="button" class="round r-wine" id="btn-new" aria-label="New task" title="New task" aria-haspopup="menu">${ICON.plus}</button>
    <button type="button" class="round r-dark langbtn" id="btn-lang" hidden style="display:none" aria-label="Language" title="Language" aria-haspopup="menu">FR</button>
    <button type="button" class="round r-dark" id="btn-collapse" aria-label="Réduire" title="Réduire">${ICON.up}</button>

    <div class="trs">
      <div class="tr">
        <div class="tr-head">
          <b id="lbl-trans-ai">Trans ChatGPT</b>
          <span class="find"><label for="chat-no">N°</label><input id="chat-no" readonly tabindex="-1" autocomplete="off" aria-label="Numéro de la transcription ChatGPT" title="Changez ce numéro si ChatGPT et Poliwag ne sont plus synchronisés"></span><span class="mono meta" id="chat-meta"></span>
          <span class="note" id="chat-note"></span><span class="note" id="dup-note"></span>
          <button type="button" class="tagbtn" id="btn-tags">${ICON.tag}Tags ▾</button>
          <button type="button" class="findbtn sendbtn" id="btn-send" aria-label="Send segment audio to the AI"><span class="spin" aria-hidden="true"></span><svg class="plane" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg><span id="lbl-send">Send</span></button>
          <button type="button" class="findbtn autobtn" id="btn-auto" aria-label="Auto: every segment, one after the other"><span class="autolbl">Auto</span><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span></button>
          <button type="button" class="pbtn dlbtn" id="btn-dl" aria-label="Download the segment .wav" title=".wav"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11"/><path d="M7 10l5 5 5-5"/><path d="M5 20h14"/></svg></button>
        </div>
        <textarea class="box" id="chat-box" rows="1" spellcheck="false" dir="auto" aria-label="Trans ChatGPT"></textarea>
      </div>
      <div class="tr">
        <div class="tr-head">
          <b id="lbl-trans-pw">Trans Poliwag</b>
          <span class="find"><label for="seg-no">N°</label><input id="seg-no" inputmode="numeric" autocomplete="off" aria-label="Numéro du segment">
            <button type="button" class="findbtn" id="btn-search">${ICON.search}<span id="lbl-search">Search</span></button></span>
          <button type="button" class="tagbtn" id="btn-undo" title="">↶ Précédent</button>
          <button type="button" class="pbtn" id="btn-play" aria-label="Play"><svg width="13" height="13" viewBox="0 0 20 20" aria-hidden="true"><path d="M6.3 3.6a1 1 0 011.52-.85l9 5.4a1 1 0 010 1.7l-9 5.4A1 1 0 016.3 14.4V3.6z" fill="currentColor"/></svg></button>
          <span class="playcd hidden" id="play-cd" aria-live="polite" title="Play"></span>

          <span class="note" id="pw-note"></span>
        </div>
        <div class="pwwrap"><div class="pw-hl" id="pw-hl" aria-hidden="true"></div><textarea class="box box-pwta" id="pw-box" rows="1" spellcheck="false" dir="auto" aria-label="Trans Poliwag"></textarea></div>
        <div class="sentwrap"><div class="sentrow">
          <span class="find sent" role="radiogroup" aria-label="Sentiment"><label id="lbl-sent">Sentiment</label>
            <button type="button" class="sbtn" role="radio" aria-checked="false" data-sent="positive" id="sent-positive">Positif</button>
            <button type="button" class="sbtn" role="radio" aria-checked="false" data-sent="neutral" id="sent-neutral">Neutre</button>
            <button type="button" class="sbtn" role="radio" aria-checked="false" data-sent="negative" id="sent-negative">Négatif</button>
          </span>
      <span class="find sent spdg" id="speed-group" aria-label="Playback speed"><label id="lbl-speed">Vitesse</label>
        <button type="button" class="pbtn spd" id="spd-down" aria-label="Slower"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 12h14"/></svg></button>
        <span class="tv spdv" id="spd-val">1.00×</span>
        <button type="button" class="pbtn spd" id="spd-up" aria-label="Faster"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></button>
      </span>
          <span class="find sent" id="time-group" aria-label="Time"><label id="lbl-time">Time</label>
            <span class="tv" id="time-start">—</span><span class="tarrow">→</span><span class="tv" id="time-end">—</span>
            <button type="button" class="findbtn" id="btn-eq"><span id="lbl-eq">Équilibrer</span></button>
            <button type="button" class="pbtn undo-eq" id="btn-eq-undo" disabled aria-label="Undo tighten" title="Undo"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 010 11H11"/></svg></button>
          </span>
        </div></div>
        <div class="sentnotes"><span class="note" id="sent-note"></span><span class="note" id="time-note"></span></div>
      </div>
    </div>

    <div class="wave hidden" id="wave" aria-label="Segment waveform">
      <canvas id="wave-cv" height="170"></canvas>
      <span class="wave-msg" id="wave-msg"></span>
    </div>

    <div class="subj hidden" id="subj">
      <div class="subj-head">
        <b id="lbl-subj">Subjects</b><span class="meta" id="subj-meta"></span>
        <button type="button" class="linkbtn" id="btn-reread-subj"></button>
        <span class="spacer"></span>
        <span class="cnt hidden" id="cnt-range"></span><span class="cnt ok hidden" id="cnt-keep"></span><span class="cnt err hidden" id="cnt-del"></span>
        <button type="button" class="btn brown" id="btn-filter" style="height:32px">${ICON.filter}<span id="lbl-filter">Filtres</span></button>
      </div>
      <div class="chips" id="chips"></div>
    </div>
  </div>
</div>
<button type="button" class="mini hidden" id="mini">Poliwag ▾</button>
<div class="tasks hidden" id="tasks" role="dialog" aria-label="Tasks"></div>
<div class="panel hidden" id="tag-panel" role="dialog" aria-label="Vocal Tags"></div>
<div class="toast hidden" id="toast" role="status"></div>
<div class="menu hidden" id="ai-menu" role="menu"></div>
<div class="menu hidden" id="lang-menu" role="menu"></div>
`;

  // ------------------------------------------------------------------ mount

  const host = document.createElement("div");
  host.id = "poliwag-assistance-bar";
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `<style>${STYLE}</style>${HTML}`;
  // One line under the two boxes: Vitesse on the left (under Trans ChatGPT), Sentiment + Time on the right.
  {
    const row = document.createElement("div");
    row.className = "ctrlrow";
    const left = document.createElement("div"), right = document.createElement("div");
    left.className = "cl"; right.className = "cr";
    left.append(root.getElementById("speed-group"), root.getElementById("btn-send"), root.getElementById("btn-auto"), root.getElementById("btn-dl")); // Send next to Vitesse
    right.append(root.querySelector(".sentwrap"), root.querySelector(".sentnotes"));
    row.append(left, right);
    root.querySelector(".trs").after(row);
  }
  (document.body || document.documentElement).appendChild(host);

  // Keep our keystrokes and clicks inside the bar (the page has its own shortcuts).
  for (const ev of ["keydown", "keyup", "keypress", "input", "paste", "cut", "copy", "mousedown", "mouseup", "click", "dblclick", "focusin", "focusout"]) {
    host.addEventListener(ev, (e) => e.stopPropagation());
  }

  const $ = (id) => root.getElementById(id);
  const send = (type, payload = {}) =>
    chrome.runtime.sendMessage({ type, ...payload }).catch((e) => ({ ok: false, error: String(e?.message || e) }));

  // ------------------------------------------------------------------ state

  let data = { state: null, tasks: {} };
  let currentN = null;             // Poliwag segment number (target of Remplace)
  let chatN = null;                // ChatGPT transcription shown (normally = currentN)
  let chatOverride = false;        // true when the user picked another ChatGPT number by hand
  let dirty = false;
  let newClicked = false;
  const filterClicked = new Set(); // Filtres blinks until it is used once in the task
  let playBlinkFor = null;
  let segAudioMark = { n: null, max: Infinity }; // newest ChatGPT reply number when the segment was chosen         // ▶ blinks for a newly chosen segment until it is played
  let sentChoice = null;           // positive / neutral / negative chosen in the bar (written to Maven on Garder / Remplace)          // + blinks at the start until you click it
  let pwDirty = false;             // Trans Poliwag edited in the bar, not yet written to Maven (Garder writes it)
  let pwLoadedFor = null;          // segment number whose Maven text is in the box
  // Undo history for the two boxes: Précédent brings back the word you just changed or deleted.
  const hist = { "chat-box": [], "pw-box": [] };
  const histMeta = { "chat-box": { prev: "", at: 0 }, "pw-box": { prev: "", at: 0 } };
  let lastEdited = "pw-box";               // the user typed in Trans ChatGPT since it was filled
  let selectedTag = null;
  let lastEventSeen = null;
  let lastInvalid = null; // last JSON refused (e.g. "incomplete": the AI did not get the audio)
  let dupShownUntil = 0;
  let draftTimer = null;
  let toastTimer = null;

  const task = () => (data.state ? data.tasks[data.state.currentTaskId] || null : null);
  // The JSON shown in Trans <AI> is always the LAST one received, unless it was already used
  // (Remplace / Garder) — then the box waits for the next one. The Poliwag number never jumps by itself.
  function latestFreeAudio(t) {
    if (!t?.audios?.length) return null;
    const last = t.audios.reduce((a, b) => (b.n > a.n ? b : a));
    const used = Object.values(t.segments || {}).some((g) => g.audioN === last.n && (g.action === "replaced" || g.action === "kept"));
    return used ? null : last;
  }
  function aiName() { return AI_NAMES[task()?.chat?.engine || "chatgpt"] || "ChatGPT"; }
  const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();
  const hhmm = (iso) => { try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }); } catch { return ""; } };

  function toast(msg, kind = "info", ms = 3000) {
    const t = $("toast");
    t.textContent = msg;
    t.className = "toast " + kind;
    const r = $("bar").getBoundingClientRect();
    t.style.top = Math.round(($("wrap").classList.contains("hidden") ? 50 : r.bottom) + 8) + "px";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add("hidden"), ms);
  }

  function setNote(id, text, cls) {
    const el = $(id);
    el.textContent = text || "";
    el.className = "note " + (cls || "");
  }

  // Both transcript boxes grow with their text and always keep the same height, side by side.
  function autosize() {
    const a = $("chat-box"), b = $("pw-box");
    a.style.height = "auto";
    b.style.height = "auto";
    const h = Math.max(a.scrollHeight, b.scrollHeight) + 2 + "px";
    a.style.height = h;
    b.style.height = h;
  }

  // ------------------------------------------------------------------ the Poliwag page (read)

  // The Poliwag editor can live inside an iframe of the Maven page: look in the page AND in every
  // frame we are allowed to read (same origin). Nothing is changed, it is only read.
  function allDocs() {
    const out = [];
    const walk = (doc, depth) => {
      if (!doc || depth > 4) return;
      out.push(doc);
      for (const f of doc.querySelectorAll("iframe, frame")) {
        let d = null;
        try { d = f.contentDocument; } catch { d = null; }
        if (d) walk(d, depth + 1);
      }
    };
    walk(document, 0);
    return out;
  }

  function allRows() {
    return allDocs().flatMap((d) => Array.from(d.querySelectorAll("tr.pw-seg, [data-seg-row]")));
  }

  function findRow(n) {
    const want = String(n);
    const rows = allRows();
    for (const row of rows) {
      const idx = row.querySelector(".pw-seg-play-idx");
      if (idx && idx.textContent.trim() === want) return row;
    }
    for (const row of rows) if (row.getAttribute("data-idx") === want) return row;
    for (const d of allDocs()) {
      const ta = d.querySelector(`textarea[aria-label="Segment ${CSS.escape(want)} text"]`);
      if (ta) return ta.closest("tr") || ta.parentElement;
    }
    return null;
  }

  function segTextarea(n) {
    const row = findRow(n);
    if (!row) return null;
    return row.querySelector('textarea[data-field="text"]') || row.querySelector("textarea.pw-seg-text") || row.querySelector("textarea");
  }

  function segCount() {
    const rows = allRows();
    if (rows.length) return rows.length;
    return allDocs().reduce((k, d) => k + d.querySelectorAll('textarea[aria-label^="Segment "][aria-label$=" text"]').length, 0);
  }

  function readSubjectsFromPage() {
    const rows = allDocs().flatMap((d) => Array.from(d.querySelectorAll(".pw-topics-list .pw-topic-row, li.pw-topic-row")));
    const out = [];
    for (const r of rows) {
      const name = norm(r.querySelector(".pw-topic-label")?.textContent);
      if (!name) continue;
      const note = r.querySelector('textarea[data-field="annotation"]');
      out.push({ name, code: norm(r.querySelector(".pw-topic-code")?.textContent), key: r.getAttribute("data-key") || "", annotation: note ? note.value.trim() : "" });
    }
    return out;
  }

  // Clicks Maven's own "Remove" button of one subject (only when you press Supprimer in the bar).
  // If Maven opens its own confirmation box after Supprimer / Correction, answer it (OK) at once.
  async function autoConfirm(ms = 1500) {
    const words = /^(ok|okay|confirm|confirmer|yes|oui|valider|remove|delete|supprimer|save|enregistrer|apply|appliquer|done)$/i;
    const end = Date.now() + ms;
    while (Date.now() < end) {
      for (const d of allDocs()) {
        const boxes = d.querySelectorAll('[role="dialog"], [role="alertdialog"], dialog[open], .modal, .pw-modal, .pw-dialog, .pw-confirm');
        for (const box of boxes) {
          if (box.closest("#poliwag-assistance-bar")) continue;
          const st = d.defaultView.getComputedStyle(box);
          if (st.display === "none" || st.visibility === "hidden") continue;
          const btn = [...box.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]')]
            .find((x) => words.test(norm(x.textContent || x.value)) && !x.disabled);
          if (btn) { btn.click(); return true; }
        }
      }
      await new Promise((res) => setTimeout(res, 100));
    }
    return false;
  }

  // Correction: writes the corrected (English) note into the subject's annotation box in Maven.
  const corrected = new Set(); // subjects whose note was corrected (then shown green)
  async function correctSubject(name, text, btn) {
    const row = allDocs().flatMap((d) => Array.from(d.querySelectorAll(".pw-topic-row")))
      .find((x) => norm(x.querySelector(".pw-topic-label")?.textContent) === name);
    const ta = row?.querySelector('textarea[data-field="annotation"]');
    if (!ta) return toast(t_("subjNotOnPage", { name }), "err");
    if (!text) return toast(t_("subjNoCorr"), "err");
    btn.disabled = true;
    const win = ta.ownerDocument.defaultView || window;
    const setVal = (v) => {
      Object.getOwnPropertyDescriptor(win.HTMLTextAreaElement.prototype, "value").set.call(ta, v);
      ta.dispatchEvent(new win.InputEvent("input", { bubbles: true, inputType: v ? "insertText" : "deleteContentBackward" }));
    };
    ta.focus();
    // 1) erase what is written in the box, 2) put only the new text
    ta.select();
    let ok = false;
    try { ok = ta.ownerDocument.execCommand("delete") && ta.value === ""; } catch {}
    if (!ok) setVal("");
    try { ok = ta.ownerDocument.execCommand("insertText", false, text) && ta.value === text; } catch { ok = false; }
    if (!ok) setVal(text);
    ta.dispatchEvent(new win.Event("change", { bubbles: true }));
    ta.blur();
    // a Save / OK button of this subject in Maven, if there is one, then any OK box
    const save = [...row.querySelectorAll('button, [role="button"]')].find((x) => /^(ok|save|enregistrer|valider|apply|done|✓)$/i.test(norm(x.textContent)) || /save|confirm|apply/i.test(x.getAttribute("data-action") || ""));
    if (save) save.click();
    await autoConfirm(800);
    await new Promise((res) => setTimeout(res, 300));
    if (ta.value !== text) { btn.disabled = false; return toast(t_("subjCorrFail", { name }), "err"); }
    corrected.add(name);
    await send("PA_SET_SUBJECTS", { subjects: readSubjectsFromPage() });
    toast(t_("subjCorrDone", { name }), "ok");
    renderSubjects();
  }

  async function deleteSubject(name, btn) {
    const rowOf = () => allDocs().flatMap((d) => Array.from(d.querySelectorAll(".pw-topic-row")))
      .find((r) => norm(r.querySelector(".pw-topic-label")?.textContent) === name);
    const row = rowOf();
    const rm = row?.querySelector('[data-action="remove-topic"]');
    if (!rm) return toast(t_("subjNotOnPage", { name }), "err");
    btn.disabled = true;
    // click Remove inside the page with its confirmation already answered "OK"
    const viaPage = await send("PA_REMOVE_TOPIC", { name }).catch(() => null);
    if (!viaPage?.ok) rm.click();
    await autoConfirm(1200);
    await new Promise((res) => setTimeout(res, 500));
    if (rowOf()) {
      btn.disabled = false;
      return toast(t_("subjStill", { name }), "warn", 5000);
    }
    await send("PA_SET_SUBJECTS", { subjects: readSubjectsFromPage() });
    toast(t_("subjDeleted", { name }), "ok");
  }

  // ------------------------------------------------------------------ the Poliwag page (write — Remplace only)

  function writeSegment(ta, text) {
    const win = ta.ownerDocument.defaultView || window; // the textarea may be inside an iframe
    const setter = Object.getOwnPropertyDescriptor(win.HTMLTextAreaElement.prototype, "value").set;
    setter.call(ta, text);
    ta.dispatchEvent(new win.Event("input", { bubbles: true }));
    ta.dispatchEvent(new win.Event("change", { bubbles: true }));
    return ta.value === text;
  }

  function segSentimentSelect(n) {
    const row = findRow(n);
    return row ? row.querySelector('select[data-field="sentiment"]') : null;
  }

  // Writes the chosen sentiment into the segment's own select, the same way a user choice would.
  function writeSentiment(n, value) {
    const sel = segSentimentSelect(n);
    if (!sel) return false;
    if (![...sel.options].some((o) => o.value === value)) return false;
    if (sel.value === value) return true;
    const win = sel.ownerDocument.defaultView || window;
    const setter = Object.getOwnPropertyDescriptor(win.HTMLSelectElement.prototype, "value").set;
    setter.call(sel, value);
    sel.dispatchEvent(new win.Event("input", { bubbles: true }));
    sel.dispatchEvent(new win.Event("change", { bubbles: true }));
    return sel.value === value;
  }

  // ------------------------------------------------------------------ Time: tighten start / end to the speech

  const audioCache = new Map(); // url -> Promise<{rate, chans, duration}>
  let audioPending = 0, audioDone = 0, audioFailed = false, audioSeen = false; // audio files being read / read (Send waits for them)
  const AUDIO_RE = /\.(wav|mp3|m4a|ogg|flac|opus|webm)(\?|$)/i;

  // The audio file(s) Maven loaded. The page's own list is read through the background
  // (main world, every frame), because Maven may load them from an inner frame.
  // Maven is a single page app: the list also holds the files of earlier tasks, whose signed
  // links expire (HTTP 403). Only the newest batch (the current task) is kept, in load order.
  async function audioUrls() {
    const all = [];
    try {
      const r = await send("PA_FIND_AUDIO");
      (r?.urls || []).forEach((u) => all.push(typeof u === "string" ? { url: u, t: 0 } : u));
    } catch {}
    for (const d of allDocs()) {
      try {
        const now = d.defaultView.performance.now();
        (d.defaultView.performance.getEntriesByType("resource") || [])
          .filter((e) => e.initiatorType !== "script").forEach((e) => all.push({ url: e.name, t: e.startTime - now + Date.now() }));
      } catch {}
      for (const el of d.querySelectorAll("audio[src], video[src], source[src]")) all.push({ url: el.src, t: Date.now() });
    }
    // one entry per file (same path, newest signature)
    const byPath = new Map();
    for (const e of all) {
      if (!e?.url || !AUDIO_RE.test(e.url)) continue;
      const path = e.url.split("?")[0];
      const old = byPath.get(path);
      if (!old || e.t > old.t) byPath.set(path, e);
    }
    const list = [...byPath.values()].sort((a, b) => b.t - a.t);
    if (!list.length) return [];
    const newest = list[0].t;
    return list.filter((e) => newest - e.t < 15000).sort((a, b) => a.t - b.t).map((e) => e.url);
  }

  function decode(url) {
    if (audioCache.has(url)) return audioCache.get(url);
    const path = url.split("?")[0];
    for (const [k, v] of audioCache) if (k.split("?")[0] === path) return v;
    audioPending++;
    const p = (async () => {
      // The page already downloaded this file: take it from the browser cache first,
      // so an expired signed link does not matter.
      let res = null;
      try { res = await fetch(url, { credentials: "omit", cache: "force-cache" }); } catch {}
      if (!res || !res.ok) res = await fetch(url, { credentials: "omit" });
      if (!res.ok) throw new Error(res.status === 403 ? t_("audioExpired") : "HTTP " + res.status);
      const buf = await res.arrayBuffer();
      const raw = buf.slice(0); // original bytes, for Send (full quality); decoding detaches buf
      const ctx = new OfflineAudioContext(2, 16000, 16000);
      const audio = await ctx.decodeAudioData(buf);
      const chans = [];
      for (let c = 0; c < audio.numberOfChannels; c++) chans.push(audio.getChannelData(c));
      return { rate: audio.sampleRate, chans, duration: audio.duration, raw };
    })();
    p.then(() => { audioDone++; }, () => { audioCache.delete(url); audioFailed = true; }).finally(() => { audioPending--; renderSendBtn(); });
    audioCache.set(url, p);
    renderSendBtn();
    return p;
  }

  // The decoded candidate files (newest batch), skipping links that no longer open
  // (expired signed URLs of earlier tasks). Only files LONG ENOUGH to contain the requested
  // range are kept: a short preview clip of another segment must never be cut at this
  // segment's times, and an empty / wrong clip must never be sent to the AI.
  async function audioSources(needEnd) {
    const urls = await audioUrls();
    if (!urls.length) throw new Error(t_("timeNoAudio"));
    const files = [];
    for (const u of urls.slice(0, 8)) {
      try { const f = await decode(u); if (f && f.chans && f.chans.length) files.push(f); } catch {}
    }
    if (!files.length) throw new Error(t_("audioExpired"));
    const fits = files.filter((f) => !isFinite(needEnd) || f.duration >= needEnd - 0.05);
    return fits.length ? fits : files;
  }

  // Channel 0 / channel 1: either one stereo file (left / right) or one file per channel.
  // Which file and which channel inside it hold Maven's channel 0 / 1 (same rule as loadChannel).
  async function channelSource(channel, needEnd) {
    const files = await audioSources(needEnd);
    const multi = files.filter((f) => f.chans.length > channel);
    if (multi.length) return { file: multi.reduce((a, b) => (b.duration > a.duration ? b : a)), idx: channel };
    if (files.length > channel) return { file: files[channel], idx: 0 };
    return { file: files[0], idx: 0 };
  }

  // The segment as a mono .wav, cut from Maven's original file at its own quality.
  function cutWav(raw, idx, s0, e0) {
    const v = new DataView(raw);
    const tag = (o) => String.fromCharCode(v.getUint8(o), v.getUint8(o + 1), v.getUint8(o + 2), v.getUint8(o + 3));
    if (raw.byteLength < 44 || tag(0) !== "RIFF" || tag(8) !== "WAVE") return null;
    let fmt = null, dataOff = -1, dataLen = 0;
    for (let o = 12; o + 8 <= raw.byteLength;) {
      const id = tag(o), len = v.getUint32(o + 4, true);
      if (id === "fmt ") {
        fmt = { format: v.getUint16(o + 8, true), ch: v.getUint16(o + 10, true), rate: v.getUint32(o + 12, true), bits: v.getUint16(o + 22, true) };
        if (fmt.format === 0xfffe && len >= 40) fmt.format = v.getUint16(o + 32, true); // extensible: real format in the sub-format
      }
      if (id === "data") { dataOff = o + 8; dataLen = Math.min(len, raw.byteLength - dataOff); break; }
      o += 8 + len + (len & 1);
    }
    if (!fmt || dataOff < 0) return null;
    let { format, ch, rate, bits } = fmt;
    const bps = bits / 8, frame = bps * ch;
    if (!(format === 1 && [16, 24, 32].includes(bits)) && !(format === 3 && bits === 32)) return null;
    const total = Math.floor(dataLen / frame);
    const a = Math.max(0, Math.floor(s0 * rate)), z = Math.min(total, Math.ceil(e0 * rate));
    if (z <= a) return null;
    const n = z - a, out = new ArrayBuffer(44 + n * 2), w = new DataView(out);
    const put = (o, s) => { for (let i = 0; i < 4; i++) w.setUint8(o + i, s.charCodeAt(i)); };
    put(0, "RIFF"); w.setUint32(4, 36 + n * 2, true); put(8, "WAVE"); put(12, "fmt "); w.setUint32(16, 16, true);
    w.setUint16(20, 1, true); w.setUint16(22, 1, true); w.setUint32(24, rate, true); w.setUint32(28, rate * 2, true);
    w.setUint16(32, 2, true); w.setUint16(34, 16, true); put(36, "data"); w.setUint32(40, n * 2, true);
    const c = Math.min(idx, ch - 1);
    for (let i = 0; i < n; i++) {
      const o = dataOff + (a + i) * frame + c * bps;
      let x;
      if (format === 3) x = Math.max(-1, Math.min(1, v.getFloat32(o, true))) * 32767;
      else if (bits === 16) x = v.getInt16(o, true);
      else if (bits === 24) x = ((v.getUint8(o) | (v.getUint8(o + 1) << 8) | (v.getInt8(o + 2) << 16))) / 256;
      else x = v.getInt32(o, true) / 65536;
      w.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, Math.round(x))), true);
    }
    return { blob: new Blob([out], { type: "audio/wav" }), rate };
  }

  async function segmentWav(n) {
    const f = segInputs(n);
    const s0 = parseFloat(f?.start?.value), e0 = parseFloat(f?.end?.value);
    if (!f || !isFinite(s0) || !isFinite(e0) || e0 <= s0) throw new Error(t_("timeBad"));
    const ch = Number(f.channel?.value || 0);
    const src = await channelSource(ch, e0);
    // The file must really contain the whole segment: a shorter file means Maven's full audio
    // is not the one being read (a preview clip, an expired link) — sending it would transcribe
    // the WRONG audio. Better to stop with a clear message than to send a bad clip.
    if (src.file.duration < e0 - 0.05) throw new Error(t_("timeShort"));
    const cut = src.file.raw ? cutWav(src.file.raw, src.idx, s0, e0) : null;
    if (cut) return cut;
    // not a plain .wav file: use the decoded copy (16 kHz)
    const d = src.file.chans[src.idx] || src.file.chans[0], rate = src.file.rate;
    return { blob: wavBlob(d.subarray(Math.floor(s0 * rate), Math.min(d.length, Math.ceil(e0 * rate))), rate), rate };
  }
  // The white filter line applied to the sound itself: everything under the line is muted,
  // so you only hear (and send) what goes above it. Short fades avoid clicks.
  async function gateWav(blob, level) {
    const buf = await blob.arrayBuffer(), v = new DataView(buf);
    const rate = v.getUint32(24, true), n = (buf.byteLength - 44) >> 1;
    const thr = level * 32768, win = Math.max(1, Math.round(rate * 0.01)), hold = Math.round(0.03 / 0.01);
    const frames = Math.ceil(n / win), open = new Uint8Array(frames);
    for (let f = 0; f < frames; f++) {
      let m = 0;
      for (let i = f * win; i < Math.min(n, (f + 1) * win); i++) { const x = Math.abs(v.getInt16(44 + i * 2, true)); if (x > m) m = x; }
      open[f] = m >= thr ? 1 : 0;
    }
    // keep a few ms after each loud frame (end of syllables)
    const keep = new Uint8Array(frames);
    for (let f = 0, last = -1e9; f < frames; f++) { if (open[f]) last = f; keep[f] = f - last <= hold ? 1 : 0; }
    let g = 0;
    const step = 1 / Math.max(1, Math.round(rate * 0.005)); // 5 ms fade
    for (let i = 0; i < n; i++) {
      const target = keep[Math.floor(i / win)];
      g = target ? Math.min(1, g + step) : Math.max(0, g - step);
      if (g < 1) v.setInt16(44 + i * 2, Math.round(v.getInt16(44 + i * 2, true) * g), true);
    }
    return new Blob([buf], { type: "audio/wav" });
  }
  // Quiet audio is made louder before it is sent (peak to about 90%, at most x8), so faint words are heard.
  async function normalizeWav(blob) {
    const buf = await blob.arrayBuffer(), v = new DataView(buf);
    const n = (buf.byteLength - 44) >> 1;
    let peak = 1;
    for (let i = 0; i < n; i++) { const x = Math.abs(v.getInt16(44 + i * 2, true)); if (x > peak) peak = x; }
    const gain = Math.min(8, (0.9 * 32767) / peak);
    if (gain <= 1.05) return blob;
    for (let i = 0; i < n; i++) {
      const y = Math.round(v.getInt16(44 + i * 2, true) * gain);
      v.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, y)), true);
    }
    return new Blob([buf], { type: "audio/wav" });
  }
  const manualLevel = (n) => levelMap.get(LEVEL_KEY);
  // Automatic noise level of a segment (same rule as the graph: quiet part ×2), from its own audio.
  async function autoLevelFor(n) {
    const f = segInputs(n);
    const s0 = parseFloat(f?.start?.value), e0 = parseFloat(f?.end?.value);
    if (!f || !isFinite(s0) || !isFinite(e0) || e0 <= s0) return null;
    const pad = Math.min(0.6, (e0 - s0) * 0.25 + 0.2);
    const audio = await loadChannel(Number(f.channel?.value || 0), e0 + pad);
    const a = Math.max(0, Math.floor((s0 - pad) * audio.rate)), z = Math.min(audio.data.length, Math.ceil((e0 + pad) * audio.rate));
    const win = Math.max(1, Math.round(audio.rate * 0.01)), amp = [];
    let peak = 1e-4;
    for (let i = a; i < z; i += win) {
      let m = 0;
      for (let j = i; j < Math.min(z, i + win); j++) { const v = Math.abs(audio.data[j]); if (v > m) m = v; }
      amp.push(m); if (m > peak) peak = m;
    }
    amp.sort((x, y) => x - y);
    return Math.min(peak * 0.9, Math.max(peak * 0.02, (amp[Math.floor(amp.length * 0.15)] || 0) * 2));
  }
  // The filter really used on the sound (Play and Send): your line, or the automatic one of the segment.
  async function filterLevel(n) {
    const m = manualLevel(n);
    if (m != null) return m;
    try { return await autoLevelFor(n); } catch { return null; }
  }

  async function blobToB64(blob) {
    const u8 = new Uint8Array(await blob.arrayBuffer());
    let s = "";
    for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(s);
  }

  // Send: the segment .wav + its prompt go to the task's ChatGPT / Gemini conversation;
  // the JSON reply comes back into Trans ChatGPT like the others.
  let sendBusy = false, lastSendError = "";
  // After Send, the AI tab is in the background: Chrome slows its timers down, so its reply
  // may not be reported. While a reply is awaited, the bar asks for it every 2 seconds.
  let waitReply = null;
  let machineHint = { n: null, text: "" }; // machine (Poliwag) text shown as a grey hint in the Gemini box after Send
  let lastAiError = null; // last error / limit message seen on the Gemini / ChatGPT page
  setInterval(async () => {
    if (!waitReply) return;
    const got = (task()?.audios || []).some((a) => a.n > waitReply.mark);
    if (got) { waitReply = null; if (sendBusy) { sendBusy = false; renderSendBtn(); } return; } // the JSON is here: Send is free again
    if (Date.now() > waitReply.until) { waitReply = null; return; }
    let rn = null;
    try { rn = await send("PA_READ_NOW"); } catch {}
    // the AI page itself shows an error / limit message: say it now (no point in waiting 3 minutes)
    if (rn && rn.pageError) {
      lastAiError = { at: Date.now(), msg: rn.pageError };
      waitReply.nudges = 99;
      setNote("chat-note", t_("aiError") + rn.pageError, "redish");
      return;
    }
    // still no JSON after 10 s: go to the Gemini page so it delivers its answer, then back to Maven
    if (waitReply && waitReply.nudges < 3 && Date.now() - waitReply.lastNudge > 10000) {
      waitReply.nudges++; waitReply.lastNudge = Date.now();
      setNote("chat-note", t_("nudgeAi"), "orange");
      try { await send("PA_NUDGE_AI"); } catch {}
    }
  }, 2000);
  function renderSendBtn() {
    const btn = root.getElementById("btn-send");
    if (!btn) return;
    // a file found on the page and still being read (not when there is none or it failed: Send then says why)
    const loading = audioPending > 0 || (currentN !== null && audioSeen && audioDone === 0 && !audioFailed);
    btn.classList.toggle("loading", loading || sendBusy);
    btn.disabled = loading || sendBusy;
    btn.title = loading ? t_("timeWorking") : "";
  }
  // ------------------------------------------------------------------ Auto
  // From segment 0 to the last one: Search → wait for its audio → Équilibrer → Neutre → speed 0.75×
  // → Send (same filter line, unchanged) → wait for Gemini's JSON → Play the whole segment → Remplace.
  // Click Auto again to stop.
  let autoRun = null;
  const autoSleep = (ms) => new Promise((res) => setTimeout(res, ms));
  async function autoWait(fn, ms, step = 250) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      if (!autoRun || autoRun.stop) throw new Error("stopped");
      if (autoRun.skip) throw new Error("skip");
      const v = await fn();
      if (v) return v;
      await autoSleep(step);
    }
    return null;
  }
  // three short bells, one after the other
  let bellCtx = null;
  async function bells() {
    try {
      bellCtx = bellCtx || new AudioContext();
      if (bellCtx.state === "suspended") await bellCtx.resume();
      const t0 = bellCtx.currentTime + 0.05;
      for (let i = 0; i < 3; i++) {
        const t = t0 + i * 0.35, o = bellCtx.createOscillator(), g = bellCtx.createGain();
        o.type = "sine"; o.frequency.value = 1046;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.35, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        o.connect(g).connect(bellCtx.destination);
        o.start(t); o.stop(t + 0.3);
      }
      await autoSleep(1100);
    } catch {}
  }
  function setSpeedTo(v) {
    speed = v;
    writeRate(v);
    try { chrome.storage.local.set({ pa_speed: v }); } catch {}
    renderSpeed();
  }
  function renderAuto() {
    const b2 = $("btn-auto");
    if (!b2) return;
    b2.classList.toggle("running", !!autoRun);
    $("bar").classList.toggle("automode", !!autoRun);
    const stopping = !!autoRun && autoRun.stop;
    b2.classList.toggle("blinkb", !!autoRun && !stopping);
    b2.classList.toggle("stopping", stopping); // yellow while it finishes the current step
    b2.title = stopping ? t_("autoStopping") : autoRun ? t_("autoStopTip") : t_("autoTip");
  }
  async function autoStep(n) {
    setNote("chat-note", t_("autoAt", { n }), "muted");
    // 1. Search
    $("seg-no").value = String(n);
    await search(n);
    if (currentN !== n) throw new Error(t_("e_segNF", { n }));
    // 2. its audio is shown in the graph
    await autoWait(() => wv.base && wv.n === n && !audioPending, 60000);
    if (!wv.base) throw new Error(t_("timeNoAudio"));
    // 3. Équilibrer, pressed twice
    for (let k = 0; k < 2; k++) {
      await autoWait(() => !timeBusy, 30000, 100);
      await equalize();
      await autoWait(() => !timeBusy, 30000, 100);
      await autoSleep(400);
    }
    if (autoRun?.skip) throw new Error("skip");
    // 4. (sentiment is chosen when the transcription is there: see below)
    // 5. speed 0.75×
    // (speed 0.75× is set once when Auto starts)
    // 6. Send, then wait for the JSON of this segment
    // No audio_id at all: as soon as something is written in the Trans Gemini box, Auto goes on (Play).
    // A text already in the box when this segment starts (Auto was stopped after it came) is used as is.
    const boxText = () => $("chat-box").value.trim();
    let got = boxText() ? { text: boxText() } : null;
    if (!got) {
      // up to 2 tries: if the AI answers "incomplete" (it did not receive / hear the audio), send it again
      for (let attempt = 1; attempt <= 2 && !got; attempt++) {
        await autoWait(() => !$("btn-send").disabled, 60000);
        const before = boxText();
        const sentAt = Date.now();
        if (!(await sendSegmentToAi())) throw new Error(lastSendError || t_("sendFail"));
        const res = await autoWait(() => {
          const t = boxText();
          if (t && t !== before) return { a: { text: t } };
          if (lastInvalid && lastInvalid.at > sentAt) return { bad: lastInvalid };
          if (lastAiError && lastAiError.at > sentAt) return { aiErr: lastAiError };
          return null;
        }, 180000, 300);
        if (res?.a) got = res.a;
        else if (res?.aiErr) throw new Error(t_("aiError") + res.aiErr.msg);
        else if (res?.bad) {
          if (attempt === 2) throw new Error(t_("autoIncomplete", { n }) + (res.bad.notes || []).join(" "));
          setNote("chat-note", t_("autoResend", { n }), "orange");
          await autoSleep(1500);
        } else break;
      }
    }
    if (!got) throw new Error(t_("autoNoReply"));
    await autoSleep(600);
    if (!$("chat-box").value.trim()) throw new Error(t_("autoEmpty", { n }));
    // Sentiment from the transcription: a laugh -> Positif, crying -> Négatif, otherwise Neutre
    {
      const txt = $("chat-box").value.toLowerCase();
      const laugh = /\[laugh\]/.test(txt), cry = /\[cry\]/.test(txt);
      const sent = laugh && !cry ? "positive" : cry && !laugh ? "negative" : "neutral";
      writeSentiment(n, sent); renderSentiment();
    }
    // 7. Play as soon as the JSON is there. If Play did not start: a 5 → 0 countdown next to ▶, then Play again.
    //    When the reading is over: Remplace at once.
    head = { n, rest: null, last: null, endAt: 0 };
    {
      const f7 = segInputs(n);
      const dur = (parseFloat(f7?.end?.value) - parseFloat(f7?.start?.value)) || 5;
      const cd = $("play-cd");
      let playing = false;
      for (let attempt = 0; attempt < 4 && !playing; attempt++) {
        if (attempt > 0) {
          cd.classList.remove("hidden");
          for (let s = 5; s >= 0; s--) {
            cd.textContent = String(s);
            if (s > 0) await autoWait(() => false, 1000);
          }
          cd.classList.add("hidden");
          head = { n, rest: null, last: null, endAt: 0 };
        }
        await Promise.race([playSegment().catch(() => false), autoSleep(8000)]);
        playing = !!(await autoWait(() => isPlayingNow(), 2500, 100));
      }
      cd.classList.add("hidden");
      if (playing) await autoWait(() => !isPlayingNow(), (dur / (speed || 1)) * 1000 + 4000, 150);
      await autoSleep(300);
    }
    if (isPlayingNow()) pauseSegment();
    if (!autoRun || autoRun.stop) throw new Error("stopped");
    if (autoRun.skip) throw new Error("skip");
    autoRun.replacing = true;
    try { await replace(); } finally { if (autoRun) autoRun.replacing = false; }
  }
  async function autoStart() {
    if (autoRun) {
      autoRun.stop = true; renderAuto();
      if (isPlayingNow()) pauseSegment();
      send("PA_RELOAD_AI").catch(() => {}); // refresh Gemini at the same time, so nothing stays blocked
      return;
    }
    if (!task()) return toast(t_("sendNoTask"), "err");
    autoRun = { stop: false };
    setSpeedTo(0.75);
    renderAuto();
    // start from the segment where you are (the N of Trans Poliwag), not from 0
    const typed = parseInt($("seg-no").value, 10);
    let n = currentN !== null ? currentN : (isFinite(typed) && typed >= 0 ? typed : 0);
    try {
      const total = segCount();
      while (n < total) {
        try {
          await autoStep(n);
        } catch (err) {
          if (String(err?.message) !== "skip") throw err;
          // Garder was pressed: it saves this segment and moves on; Auto goes on from there
          if (isPlayingNow()) pauseSegment();
          await (autoRun.keepDone || Promise.resolve());
        }
        if (autoRun.stop) break;
        autoRun.skip = false; autoRun.keepDone = null;
        if (currentN === null || currentN === n) break; // last segment: nothing after it
        n = currentN;
      }
      if (!autoRun.stop) toast(t_("autoDone", { n: Math.max(0, total - 1) }), "ok", 6000);
    } catch (err) {
      if (String(err?.message) !== "stopped") toast(t_("autoFail", { n }) + (err?.message || err), "err", 9000);
    } finally {
      if (isPlayingNow()) pauseSegment();
      autoRun = null;
      $("play-cd").classList.add("hidden");
      renderAuto();
      setNote("chat-note", "", "");
    }
  }

  // ⬇ saves exactly the .wav that Send sends (to listen to it and check it)
  async function downloadSegmentWav() {
    if (currentN === null) return toast(t_("e_noNum"), "err");
    try {
      let { blob } = await segmentWav(currentN);
      { const lv = await filterLevel(currentN); if (lv != null) blob = await gateWav(blob, lv); }
      const url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = `poliwag_seg_${currentN}.wav`;
      root.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) { toast(t_("sendFail") + (err?.message || err), "err", 6000); }
  }

  async function sendSegmentToAi() {
    if (currentN === null) return toast(t_("e_noNum"), "err");
    if (!task()) return toast(t_("sendNoTask"), "err");
    if (sendBusy) return;
    const n = currentN;
    // right away: the machine (Poliwag) text of this segment is shown in the Gemini box as a grey hint
    try { machineHint = { n, text: (segTextarea(n)?.value || "").trim() }; renderChat({ fill: false }); } catch {}
    sendBusy = true; renderSendBtn();
    setNote("chat-note", t_("sendWorking", { n }), "muted");
    try {
      let { blob } = await segmentWav(n);
      { const lv = await filterLevel(n); if (lv != null) blob = await gateWav(blob, lv * 0.4); } // gentle noise filter: quiet words must stay
      blob = await normalizeWav(blob); // louder, so faint speech is heard
      const b64 = await blobToB64(blob);
      // watch for the reply from now on (also frees Send if the AI page answers before it reports "sent")
      waitReply = { until: Date.now() + 180000, mark: (task()?.audios || []).reduce((m, a) => Math.max(m, a.n), -1), sentAt: Date.now(), nudges: 0, lastNudge: Date.now() };
      // time for the AI page to load the file before Send: 15 s, 20 s for a long audio (10 s or more)
      const fs = segInputs(n), dur = parseFloat(fs?.end?.value) - parseFloat(fs?.start?.value);
      // a little time for the upload; then Send is clicked once, when it is open and nothing is loading
      const waitMs = isFinite(dur) && dur >= 10 ? 3000 : 2000;
      setNote("chat-note", t_("sendLoading", { n }), "muted");
      const r = await send("PA_SEND_SEGMENT", { n, b64, name: `poliwag_seg_${n}.wav`, waitMs });
      if (!r?.ok) throw new Error(r?.error || "?");
      segAudioMark = { n, max: (task()?.audios || []).reduce((m, a) => Math.max(m, a.n), -1) };
      setNote("chat-note", t_("sendDone", { n }), "green");
      return true;
    } catch (err) {
      setNote("chat-note", t_("sendFail") + (err?.message || err), "redish");
      toast(t_("sendFail") + (err?.message || err), "err", 9000);
      lastSendError = String(err?.message || err);
      return false;
    } finally {
      sendBusy = false; renderSendBtn();
    }
  }

  async function loadChannel(channel, needEnd) {
    const files = await audioSources(needEnd);
    const multi = files.filter((f) => f.chans.length > channel);
    if (multi.length) {
      const best = multi.reduce((a, b) => (b.duration > a.duration ? b : a));
      return { data: best.chans[channel], rate: best.rate, duration: best.duration };
    }
    if (files.length > channel) return { data: files[channel].chans[0], rate: files[channel].rate, duration: files[channel].duration };
    return { data: files[0].chans[0], rate: files[0].rate, duration: files[0].duration };
  }

  function segInputs(n) {
    const row = findRow(n);
    if (!row) return null;
    return {
      row,
      start: row.querySelector('input[data-field="start"]'),
      end: row.querySelector('input[data-field="end"]'),
      channel: row.querySelector('select[data-field="channel"]')
    };
  }

  // Neighbouring segments on the same channel: the search never goes into their time.
  function neighbourLimits(n, channel) {
    let lo = 0, hi = Infinity;
    const me = findRow(n);
    for (const row of allRows()) {
      if (row === me) continue;
      const ch = row.querySelector('select[data-field="channel"]')?.value ?? "0";
      if (String(ch) !== String(channel)) continue;
      const s = parseFloat(row.querySelector('input[data-field="start"]')?.value);
      const e = parseFloat(row.querySelector('input[data-field="end"]')?.value);
      if (!isFinite(s) || !isFinite(e)) continue;
      const myS = parseFloat(segInputs(n).start.value);
      if (e <= myS + 0.001 && e > lo) lo = e;
      if (s >= myS + 0.001 && s < hi) hi = s;
    }
    return { lo, hi };
  }

  /*
   * Finds where speech really starts and ends inside [from, to]:
   *  1. energy (dB) every 5 ms over 20 ms windows;
   *  2. noise floor = quiet part of the window; speech = clearly above it;
   *  3. a short click or bump (< 60 ms) is ignored — speech must last;
   *  4. the edges are then extended while the sound is still above the noise, so soft
   *     first / last sounds (s, f, breathy endings) are not cut.
   */
  function frameDb(data, rate, from, to) {
    const hop = Math.round(rate * 0.005), win = Math.round(rate * 0.02);
    const i0 = Math.max(0, Math.floor(from * rate)), i1 = Math.min(data.length, Math.ceil(to * rate));
    const db = [];
    for (let i = i0; i + win <= i1; i += hop) {
      let sum = 0;
      for (let k = i; k < i + win; k++) sum += data[k] * data[k];
      db.push(10 * Math.log10(sum / win + 1e-12));
    }
    return { db, i0, hop, win };
  }

  // The noise level is measured on a WIDE stretch of audio around the segment (it contains real
  // silences), so it does not change when the segment gets tighter: pressing again gives the same result.
  function detectSpeech(data, rate, from, to, ctxFrom, ctxTo) {
    const { db, i0, hop, win } = frameDb(data, rate, from, to);
    if (db.length < 10) return null;
    const ctx = frameDb(data, rate, ctxFrom, ctxTo).db;
    const ctxSorted = (ctx.length >= db.length ? ctx : db).slice().sort((a, b) => a - b);
    const noise = ctxSorted[Math.floor(ctxSorted.length * 0.1)];
    const sorted = db.slice().sort((a, b) => a - b);
    const peak = sorted[Math.floor(sorted.length * 0.98)];
    if (peak - noise < 8) return null; // no clear speech in this segment
    const on = Math.max(noise + 0.35 * (peak - noise), peak - 35);
    const soft = noise + Math.min(10, 0.2 * (peak - noise));
    const MIN_RUN = 12; // 12 × 5 ms = 60 ms of continuous sound

    const firstRun = (indexes) => {
      let run = 0;
      for (let j = 0; j < indexes.length; j++) {
        if (db[indexes[j]] >= on) { run++; if (run >= MIN_RUN) return indexes[j - run + 1]; }
        else run = 0;
      }
      return -1;
    };
    const fwd = db.map((_, i) => i);
    let a = firstRun(fwd);
    let b = firstRun(fwd.slice().reverse());
    if (a < 0 || b < 0 || b < a) return null;
    let back = 0;
    while (a > 0 && db[a - 1] >= soft && back < 30) { a--; back++; }
    let fwdN = 0;
    while (b < db.length - 1 && db[b + 1] >= soft && fwdN < 50) { b++; fwdN++; }
    const t = (i) => (i0 + i * hop) / rate;
    return { start: t(a), end: t(b) + win / rate, noise, peak };
  }

  // Équilibrer with your own noise line: sound = frames whose peak goes above the line.
  function detectByLevel(data, rate, from, to, level) {
    const hop = Math.round(rate * 0.005), win = Math.round(rate * 0.02);
    const i0 = Math.max(0, Math.floor(from * rate)), i1 = Math.min(data.length, Math.ceil(to * rate));
    const pk = [];
    for (let i = i0; i + win <= i1; i += hop) {
      let m = 0;
      for (let j = i; j < i + win; j++) { const v = Math.abs(data[j]); if (v > m) m = v; }
      pk.push(m);
    }
    const MIN_RUN = 8; // 8 × 5 ms = 40 ms above the line
    const firstRun = (idx) => { let run = 0; for (let j = 0; j < idx.length; j++) { if (pk[idx[j]] >= level) { run++; if (run >= MIN_RUN) return idx[j - run + 1]; } else run = 0; } return -1; };
    const fwd = pk.map((_, i) => i);
    const a = firstRun(fwd), bb = firstRun(fwd.slice().reverse());
    if (a < 0 || bb < 0 || bb < a) return null;
    return { start: (i0 + a * hop) / rate, end: (i0 + bb * hop + win) / rate };
  }

  function writeTime(input, value) {
    const win = input.ownerDocument.defaultView || window;
    const setter = Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, "value").set;
    setter.call(input, value);
    input.dispatchEvent(new win.Event("input", { bubbles: true }));
    input.dispatchEvent(new win.Event("change", { bubbles: true }));
    input.dispatchEvent(new win.FocusEvent("blur"));
    return input.value === value;
  }

  // ------------------------------------------------------------------ Play / Pause the selected segment
  // Plays the segment's own channel, from its start to its end (reads the same audio file as Équilibrer).
  const player = { ctx: null, src: null, n: null, from: 0, to: 0, offset: 0, startedAt: 0, playing: false };

  // Playback speed. At 1× the segment plays in Maven's own player; at another speed it plays here,
  // with the pitch kept natural (no chipmunk / slow-motion voice).
  const SPEEDS = [0.5, 0.6, 0.7, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2];
  let speed = 1;
  try { chrome.storage.local.get("pa_speed").then((r) => { if (SPEEDS.includes(r?.pa_speed)) { speed = r.pa_speed; renderSpeed(); } }); } catch {}
  // Maven's own speed menu: when it exists, the bar uses it, so Maven's player plays at that speed.
  function mavenRateSelect() {
    for (const d of allDocs()) { const s = d.querySelector('select[data-action="playback-rate"]'); if (s) return s; }
    return null;
  }
  function speedList() {
    const sel = mavenRateSelect();
    const l = sel ? [...sel.options].map((o) => parseFloat(o.value)).filter(isFinite).sort((a, c) => a - c) : [];
    return l.length ? l : SPEEDS;
  }
  function writeRate(value) {
    const sel = mavenRateSelect();
    if (!sel) return false;
    const opt = [...sel.options].find((o) => parseFloat(o.value) === value);
    if (!opt) return false;
    if (sel.value === opt.value) return true;
    const win = sel.ownerDocument.defaultView || window;
    Object.getOwnPropertyDescriptor(win.HTMLSelectElement.prototype, "value").set.call(sel, opt.value);
    sel.dispatchEvent(new win.Event("input", { bubbles: true }));
    sel.dispatchEvent(new win.Event("change", { bubbles: true }));
    return true;
  }
  function renderSpeed() {
    const sel = mavenRateSelect();
    if (sel && isFinite(parseFloat(sel.value))) speed = parseFloat(sel.value); // always show Maven's real speed
    const list = speedList();
    $("spd-val").textContent = speed.toFixed(2) + "×";
    $("spd-down").disabled = speed <= list[0];
    $("spd-up").disabled = speed >= list[list.length - 1];
    $("spd-val").style.color = speed === 1 ? "" : "#EAB308";
  }
  function changeSpeed(dir) {
    const list = speedList();
    let i = list.indexOf(speed);
    if (i < 0) i = list.findIndex((v) => v >= speed);
    speed = list[Math.min(list.length - 1, Math.max(0, i + dir))];
    if (mavenRateSelect()) {
      // Maven's player follows its own menu; keep the time already played for the white line
      const now = performance.now();
      if (mavenPlayFrom) { mavenPlayFrom.from += ((now - mavenPlayFrom.t0) / 1000) * (mavenPlayFrom.rate || 1); mavenPlayFrom.t0 = now; mavenPlayFrom.rate = speed; }
      writeRate(speed);
    }
    try { chrome.storage.local.set({ pa_speed: speed }); } catch {}
    if (player.el) player.el.playbackRate = speed;
    renderSpeed();
  }
  function wavBlob(data, rate) {
    const n = data.length, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true);
    v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true);
    v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) { const x = Math.max(-1, Math.min(1, data[i])); v.setInt16(44 + i * 2, x < 0 ? x * 0x8000 : x * 0x7fff, true); }
    return new Blob([buf], { type: "audio/wav" });
  }
  function stopEl() {
    if (player.el) { try { player.el.pause(); } catch {} if (player.elUrl) URL.revokeObjectURL(player.elUrl); }
    player.el = null; player.elUrl = null; player.elPlaying = false;
  }
  async function playAtSpeed() { return playLocal(null); }
  // Plays the segment here (not in Maven), from a chosen point, at the speed shown in Vitesse.
  async function playLocal(fromT) {
    const f = segInputs(currentN);
    const s0 = parseFloat(f?.start?.value), e0 = parseFloat(f?.end?.value);
    if (!f || !isFinite(s0) || !isFinite(e0) || e0 <= s0) return toast(t_("timeBad"), "err");
    // Maven's player must not play at the same time
    const mb = mavenPlayBtn(currentN);
    if (mb && (mavenIsPlaying(mb) || mavenAssumedPlaying)) { mb.click(); mavenAssumedPlaying = false; mavenPlayFrom = null; }
    stopSource(); player.playing = false;
    try {
      const lvl = (await filterLevel(currentN)) ?? null;
      const same = player.el && player.n === currentN && player.from === s0 && player.to === e0 && player.lvl === lvl && !player.el.ended;
      if (!same) {
        stopEl();
        let { blob } = await segmentWav(currentN);
        if (lvl != null) blob = await gateWav(blob, lvl);
        player.lvl = lvl;
        const url = URL.createObjectURL(blob);
        const el = new Audio(url);
        el.preservesPitch = true;
        el.onended = () => { if (player.el === el) { player.elPlaying = false; renderPlayer(); } };
        Object.assign(player, { el, elUrl: url, n: currentN, from: s0, to: e0 });
      }
      if (fromT != null && isFinite(fromT)) player.el.currentTime = Math.max(0, Math.min(e0 - s0 - 0.01, fromT - s0));
      player.el.playbackRate = speed;
      // Chrome can keep play() waiting (e.g. while this tab is in the background): never wait more than 3 s
      const started = await Promise.race([
        player.el.play().then(() => true, (e) => { throw e; }),
        new Promise((res) => setTimeout(() => res(false), 2000))
      ]);
      if (!started) {
        try { player.el.pause(); } catch {}
        player.elPlaying = false;
        renderPlayer();
        // the page did not let the extension play: use Maven's own ▶ instead (sound without the filter)
        if (fromT == null && playMaven()) return true;
        toast(t_("playBlocked"), "warn", 5000);
        return false;
      }
      player.elPlaying = true;
      renderPlayer();
      return true;
    } catch (err) {
      player.elPlaying = false;
      if (fromT == null && playMaven()) return true; // fall back to Maven's own ▶
      toast(t_("timeErr") + (err?.message || err), "err", 5000);
      return false;
    }
  }

  function stopSource() {
    if (player.src) { try { player.src.onended = null; player.src.stop(); } catch {} player.src = null; }
  }

  const ICON_PLAY = '<svg width="13" height="13" viewBox="0 0 20 20" aria-hidden="true"><path d="M6.3 3.6a1 1 0 011.52-.85l9 5.4a1 1 0 010 1.7l-9 5.4A1 1 0 016.3 14.4V3.6z" fill="currentColor"/></svg>';
  const ICON_PAUSE = '<svg width="13" height="13" viewBox="0 0 20 20" aria-hidden="true"><rect x="5" y="4" width="3.5" height="12" rx="1" fill="currentColor"/><rect x="11.5" y="4" width="3.5" height="12" rx="1" fill="currentColor"/></svg>';
  let lastPlayingShown = null;

  function isPlayingNow() {
    const mb = currentN === null ? null : mavenPlayBtn(currentN);
    if (player.elPlaying) return true;
    return mb ? (mavenIsPlaying(mb) || mavenAssumedPlaying) : player.playing;
  }

  function togglePlay() {
    if (isPlayingNow()) pauseSegment();
    else playSegment();
  }

  function renderPlayer() {
    const mb = currentN === null ? null : mavenPlayBtn(currentN);
    let playing = player.playing;
    if (mb) {
      const detected = mavenIsPlaying(mb);
      // If Maven shows its state, follow it; otherwise rely on what was clicked here.
      if (mb.querySelector('[class*="pause"]') || mb.getAttribute("aria-pressed") !== null || /pause/i.test(mb.getAttribute("aria-label") || "")) mavenAssumedPlaying = detected;
      playing = detected || mavenAssumedPlaying;
    }
    playing = playing || !!player.elPlaying;
    const b = $("btn-play");
    b.classList.toggle("on", playing);
    b.disabled = currentN === null;
    if (playing && playBlinkFor === currentN) playBlinkFor = null;
    // In Auto: no blink while it waits; it blinks only while Auto plays the segment (the play command).
    b.classList.toggle("blinkb", autoRun ? playing : (!playing && currentN !== null && playBlinkFor === currentN));
    if (playing !== lastPlayingShown) {
      b.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
      b.setAttribute("aria-label", playing ? t_("pause") : t_("play"));
      b.title = playing ? t_("pause") : t_("play");
      lastPlayingShown = playing;
    }
  }

  // ---- Maven's own player: the ▶ button of the segment row toggles Play / Pause.
  function mavenPlayBtn(n) {
    const row = findRow(n);
    return row ? row.querySelector('button[data-action="play"], button.pw-seg-play') : null;
  }
  function mavenIsPlaying(btn) {
    if (!btn) return false;
    const label = (btn.getAttribute("aria-label") || "") + " " + (btn.title || "");
    if (btn.getAttribute("aria-pressed") === "true") return true;
    if (/\bpause\b/i.test(btn.getAttribute("aria-label") || "")) return true;
    if (btn.querySelector('[class*="pause"]')) return true;
    if (/is-playing|playing/.test(btn.className + " " + (btn.closest("tr")?.className || ""))) return true;
    return false;
  }
  let mavenAssumedPlaying = false;
  let playGuess = null;

  // Maven's own ▶ (its player, at the speed of its menu)
  function playMaven() {
    const mb = mavenPlayBtn(currentN);
    if (!mb) return false;
    if (!mavenIsPlaying(mb)) mb.click();
    mavenAssumedPlaying = true;
    const f = segInputs(currentN);
    const st = parseFloat(f?.start?.value) || 0;
    mavenPlayFrom = { t0: performance.now(), from: st, rate: speed };
    const dur = parseFloat(f?.end?.value) - st;
    clearTimeout(playGuess);
    playGuess = setTimeout(() => { mavenAssumedPlaying = false; renderPlayer(); }, (isFinite(dur) && dur > 0 ? dur : 10) * 1000 / (speed || 1) + 800);
    renderPlayer();
    return true;
  }

  async function playSegment() {
    if (currentN === null) return toast(t_("e_noNum"), "err");
    {
      const f0 = segInputs(currentN), st0 = parseFloat(f0?.start?.value);
      // the white line was moved (or paused) inside the segment: play from there
      if (head.n === currentN && head.rest != null && isFinite(st0) && head.rest > st0 + 0.02) return playLocal(head.rest);
      return playLocal(null); // always the filtered sound (noise removed: your line, or the automatic one)
    }
    if (speed !== 1 && !mavenRateSelect()) return playAtSpeed(); // no speed menu in Maven: play here
    const mb = mavenPlayBtn(currentN);
    if (mb) {
      if (!mavenIsPlaying(mb)) mb.click();
      mavenAssumedPlaying = true;
      // Maven goes on from where it was paused, else from the start of the segment.
      const f = segInputs(currentN);
      const st = parseFloat(f?.start?.value) || 0;
      const from = head.n === currentN && head.rest != null ? head.rest : st;
      mavenPlayFrom = { t0: performance.now(), from, rate: speed };
      // If Maven does not show its state, stop assuming "playing" once the segment has had time to end.
      const dur = parseFloat(f?.end?.value) - from;
      clearTimeout(playGuess);
      playGuess = setTimeout(() => { mavenAssumedPlaying = false; renderPlayer(); }, (isFinite(dur) && dur > 0 ? dur : 10) * 1000 / (speed || 1) + 800);
      renderPlayer();
      return;
    }
    const f = segInputs(currentN);
    const s0 = parseFloat(f?.start?.value), e0 = parseFloat(f?.end?.value);
    if (!f || !isFinite(s0) || !isFinite(e0) || e0 <= s0) return toast(t_("timeBad"), "err");
    try {
      const audio = await loadChannel(Number(f.channel?.value || 0), e0);
      // Resume where it was paused if it is the same segment with the same times; else from the start.
      const same = player.n === currentN && player.from === s0 && player.to === e0 && player.offset > 0 && player.offset < e0 - s0;
      const offset = same ? player.offset : 0;
      stopSource();
      if (!player.ctx) player.ctx = new AudioContext();
      if (player.ctx.state === "suspended") await player.ctx.resume();
      const i0 = Math.floor(s0 * audio.rate), i1 = Math.min(audio.data.length, Math.ceil(e0 * audio.rate));
      const buf = player.ctx.createBuffer(1, Math.max(1, i1 - i0), audio.rate);
      buf.copyToChannel(audio.data.subarray(i0, i1), 0);
      const src = player.ctx.createBufferSource();
      src.buffer = buf;
      src.connect(player.ctx.destination);
      src.onended = () => { if (player.src === src) { player.src = null; player.playing = false; player.offset = 0; renderPlayer(); } };
      src.start(0, offset);
      Object.assign(player, { src, n: currentN, from: s0, to: e0, offset, startedAt: player.ctx.currentTime, playing: true });
      renderPlayer();
    } catch (err) {
      toast(t_("timeErr") + (err?.message || err), "err", 5000);
    }
  }

  function pauseSegment() {
    if (player.elPlaying) { player.el.pause(); player.elPlaying = false; renderPlayer(); return; }
    const mb = currentN === null ? null : mavenPlayBtn(currentN);
    if (mb) {
      if (mavenIsPlaying(mb) || mavenAssumedPlaying) mb.click();
      mavenAssumedPlaying = false;
      mavenPlayFrom = null;
      clearTimeout(playGuess);
      renderPlayer();
      return;
    }
    if (!player.playing) return;
    player.offset += player.ctx.currentTime - player.startedAt;
    player.playing = false;
    stopSource();
    renderPlayer();
  }

  // ------------------------------------------------------------------ original times
  // The start / end a segment has the first time you open it are remembered (per Maven page),
  // so ↶ can always put them back, also after Équilibrer, a manual change or F5.
  const ORIG_KEY = "pa_origTimes";
  let origStore = {};
  try { chrome.storage.local.get(ORIG_KEY).then((r) => { origStore = { ...origStore, ...(r?.[ORIG_KEY] || {}) }; renderTime(); }); } catch {}
  const origKey = (n) => location.pathname + "|" + n;
  function rememberOrig(n) {
    const f = segInputs(n);
    if (!f?.start || !f?.end) return;
    const k = origKey(n);
    if (origStore[k]) return;
    const s = parseFloat(f.start.value), e = parseFloat(f.end.value);
    if (!isFinite(s) || !isFinite(e) || e <= s) return;
    origStore[k] = [f.start.value, f.end.value, Date.now()];
    const keys = Object.keys(origStore);
    if (keys.length > 3000) keys.sort((a, c) => origStore[a][2] - origStore[c][2]).slice(0, keys.length - 3000).forEach((x) => delete origStore[x]);
    try { chrome.storage.local.set({ [ORIG_KEY]: origStore }); } catch {}
  }
  const getOrig = (n) => origStore[origKey(n)] || null;

  // ------------------------------------------------------------------ zoomed waveform of the selected segment
  // Only this segment (plus a margin) of its own channel. The yellow start / end lines can be
  // dragged: on release the new times are written into Maven. While playing, a white line follows the audio.
  const wv = { key: null, errAt: 0, audio: null, n: null, from: 0, to: 0, base: null, drag: null, hover: null };
  const DPR = () => devicePixelRatio || 1;
  const WAVE_H = 170; // graph height (px): tall, so the filter lines are easy to see and drag

  function waveTimes() {
    const f = currentN === null ? null : segInputs(currentN);
    const s = parseFloat(f?.start?.value), e = parseFloat(f?.end?.value);
    if (!f || !isFinite(s) || !isFinite(e) || e <= s) return null;
    if (wv.drag) return { f, s: wv.drag.s, e: wv.drag.e };
    return { f, s, e };
  }

  async function renderWave(force) {
    const box = $("wave");
    const tm = waveTimes();
    if (!tm) { box.classList.add("hidden"); wv.key = null; return; }
    box.classList.remove("hidden");
    const cv = $("wave-cv");
    const w = Math.max(200, Math.round(cv.clientWidth * DPR()));
    const ch = Number(tm.f.channel?.value || 0);
    const text = segTextarea(currentN)?.value || "";
    const key = [currentN, tm.s, tm.e, ch, w, text].join("|");
    if (!force && key === wv.key && !(wv.errAt && Date.now() - wv.errAt > 15000)) return;
    wv.errAt = 0;
    wv.key = key;
    if (wv.n !== currentN || wv.ch !== ch || !wv.audio) $("wave-msg").textContent = t_("timeWorking");
    let audio;
    try { audio = await loadChannel(ch, tm.e); }
    catch (err) { $("wave-msg").textContent = t_("timeErr") + (err?.message || err); wv.errAt = Date.now(); return; }
    if (wv.key !== key) return; // another segment was chosen meanwhile
    $("wave-msg").textContent = "";
    // The view stays still for the same segment unless the times leave it (so dragging does not rescale it).
    const o = getOrig(currentN);
    const lo = Math.min(tm.s, o ? parseFloat(o[0]) : tm.s), hi = Math.max(tm.e, o ? parseFloat(o[1]) : tm.e);
    const pad = Math.min(0.6, (hi - lo) * 0.25 + 0.2);
    const keepView = wv.n === currentN && wv.ch === ch && wv.w === w && lo >= wv.from + 0.05 && hi <= wv.to - 0.05;
    if (!keepView) {
      wv.from = Math.max(0, lo - pad);
      wv.to = Math.min(audio.duration, hi + pad);
      wv.base = buildBase(audio, w);
    }
    Object.assign(wv, { audio, n: currentN, ch, w });
    wv.tags = layoutTags(text, tm.s, tm.e, audio);
    drawWave();
  }

  // The waveform itself (min / max per pixel column), computed once per view.
  function buildBase(audio, w) {
    const d = audio.data, rate = audio.rate, cols = new Float32Array(w * 2);
    let peak = 1e-4;
    for (let px = 0; px < w; px++) {
      const a = Math.floor((wv.from + (px / w) * (wv.to - wv.from)) * rate);
      const b2 = Math.max(a + 1, Math.floor((wv.from + ((px + 1) / w) * (wv.to - wv.from)) * rate));
      let mn = 0, mx = 0;
      for (let i = a; i < b2 && i < d.length; i++) { const v = d[i]; if (v < mn) mn = v; if (v > mx) mx = v; }
      cols[px * 2] = mn; cols[px * 2 + 1] = mx;
      peak = Math.max(peak, -mn, mx);
    }
    // automatic noise level: the quiet part of the view (15 % of the columns are below it), ×2
    const amp = [];
    for (let px = 0; px < w; px++) amp.push(Math.max(-cols[px * 2], cols[px * 2 + 1]));
    amp.sort((a, c) => a - c);
    const autoLevel = Math.min(peak * 0.9, Math.max(peak * 0.02, (amp[Math.floor(amp.length * 0.15)] || 0) * 2));
    const ref = Math.max(autoLevel * 1.6, amp[Math.floor(amp.length * 0.95)] || peak);
    return { cols, peak: Math.min(peak, ref), autoLevel };
  }

  // Where the [tags] of the text fall in the segment. Maven keeps no time for a tag, so this is an
  // estimate: words and tags are spread over the parts of the segment where there is sound,
  // each word by its length, each tag as a short sound (about half a second).
  const TAG_RE = /^\[[a-z_]+\]$/i;
  function layoutTags(text, s, e, audio) {
    return layoutTokens(text, s, e, audio, true).filter((x) => x.isTag).map((x) => ({ tag: x.text.toLowerCase(), t1: x.t1, t2: x.t2 }));
  }
  function layoutTokens(text, s, e, audio, tagsOnly) {
    const toks = [...text.matchAll(/\[[a-z_]+\]|[^\s\[\]]+|[\[\]]/gi)].map((m) => ({ text: m[0], at: m.index, isTag: TAG_RE.test(m[0]) }));
    const tokens = toks.map((x) => x.text);
    if (!tokens.length || (tagsOnly && !toks.some((x) => x.isTag)) || e - s < 0.1) return [];
    // sound activity every 10 ms inside the segment
    const rate = audio.rate, step = Math.max(1, Math.round(rate * 0.01));
    const i0 = Math.floor(s * rate), i1 = Math.min(audio.data.length, Math.ceil(e * rate));
    const db = [];
    for (let i = i0; i < i1; i += step) {
      let sum = 0, m = 0;
      for (let j = i; j < Math.min(i + step, i1); j++) { sum += audio.data[j] * audio.data[j]; m++; }
      db.push(10 * Math.log10(sum / Math.max(1, m) + 1e-12));
    }
    const sorted = [...db].sort((a, c) => a - c);
    const floor = sorted[Math.floor(sorted.length * 0.1)] ?? -100;
    const wgt = db.map((v) => (v > floor + 10 ? 1 : 0.12));
    const cum = [0];
    for (const v of wgt) cum.push(cum[cum.length - 1] + v);
    const total = cum[cum.length - 1] || 1;
    const atFrac = (f) => { // fraction of the sound -> time
      const target = f * total;
      let lo = 0, hi = cum.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < target) lo = mid + 1; else hi = mid; }
      return Math.min(e, s + (lo * step) / rate);
    };
    // weights: a word by its letters, a tag like half a second of speech (about 7 letters)
    const wOf = (x) => (TAG_RE.test(x) ? 7 : Math.max(1, x.replace(/[^\p{L}\p{N}]/gu, "").length) + 1);
    const sumW = tokens.reduce((a, x) => a + wOf(x), 0);
    let acc = 0;
    for (const x of toks) {
      const w = wOf(x.text);
      x.t1 = atFrac(acc / sumW); x.t2 = atFrac((acc + w) / sumW);
      acc += w;
    }
    return toks;
  }

  // While a segment plays, the word being read is marked in yellow in Trans Poliwag (estimated timing).
  let kar = { key: null, toks: [], idx: -2 };
  const escHtml = (x) => x.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
  function karaoke(t) {
    const box = $("pw-box"), hl = $("pw-hl"), wrap = box.parentElement;
    const tm = waveTimes();
    if (t == null || !tm || !wv.audio || wv.n !== currentN) {
      if (kar.idx !== -2) { hl.innerHTML = ""; wrap.classList.remove("reading"); kar.idx = -2; }
      return;
    }
    const text = box.value;
    const key = [currentN, tm.s, tm.e, text].join("|");
    if (key !== kar.key) { kar = { key, toks: layoutTokens(text, tm.s, tm.e, wv.audio, false), idx: -2 }; }
    let idx = -1;
    for (let i = 0; i < kar.toks.length; i++) if (t >= kar.toks[i].t1 && t < kar.toks[i].t2) { idx = i; break; }
    if (idx === -1 && kar.toks.length && t >= kar.toks[kar.toks.length - 1].t2 - 0.001) idx = kar.toks.length - 1;
    if (idx === kar.idx) return;
    kar.idx = idx;
    wrap.classList.add("reading");
    if (idx < 0) { hl.innerHTML = ""; return; }
    const w = kar.toks[idx];
    hl.innerHTML = escHtml(text.slice(0, w.at)) + "<mark>" + escHtml(w.text) + "</mark>" + escHtml(text.slice(w.at + w.text.length)) + "\n";
    hl.scrollTop = box.scrollTop;
  }

  const tx = (t) => ((t - wv.from) / (wv.to - wv.from)) * wv.w;
  const xt = (x) => wv.from + (x / wv.w) * (wv.to - wv.from);

  function drawWave(playT = lastHead) { // without a time: keep the white line where it is
    const tm = waveTimes();
    if (!tm || !wv.base) return;
    const k = DPR(), w = wv.w, h = Math.round(WAVE_H * k);
    const tags = wv.tags || [], strip = tags.length ? Math.round(26 * k) : 0;
    const cv = $("wave-cv");
    if (cv.width !== w || cv.height !== h + strip) { cv.width = w; cv.height = h + strip; cv.style.height = (WAVE_H + (strip ? 26 : 0)) + "px"; }
    const g = cv.getContext("2d"), mid = h / 2, { s, e } = tm;
    g.fillStyle = "#151517"; g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(122,28,56,.20)"; g.fillRect(tx(s), 0, tx(e) - tx(s), h);
    const scale = (mid - 8 * k) / wv.base.peak, cols = wv.base.cols;
    const xs = tx(s), xe = tx(e);
    const lvl = noiseLevel();
    for (let px = 0; px < w; px++) {
      const quiet = Math.max(-cols[px * 2], cols[px * 2 + 1]) < lvl; // under the filter line = noise
      g.fillStyle = px >= xs && px <= xe ? (quiet ? "#7A5562" : "#F2B3C4") : "#52525B";
      const y1 = Math.max(2 * k, mid - cols[px * 2 + 1] * scale), y2 = Math.min(h - 2 * k, mid - cols[px * 2] * scale);
      g.fillRect(px, y1, 1, Math.max(1, y2 - y1));
    }
    // noise filter band: two green lines (+ / − level), dragged up or down; inside the band = noise
    {
      const yt = mid - lvl * scale, manual = levelMap.has(LEVEL_KEY);
      g.fillStyle = "rgba(255,255,255,.05)"; g.fillRect(0, yt, w, mid - yt); // the waveform is symmetric: one line is enough
      g.strokeStyle = wv.hoverBand || wv.band ? "#FFFFFF" : "rgba(255,255,255,.8)";
      g.lineWidth = (wv.hoverBand || wv.band ? 2 : 1.3) * k;
      g.setLineDash(manual ? [] : [6 * k, 4 * k]);
      g.beginPath(); g.moveTo(0, yt); g.lineTo(w, yt); g.stroke();
      g.setLineDash([]);
      g.fillStyle = "#FFFFFF"; g.font = `bold ${10 * k}px Consolas, monospace`;
      const db = 20 * Math.log10(Math.max(1e-6, lvl));
      const lab = (manual ? t_("bandManual") : t_("bandAuto")) + " " + db.toFixed(1) + " dB";
      g.fillText(lab, w - g.measureText(lab).width - 6 * k, Math.max(11 * k, yt - 4 * k));
    }
    // original times (thin dashed grey) when they differ
    const o = getOrig(currentN);
    if (o && (Math.abs(parseFloat(o[0]) - s) > 0.004 || Math.abs(parseFloat(o[1]) - e) > 0.004)) {
      g.strokeStyle = "rgba(161,161,170,.7)"; g.lineWidth = k; g.setLineDash([4 * k, 4 * k]);
      for (const t of [parseFloat(o[0]), parseFloat(o[1])]) { g.beginPath(); g.moveTo(tx(t), 0); g.lineTo(tx(t), h); g.stroke(); }
      g.setLineDash([]);
    }
    // ticks
    const step = wv.to - wv.from > 8 ? 1 : 0.5;
    g.fillStyle = "#A1A1AA"; g.font = `${11 * k}px Consolas, monospace`;
    for (let t = Math.ceil(wv.from / step) * step; t <= wv.to; t += step) {
      g.fillRect(tx(t), h - 6 * k, k, 6 * k);
      g.fillText(t.toFixed(1), tx(t) + 3 * k, h - 4 * k);
    }
    // start / end lines with grips (draggable)
    for (const [which, t] of [["s", s], ["e", e]]) {
      const x = tx(t), hot = wv.hover === which || wv.drag?.which === which;
      g.fillStyle = "#EAB308";
      g.fillRect(x - (hot ? 1.5 : 1) * k, 0, (hot ? 3 : 2) * k, h);
      const gw = 10 * k, gh = 22 * k;
      g.beginPath(); g.roundRect ? g.roundRect(x - gw / 2, mid - gh / 2, gw, gh, 3 * k) : g.rect(x - gw / 2, mid - gh / 2, gw, gh); g.fill();
      g.fillStyle = "#151517";
      for (const dy of [-4, 0, 4]) g.fillRect(x - 2.5 * k, mid + dy * k - 0.5 * k, 5 * k, k);
    }
    g.fillStyle = "#EAB308"; g.font = `bold ${11 * k}px Consolas, monospace`;
    const lab = (txt, x) => { // label on a dark plate, readable over the waveform
      const tw = g.measureText(txt).width;
      g.fillStyle = "rgba(21,21,23,.85)"; g.fillRect(x - 3 * k, 2 * k, tw + 6 * k, 15 * k);
      g.fillStyle = "#EAB308"; g.fillText(txt, x, 13 * k);
    };
    lab(s.toFixed(2), tx(s) + 7 * k);
    const el = e.toFixed(2);
    lab(el, tx(e) - g.measureText(el).width - 7 * k);
    // yellow tag strip under the waveform (estimated place of each [tag])
    if (strip) {
      g.fillStyle = "#101012"; g.fillRect(0, h, w, strip);
      g.fillStyle = "#2A2A30"; g.fillRect(0, h, w, k);
      for (const tg of tags) {
        const x1 = tx(tg.t1), x2 = Math.max(x1 + 6 * k, tx(tg.t2));
        g.fillStyle = "rgba(234,179,8,.13)"; g.fillRect(x1, 0, x2 - x1, h);
        g.fillStyle = "#EAB308";
        g.beginPath(); g.roundRect ? g.roundRect(x1, h + 4 * k, x2 - x1, strip - 8 * k, 4 * k) : g.rect(x1, h + 4 * k, x2 - x1, strip - 8 * k); g.fill();
        const label = `${tg.tag} ≈${tg.t1.toFixed(2)}–${tg.t2.toFixed(2)}`;
        g.font = `bold ${10.5 * k}px Consolas, monospace`;
        const lw = g.measureText(label).width;
        if (lw + 8 * k <= x2 - x1) { g.fillStyle = "#151517"; g.fillText(label, x1 + 4 * k, h + strip / 2 + 4 * k); }
        else { g.fillStyle = "#EAB308"; const lx = Math.min(x2 + 5 * k, w - lw - 2 * k); g.fillText(label, lx < x2 ? Math.max(2 * k, x1 - lw - 5 * k) : lx, h + strip / 2 + 4 * k); }
      }
    }
    // white playhead (stops at the end of the segment)
    if (playT != null) playT = Math.min(playT, e);
    if (playT != null && playT >= wv.from && playT <= wv.to) {
      g.fillStyle = "#FFFFFF";
      g.fillRect(tx(playT) - k, 0, 2 * k, h + strip);
      g.beginPath(); g.moveTo(tx(playT) - 5 * k, 0); g.lineTo(tx(playT) + 5 * k, 0); g.lineTo(tx(playT), 6 * k); g.fill();
    }
  }

  // --- dragging start / end
  // Noise filter level (amplitude). Automatic until you drag the green line; then kept for this segment.
  // One filter line for all the segments of the page (it stays the same from one segment to the next, also in Auto).
  const levelMap = new Map();
  const LEVEL_KEY = "all";
  function noiseLevel() {
    const m = levelMap.get(LEVEL_KEY);
    return m != null ? m : (wv.base?.autoLevel || 0);
  }
  function bandAt(clientY) {
    if (!wv.base) return false;
    const r = $("wave-cv").getBoundingClientRect(), k = DPR();
    const y = (clientY - r.top) * k, mid = Math.round(WAVE_H * k) / 2;
    const scale = (mid - 8 * k) / wv.base.peak, lvl = noiseLevel();
    return Math.abs(y - (mid - lvl * scale)) <= 6 * k;
  }
  function bandSet(clientY) {
    const r = $("wave-cv").getBoundingClientRect(), k = DPR();
    const y = (clientY - r.top) * k, mid = Math.round(WAVE_H * k) / 2;
    const scale = (mid - 8 * k) / wv.base.peak;
    const lvl = Math.min(wv.base.peak * 0.98, Math.max(wv.base.peak * 0.005, (mid - y) / scale));
    levelMap.set(LEVEL_KEY, lvl);
    drawWave();
  }

  function edgeAt(clientX) {
    const tm = waveTimes();
    if (!tm || !wv.base) return null;
    const r = $("wave-cv").getBoundingClientRect();
    const x = (clientX - r.left) * (wv.w / r.width);
    const ds = Math.abs(x - tx(tm.s)), de = Math.abs(x - tx(tm.e)), lim = 9 * DPR();
    if (ds > lim && de > lim) return null;
    return ds <= de ? "s" : "e";
  }
  // Click or drag anywhere else on the graph: moves the white line (where the audio plays from).
  function seekTo(clientX) {
    const tm = waveTimes();
    if (!tm) return null;
    const r = $("wave-cv").getBoundingClientRect();
    const t = Math.min(tm.e - 0.01, Math.max(tm.s, xt((clientX - r.left) * (wv.w / r.width))));
    head = { n: currentN, rest: t, last: null, endAt: 0 };
    lastHead = t;
    drawWave(t);
    return t;
  }
  function waveDown(ev) {
    const which = edgeAt(ev.clientX);
    const tm = waveTimes();
    if (!tm || timeBusy || !wv.base) return;
    if (!which && bandAt(ev.clientY)) {
      ev.preventDefault();
      $("wave-cv").setPointerCapture(ev.pointerId);
      wv.band = true;
      bandSet(ev.clientY);
      return;
    }
    if (!which) {
      ev.preventDefault();
      $("wave-cv").setPointerCapture(ev.pointerId);
      const wasPlaying = isPlayingNow();
      if (wasPlaying) pauseSegment();
      wv.seek = { wasPlaying };
      seekTo(ev.clientX);
      return;
    }
    ev.preventDefault();
    $("wave-cv").setPointerCapture(ev.pointerId);
    const lim = neighbourLimits(currentN, tm.f.channel?.value ?? "0");
    wv.drag = { which, s: tm.s, e: tm.e, lo: Math.max(0, lim.lo), hi: Math.min(lim.hi, wv.audio?.duration ?? Infinity) };
    drawWave(playheadTime());
  }
  function waveMove(ev) {
    const cv = $("wave-cv");
    if (wv.seek) { seekTo(ev.clientX); return; }
    if (wv.band) { bandSet(ev.clientY); return; }
    if (!wv.drag) {
      const h = edgeAt(ev.clientX);
      const hb = !h && bandAt(ev.clientY);
      if (h !== wv.hover || hb !== !!wv.hoverBand) {
        wv.hover = h; wv.hoverBand = hb;
        cv.style.cursor = h ? "ew-resize" : hb ? "ns-resize" : "pointer";
        drawWave();
      }
      return;
    }
    const r = cv.getBoundingClientRect();
    let t = Math.round(xt((ev.clientX - r.left) * (wv.w / r.width)) * 100) / 100;
    const d = wv.drag;
    if (d.which === "s") d.s = Math.min(Math.max(t, d.lo, wv.from), d.e - 0.05);
    else d.e = Math.max(Math.min(t, d.hi, wv.to), d.s + 0.05);
    $("time-start").textContent = d.s.toFixed(2);
    $("time-end").textContent = d.e.toFixed(2);
    drawWave(playheadTime());
  }
  function waveUp() {
    if (wv.band) {
      wv.band = false;
      if (player.elPlaying || isPlayingNow()) { const t = playheadTime(); pauseSegment(); playLocal(t); }
      timeNoteFor = currentN;
      setNote("time-note", t_("bandSet"), "green");
      drawWave();
      return;
    }
    if (wv.seek) {
      const go = wv.seek.wasPlaying;
      wv.seek = null;
      if (go && head.rest != null) playLocal(head.rest); // it was playing: go on from the new point
      return;
    }
    const d = wv.drag;
    if (!d) return;
    wv.drag = null;
    const f = currentN === null ? null : segInputs(currentN);
    if (f?.start && f?.end) {
      rememberOrig(currentN);
      const ns = d.s.toFixed(2), ne = d.e.toFixed(2);
      let ok = true;
      if (ns !== f.start.value) ok = writeTime(f.start, ns) && ok;
      if (ne !== f.end.value) ok = writeTime(f.end, ne) && ok;
      timeNoteFor = currentN;
      setNote("time-note", ok ? t_("timeManual", { s: ns, e: ne }) : t_("timeFail"), ok ? "green" : "redish");
    }
    renderTime();
  }

  // --- playhead: from the extension's own player, else Maven's waveform cursor, else the time since ▶
  let mavenPlayFrom = null; // {t0, from}
  function mavenCursorTime() {
    const dur = wv.audio?.duration;
    if (!dur) return null;
    for (const d of allDocs()) {
      for (const host of d.querySelectorAll(".pw-lane-wave *")) {
        const c = host.shadowRoot?.querySelector('[part~="cursor"]');
        if (!c) continue;
        const left = parseFloat(c.style.left);
        if (isFinite(left) && /%/.test(c.style.left)) return (left / 100) * dur;
      }
    }
    return null;
  }
  function playheadTime() {
    if (player.elPlaying && player.el && player.n === currentN) return player.from + player.el.currentTime;
    if (player.playing && player.ctx && player.n === currentN) return player.from + player.offset + (player.ctx.currentTime - player.startedAt);
    if (!mavenAssumedPlaying && !(currentN !== null && mavenIsPlaying(mavenPlayBtn(currentN)))) return null;
    const c = mavenCursorTime();
    const end = waveTimes()?.e ?? Infinity;
    if (c != null && c >= wv.from && c <= wv.to) return Math.min(c, end);
    if (mavenPlayFrom) return Math.min(end, mavenPlayFrom.from + ((performance.now() - mavenPlayFrom.t0) / 1000) * (mavenPlayFrom.rate || 1));
    return null;
  }
  let lastHead = null, head = { n: null, rest: null, last: null };
  (function headLoop() {
    try {
      if (wv.base && !$("wave").classList.contains("hidden")) {
        const t = playheadTime();
        // The white line is always shown: it starts at the segment start, follows the audio while playing,
        // stays where you paused, and goes back to the start when the segment has finished.
        const tm = waveTimes();
        if (head.n !== currentN) head = { n: currentN, rest: null, last: null };
        let shown = t;
        // reached the end: after a short moment it counts as finished (back to the start)
        if (t != null && tm && t >= tm.e - 0.02) {
          head.endAt = head.endAt || performance.now();
          if (performance.now() - head.endAt > 400) { head.last = null; head.rest = null; shown = null; }
          else head.last = t;
        } else if (t != null) { head.last = t; head.endAt = 0; }
        else if (head.last != null) {
          head.rest = head.last >= (tm?.e ?? Infinity) - 0.06 ? null : head.last; // finished -> back to start
          head.last = null;
        }
        if (shown == null) {
          if (head.rest != null && tm && (head.rest < tm.s || head.rest > tm.e)) head.rest = null;
          shown = head.rest ?? tm?.s ?? null;
        }
        if (shown !== lastHead) { lastHead = shown; drawWave(shown); }
        karaoke(t != null ? Math.min(t, tm?.e ?? t) : null);
      } else karaoke(null);
    } catch {}
    requestAnimationFrame(headLoop);
  })();

  function renderTime() {
    const f = currentN === null ? null : segInputs(currentN);
    $("time-start").textContent = f?.start?.value || "—";
    $("time-end").textContent = f?.end?.value || "—";
    $("btn-eq").disabled = !f || !f.start || !f.end || timeBusy;
    if (f && currentN !== null) rememberOrig(currentN);
    const o = f ? getOrig(currentN) : null;
    const canUndo = !!o && !timeBusy && !wv.drag && (Math.abs(parseFloat(o[0]) - parseFloat(f.start?.value)) > 0.004 || Math.abs(parseFloat(o[1]) - parseFloat(f.end?.value)) > 0.004);
    $("btn-eq-undo").disabled = !canUndo;
    $("btn-eq-undo").title = o ? t_("timeUndoTip", { s: o[0], e: o[1] }) : t_("timeUndo");
    renderWave();
  }

  let timeBusy = false;
  let timeNoteFor = null;
  const origTimes = new Map(); // "taskId|n" -> {s, e, set:[s', e']} : the times before the first Équilibrer

  async function equalize() {
    if (currentN === null) return toast(t_("e_noNum"), "err");
    const n = currentN;
    const f = segInputs(n);
    if (!f || !f.start || !f.end) return toast(t_("e_segNF", { n }), "err");
    const curS = parseFloat(f.start.value), curE = parseFloat(f.end.value);
    if (!isFinite(curS) || !isFinite(curE) || curE <= curS) return toast(t_("timeBad"), "err");
    // Always search from the segment's original times, unless you changed them by hand since.
    const key = (task()?.id || "") + "|" + n;
    let orig = origTimes.get(key);
    if (!orig || orig.set[0] !== f.start.value || orig.set[1] !== f.end.value) orig = { s: curS, e: curE, str: [f.start.value, f.end.value], set: [] };
    const s0 = orig.s, e0 = orig.e;
    timeBusy = true;
    renderTime();
    setNote("time-note", t_("timeWorking"), "muted");
    try {
      const channel = Number(f.channel?.value || 0);
      const audio = await loadChannel(channel, e0 + 0.3);
      const lim = neighbourLimits(n, f.channel?.value ?? "0");
      const from = Math.max(lim.lo, s0 - 0.3, 0);
      const to = Math.min(lim.hi, e0 + 0.3, audio.duration);
      const manualLevel = levelMap.get(LEVEL_KEY);
      const found = manualLevel != null
        ? detectByLevel(audio.data, audio.rate, from, to, manualLevel)
        : detectSpeech(audio.data, audio.rate, from, to, Math.max(0, s0 - 3), Math.min(audio.duration, e0 + 3));
      if (!found) { setNote("time-note", t_("timeNoSpeech"), "redish"); return; }
      const ns = (Math.floor(Math.max(from, found.start) * 100) / 100).toFixed(2);
      const ne = (Math.ceil(Math.min(to, found.end) * 100) / 100).toFixed(2);
      if (currentN !== n) return;
      if (ns === f.start.value && ne === f.end.value) { origTimes.set(key, { s: s0, e: e0, str: orig.str, set: [ns, ne] }); setNote("time-note", t_("timeSame"), "green"); return; }
      const okS = writeTime(f.start, ns);
      const okE = writeTime(f.end, ne);
      if (!okS || !okE) { setNote("time-note", t_("timeFail"), "redish"); return; }
      timeNoteFor = n;
      origTimes.set(key, { s: s0, e: e0, str: orig.str, set: [ns, ne] });
      setNote("time-note", t_("timeDone", { s: s0.toFixed(2), e: e0.toFixed(2) }), "green");
    } catch (err) {
      setNote("time-note", t_("timeErr") + (err?.message || err), "redish");
    } finally {
      timeBusy = false;
      renderTime();
    }
  }

  // ↶ next to Équilibrer: puts back the start / end the segment had before Équilibrer.
  function undoEqualize() {
    if (currentN === null) return;
    const n = currentN, f = segInputs(n), o = getOrig(n);
    if (!f?.start || !f?.end || !o) return;
    const okS = o[0] === f.start.value || writeTime(f.start, o[0]);
    const okE = o[1] === f.end.value || writeTime(f.end, o[1]);
    timeNoteFor = n;
    if (!okS || !okE) { setNote("time-note", t_("timeFail"), "redish"); return; }
    origTimes.delete((task()?.id || "") + "|" + n);
    setNote("time-note", t_("timeRestored", { s: o[0], e: o[1] }), "green");
    renderTime();
  }

  // The buttons always show the sentiment that is really set in Maven for this segment.
  function renderSentiment() {
    const sel = currentN === null ? null : segSentimentSelect(currentN);
    sentChoice = sel && ["positive", "neutral", "negative"].includes(sel.value) ? sel.value : null;
    for (const v of ["positive", "neutral", "negative"]) $("sent-" + v).setAttribute("aria-checked", String(sentChoice === v));
    setNote("sent-note", "", "");
  }

  // ------------------------------------------------------------------ render

  function renderHeader() {
    const s = data.state;
    const t = task();
    $("task-id").textContent = t ? t.id : t_("noTask");

    const st = s?.chatgpt?.status || "disconnected";
    const clsMap = { ready: "ok", prompt_sent: "wait", opening: "wait", analysing: "wait", manual: "wait", disconnected: "err" };
    const known = st in clsMap ? st : "disconnected";
    const [cls, label] = t ? [clsMap[known], aiName() + " · " + t_("st_" + known)] : ["wait", t_("noTaskShort")];
    $("chat-pill").className = "pill " + cls;
    $("chat-pill-text").textContent = label;
    $("chat-pill").title = st === "manual" ? t_("pillManual") : st === "disconnected" ? t_("pillOffline") : (s?.chatgpt?.message || "");

    if (t) {
      const dup = t.dupCount ? t_("dupSummary", { n: t.dupCount }) : "";
      $("summary").textContent = t_("summary", { n: t.audios.length }) + dup;
    } else {
      $("summary").textContent = "—";
    }
    $("subj-badge").textContent = String(t?.subjects?.length || 0);
    $("btn-new").classList.toggle("blink", !t && !newClicked);
  }

  function renderChat({ fill = true } = {}) {
    const t = task();
    const n = currentN;
    const seg0 = t && n !== null ? t.segments[n] : null;
    // a new Gemini reply that came after this segment was chosen wins over its history
    const fresh = latestFreeAudio(t);
    const freshForThis = !!fresh && n !== null && segAudioMark.n === n && fresh.n > segAudioMark.max;
    const seg = freshForThis ? null : seg0;
    // Trans Gemini shows only a reply that came after this segment was chosen (never one of another segment)
    if (!chatOverride) chatN = seg ? (seg.audioN ?? null) : (n === null || freshForThis ? (fresh?.n ?? null) : null);
    const k = chatN;
    $("chat-no").value = n === null ? "" : String(n); // same number as Trans Poliwag
    const audio = t && k !== null ? t.audios.find((a) => a.n === k) : null;
    const box = $("chat-box");
    const showHistory = seg && !chatOverride;

    let text = "";
    // An already treated segment: Trans Gemini stays EMPTY (only the "already treated" note shows);
    // it is filled only by a new Gemini reply.
    if (showHistory) text = "";
    else if (audio) text = audio.draft ?? audio.chatText;
    if (fill) {
      if (box.value !== text) resetHistory("chat-box", text);
      box.value = text;
      dirty = false;
      autosize(box);
    }

    box.placeholder = (!box.value && machineHint.n === n && machineHint.text) ? ("نص الماكينة: " + machineHint.text) : "";
    $("chat-meta").textContent = audio ? audio.language : "";
    // Remplace blinks only for a ChatGPT reply that arrived after this segment was chosen (its reply).
    $("btn-replace").classList.toggle("blinkb", !!audio && !showHistory && n !== null && segAudioMark.n === n && audio.n > segAudioMark.max);
    const verb = { replaced: t_("verb_replaced"), kept: t_("verb_kept"), restored: t_("verb_restored") };
    if (showHistory) {
      setNote("chat-note", t_("already", { verb: verb[seg.action] || seg.action, time: hhmm(seg.at) }), "white");
    } else if (audio) {
      setNote("chat-note", "", "");
    } else if (t && t.audios.length) {
      setNote("chat-note", t_("waitNext"), "muted");
    } else {
      setNote("chat-note", "", "");
    }

    if (audio && !showHistory && audio.dupOf !== null && audio.dupOf !== undefined) {
      setNote("dup-note", t_("dupLike"), "orange");
    } else {
      setNote("dup-note", "", "");
    }
  }

  function resetHistory(id, value) {
    hist[id] = [];
    histMeta[id] = { prev: value, at: 0 };
    updateUndoBtn();
  }

  function updateUndoBtn() {
    $("btn-undo").disabled = !hist["pw-box"].length;
  }

  function renderPoliwag() {
    const t = task();
    const n = currentN;
    const box = $("pw-box");
    const setBox = (value, placeholder) => {
      box.value = value;
      box.placeholder = placeholder || "";
      box.readOnly = !!placeholder && !value;
      pwDirty = false;
      box.classList.remove("edited");
      resetHistory("pw-box", value);
      autosize(box);
    };
    if (n === null) {
      setBox("", t_("typeNumber"));
      pwLoadedFor = null;
      setNote("pw-note", "", "");
      return;
    }
    const ta = segTextarea(n);
    if (!ta) {
      const k = segCount();
      setBox("", k ? t_("segNotFound", { n, k }) : t_("noSegs"));
      pwLoadedFor = null;
      setNote("pw-note", "", "");
      return;
    }
    const pageText = ta.value;
    // Never overwrite what you are typing in the bar.
    if (pwDirty && pwLoadedFor === n) {
      setNote("pw-note", t_("pwEdited"), "orange");
      return;
    }
    if (box.value !== pageText || pwLoadedFor !== n) setBox(pageText, t_("empty"));
    box.readOnly = false;
    pwLoadedFor = n;

    const seg = t?.segments[n];
    if (seg) {
      const same = norm(pageText) === norm(seg.finalText);
      setNote("pw-note", same ? t_("same") : t_("diff"), same ? "green" : "redish");
    } else {
      setNote("pw-note", t_("found", { n }), "muted");
    }
  }

  function renderSubjects() {
    const t = task();
    const subjects = t?.subjects || [];
    const f = t?.filter;
    $("subj-meta").textContent = subjects.length
      ? t_("subjMeta", { n: subjects.length }) + (t.audios.length ? t_("subjChecked", { n: t.audios.length }) : "") +
        (f?.status === "waiting" ? t_("subjWaiting") : f?.status === "error" ? t_("subjError") + (f.error || "") : "")
      : t_("subjNone");

    const results = f?.status === "completed" ? f.results : null;
    // What is written next to each subject in Maven right now (read only).
    const live = new Map(readSubjectsFromPage().map((x) => [x.name, x.annotation || ""]));
    const list = $("chips");
    list.replaceChildren();
    let keep = 0, del = 0;
    for (const s of subjects) {
      const r = results?.find((x) => x.name === s.name);
      const row = document.createElement("div");
      const icon = document.createElement("span");
      icon.className = "si";
      const name = document.createElement("span");
      name.className = "sn";
      name.textContent = s.name;
      const note = document.createElement("span");
      const text = live.has(s.name) ? live.get(s.name) : (s.annotation || "");
      note.className = "sa" + (text ? "" : " empty");
      note.textContent = text || t_("noAnnot");
      note.setAttribute("dir", "auto");
      const tags = document.createElement("span");
      tags.className = "st";
      // Topics Verification: Keep / Edit / Remove
      const decision = r ? (r.decision || (r.mentioned === false ? "remove" : r.mentioned === true ? (r.annotationOk === false ? "edit" : "keep") : null)) : null;
      const isEdit = decision === "edit" && !corrected.has(s.name);
      if (decision === "remove") {
        del++;
        row.className = "srow del";
        icon.innerHTML = ICON.x;
      } else if (isEdit) {
        keep++;
        row.className = "srow edit";
        icon.innerHTML = ICON.check;
        if (r.correctedAnnotation) {
          const c = document.createElement("span");
          c.className = "sfix";
          c.textContent = "→ " + r.correctedAnnotation;
          c.setAttribute("dir", "auto");
          note.append(c);
        }
        const fix = document.createElement("button");
        fix.type = "button";
        fix.className = "sfixbtn";
        fix.textContent = t_("subjCorr");
        fix.title = r.correctedAnnotation || "";
        fix.disabled = !r.correctedAnnotation;
        fix.addEventListener("click", () => correctSubject(s.name, r.correctedAnnotation, fix));
        tags.append(fix);
      } else if (decision === "keep" || decision === "edit") {
        keep++;
        row.className = "srow keep";
        icon.innerHTML = ICON.check;
      } else {
        row.className = "srow";
      }
      const why = [r?.duplicateOf ? t_("subjDup", { name: r.duplicateOf }) : "", r?.evidence, r?.annotationComment].filter(Boolean).join(" — ");
      if (why) {
        const c = document.createElement("span");
        c.className = "sw";
        c.textContent = why;
        note.append(c);
      }
      // Supprimer only where it is not a subject to keep
      if (decision !== "keep" && !(decision === "edit")) {
        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "sdel" + (decision === "remove" ? " hot blinkb" : "");
        delBtn.textContent = t_("subjDelete");
        delBtn.title = t_("subjDeleteTitle", { name: s.name });
        delBtn.addEventListener("click", () => deleteSubject(s.name, delBtn));
        tags.append(delBtn);
      }
      row.append(icon, name, note, tags);
      list.append(row);
    }
    {
      const left = subjects.length - (results ? del : 0);
      const bad = results && (left < 3 || left > 9);
      $("cnt-range").textContent = t_("subjRange", { n: left }) + (f?.listComment ? " — " + f.listComment : "");
      $("cnt-range").classList.toggle("hidden", !results || (!bad && !f?.listComment));
      $("cnt-range").classList.toggle("err", !!bad);
    }
    $("cnt-keep").textContent = t_("cntKeep", { n: keep });
    $("cnt-del").textContent = t_("cntDel", { n: del });
    $("cnt-keep").classList.toggle("hidden", !results);
    $("cnt-del").classList.toggle("hidden", !results);
    $("btn-filter").disabled = !t || !subjects.length || !t.audios.length || f?.status === "waiting";
    $("btn-filter").classList.toggle("blinkb", !!t && !filterClicked.has(t.id));
  }

  function renderAll({ fill = true } = {}) {
    renderHeader();
    renderChat({ fill });
    renderPoliwag();
    renderSubjects();
    renderSentiment();
    renderPlayer();
    const hidden = !!data.state?.settings?.barHidden;
    host.style.display = hidden ? "none" : "";
  }

  // ------------------------------------------------------------------ actions

  async function search(n, { scroll = true, reread = true } = {}) {
    if (n === null || n === "" || isNaN(Number(n))) return;
    if (dirty && currentN !== Number(n)) await saveDraftNow();
    if (pwDirty && currentN !== Number(n) && !confirm(t_("pwLose", { n: currentN }))) { $("seg-no").value = String(currentN); return; }
    if (currentN !== Number(n)) { pwDirty = false; pwLoadedFor = null; sentChoice = null; }
    if (currentN !== Number(n)) {
      playBlinkFor = Number(n);
      const auds = task()?.audios || [];
      segAudioMark = { n: Number(n), max: auds.reduce((m, a) => Math.max(m, a.n), -1) };
    }
    currentN = Number(n);
    rememberOrig(currentN);
    chatOverride = false;
    $("seg-no").value = String(currentN);
    const row = findRow(currentN);
    if (row && scroll) row.scrollIntoView({ block: "center", behavior: "smooth" });
    renderChat();
    renderPoliwag();
    renderSentiment();
    if (timeNoteFor !== currentN) setNote("time-note", "", "");
    if (player.n !== currentN) { stopSource(); stopEl(); player.playing = false; player.offset = 0; }
    mavenAssumedPlaying = false;
    renderTime();
    renderPlayer();
    if (reread && task()) {
      setNote("chat-note", t_("reading"), "muted");
      await send("PA_READ_NOW");
      data = await loadData();
      renderHeader();
      renderChat();
    }
  }

  async function saveDraftNow() {
    clearTimeout(draftTimer);
    const t = task();
    if (!t || chatN === null) return;
    const audio = t.audios.find((a) => a.n === chatN);
    const showingHistory = !chatOverride && t.segments[currentN];
    if (audio && !showingHistory) await send("PA_AUDIO_DRAFT", { n: chatN, text: $("chat-box").value });
  }

  async function replace() {
    const t = task();
    if (!t) return toast(t_("e_noTask"), "err");
    if (currentN === null) return toast(t_("e_noNum"), "err");
    const text = $("chat-box").value.trim();
    if (!text) return toast(t_("e_emptyAi"), "err");
    const ta = segTextarea(currentN);
    if (!ta) return toast(t_("e_segNF", { n: currentN }), "err");
    const before = ta.value;
    if (!writeSegment(ta, text)) return toast(t_("e_pageRefused"), "err", 5000);
    pwDirty = false;
    const audio = t.audios.find((a) => a.n === chatN);
    const r = await send("PA_SEGMENT_SAVE", { n: currentN, audioN: chatN, action: "replaced", chatText: audio?.chatText || "", finalText: text, pageTextBefore: before });
    if (!r?.ok) toast(t_("e_histFail") + (r?.error || ""), "warn", 5000);
    else toast(t_("ok_replaced", { n: currentN, m: currentN + 1 }), "ok");
    dirty = false;
    // reset: the Gemini box for this segment is cleared and nothing waits for a reply any more
    machineHint = { n: null, text: "" };
    waitReply = null;
    chatOverride = false;
    $("chat-box").value = "";
    renderAll();
  }

  async function keep() {
    const t = task();
    if (!t) return toast(t_("e_noTask"), "err");
    if (currentN === null) return toast(t_("e_noNum"), "err");
    const ta = segTextarea(currentN);
    if (!ta) return toast(t_("e_segNF", { n: currentN }), "err");
    const audio = t.audios.find((a) => a.n === chatN);
    const before = ta.value;
    const text = $("pw-box").value;
    // Your corrections in Trans Poliwag are written to Maven only now, when you press Garder.
    if (text !== before && !writeSegment(ta, text)) return toast(t_("e_pageRefused"), "err", 5000);
    pwDirty = false;
    $("pw-box").classList.remove("edited");
    const r = await send("PA_SEGMENT_SAVE", { n: currentN, audioN: chatN, action: "kept", chatText: audio?.chatText || "", finalText: text, pageTextBefore: before });
    if (r?.ok) toast(t_("ok_kept", { n: currentN, m: currentN + 1 }), "ok");
    else toast(r?.error || t_("err"), "err");
    dirty = false;
    if (r?.ok) renderAll();
  }

  // After Remplace / Garder: go to the next Poliwag segment, keeping the same ChatGPT offset if you set one.
  async function goNext() {
    const next = currentN + 1;
    chatOverride = false;
    if (!findRow(next)) { toast(t_("ok_last", { n: currentN }), "ok", 4000); renderAll(); return; }
    await search(next);
  }

  // Précédent = undo the last change typed in a box (a word changed or deleted). Nothing is written to Maven.
  function undo() {
    const id = "pw-box"; // Précédent works on Trans Poliwag only
    const stack = hist[id];
    if (!stack.length) return toast(t_("e_noUndo"), "err");
    const box = $(id);
    const prev = stack.pop();
    box.value = prev;
    histMeta[id] = { prev, at: 0 };
    autosize(box);
    box.focus();
    if (id === "pw-box") {
      pwDirty = prev !== (segTextarea(currentN)?.value ?? prev);
      box.classList.toggle("edited", pwDirty);
      $("btn-keep").classList.toggle("blinkb", pwDirty);
      setNote("pw-note", pwDirty ? t_("pwEdited") : t_("found", { n: currentN }), pwDirty ? "orange" : "muted");
    } else {
      dirty = true;
      clearTimeout(draftTimer);
      draftTimer = setTimeout(saveDraftNow, 800);
    }
    updateUndoBtn();
  }

  function recordEditForce(id) {
    hist[id].push($(id).value);
    histMeta[id].at = Date.now();
    lastEdited = id;
    updateUndoBtn();
  }

  // Save a snapshot when a word is finished, deleted, or after a short pause, so one click = one word back.
  function recordEdit(id) {
    const box = $(id);
    const m = histMeta[id];
    const now = Date.now();
    const v = box.value;
    if (v === m.prev) return;
    const shrank = v.length < m.prev.length;
    const lastChar = v.slice(-1);
    const typedSpace = !shrank && /\s|[.,;:!?]/.test(lastChar);
    if (now - m.at > 900 || shrank !== m.shrank || typedSpace || Math.abs(v.length - m.prev.length) > 1) {
      hist[id].push(m.prev);
      if (hist[id].length > 200) hist[id].shift();
      m.at = now;
    }
    m.shrank = shrank;
    m.prev = v;
    lastEdited = id;
    updateUndoBtn();
  }

  function pickChatNumber() {
    const v = $("chat-no").value.trim();
    if (v === "" || isNaN(Number(v))) return;
    chatN = Number(v);
    chatOverride = chatN !== currentN || !!task()?.segments[currentN];
    renderChat();
  }

  async function copyChat() {
    const text = $("chat-box").value;
    if (!text) return toast(t_("nothingCopy"), "err");
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch {
      const box = $("chat-box");
      box.focus(); box.select();
      ok = document.execCommand("copy");
    }
    toast(ok ? "Trans ChatGPT copié." : "Copie impossible.", ok ? "ok" : "err");
  }

  async function newTask(engine) {
    const t = task();
    if (t && t.audios.length && !confirm(t_("confirmNew", { id: t.id }))) return;
    const subjects = readSubjectsFromPage();
    currentN = null; chatN = null; chatOverride = false;
    $("seg-no").value = "";
    toast(t_("opening", { ai: AI_NAMES[engine] }), "info");
    const r = await send("PA_NEW_TASK", { subjects, engine });
    if (r && !r.ok) toast((r.error || t_("err")) + t_("clickManual"), "warn", 6000);
  }

  // ------------------------------------------------------------------ menus: AI choice (+) and language

  function closeMenus() {
    $("ai-menu").classList.add("hidden");
    $("lang-menu").classList.add("hidden");
  }

  function openMenu(menuId, anchorId, items, title) {
    const m = $(menuId);
    const wasOpen = !m.classList.contains("hidden");
    closeMenus();
    if (wasOpen) return;
    m.replaceChildren();
    const h = document.createElement("div");
    h.className = "mh";
    h.textContent = title;
    m.append(h);
    for (const it of items) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "mi" + (it.sel ? " sel" : "") + (it.cls ? " " + it.cls : "");
      b.setAttribute("role", "menuitem");
      const dot = document.createElement("span");
      dot.className = "dot " + (it.dot || "");
      dot.textContent = it.badge;
      const lab = document.createElement("span");
      lab.textContent = it.label;
      b.append(dot, lab);
      b.addEventListener("click", () => { closeMenus(); it.run(); });
      m.append(b);
    }
    m.classList.remove("hidden");
    const r = $(anchorId).getBoundingClientRect();
    const w = m.offsetWidth;
    m.style.top = Math.round(r.bottom + 8) + "px";
    m.style.left = Math.round(Math.min(window.innerWidth - w - 12, r.right - w)) + "px";
    m.setAttribute("dir", L().dir);
  }

  function openAiMenu() {
    openMenu("ai-menu", "btn-new", [
      { badge: "✦", dot: "d-gem", label: "Gemini", run: () => newTask("gemini") },
      { badge: "G", dot: "d-gpt", label: "ChatGPT", cls: "grey", run: () => warnChatGpt() }
    ], t_("newTask") + " · " + t_("pickAi") + " · " + ({ ar: "العربية", fr: "Français", en: "English" }[LANG] || "")); // the task language = the bar language
  }

  // ChatGPT is greyed: before using it, a big warning — tests showed Gemini transcribes audio best.
  function warnChatGpt() {
    const old = root.getElementById("gpt-warn");
    if (old) old.remove();
    const w = document.createElement("div");
    w.id = "gpt-warn";
    w.className = "gptwarn";
    w.setAttribute("role", "alertdialog");
    w.setAttribute("dir", L().dir);
    w.innerHTML = `<div class="gw-box"><div class="gw-icon">⚠</div><h3></h3><p class="gw-text"></p>
      <div class="gw-btns"><button type="button" class="gw-back"></button><button type="button" class="gw-go"></button></div></div>`;
    w.querySelector("h3").textContent = t_("gptWarnTitle");
    w.querySelector(".gw-text").textContent = t_("gptWarnText");
    w.querySelector(".gw-back").textContent = t_("gptBack");
    w.querySelector(".gw-go").textContent = t_("gptGo");
    w.querySelector(".gw-back").addEventListener("click", () => { w.remove(); newTask("gemini"); });
    w.querySelector(".gw-go").addEventListener("click", () => { w.remove(); newTask("chatgpt"); });
    w.addEventListener("click", (e) => { if (e.target === w) w.remove(); });
    root.append(w);
    w.querySelector(".gw-back").focus();
  }

  function openLangMenu() {
    const items = [["ar", "AR", "العربية (مصري)"]].map(([code, badge, label]) => ({
      badge, label, dot: "d-gpt", sel: LANG === code,
      run: async () => { await send("PA_SET_UI_LANG", { lang: code }); }
    }));
    items.forEach((i) => { i.dot = ""; });
    openMenu("lang-menu", "btn-lang", items, t_("lang"));
    for (const d of root.querySelectorAll("#lang-menu .dot")) { d.style.background = "#3A3A42"; d.style.width = "28px"; }
  }

  // Static labels and the tag panel follow the chosen language.
  function applyLang() {
    const wanted = "ar";
    const changed = wanted !== LANG;
    LANG = "ar"; // the bar is always Arabic
    $("btn-lang").textContent = LANG.toUpperCase();
    $("lbl-replace").textContent = t_("replace");
    $("lbl-keep").textContent = t_("keep");
    $("lbl-next").textContent = t_("next");
    $("lbl-search").textContent = t_("search");
    $("btn-undo").textContent = t_("previous");
    $("btn-undo").title = t_("undoTitle");
    $("lbl-trans-ai").textContent = t_("transAi");
    $("lbl-trans-pw").textContent = t_("transPw");
    $("lbl-filter").textContent = t_("filter");
    $("lbl-sent").textContent = t_("sentiment");
    $("lbl-time").textContent = t_("timeLbl");
    $("lbl-speed").textContent = t_("speedLbl");
    $("lbl-eq").textContent = t_("timeBtn");
    $("sent-positive").textContent = t_("sentPos");
    $("sent-neutral").textContent = t_("sentNeu");
    $("sent-negative").textContent = t_("sentNeg");
    $("btn-reread-subj").textContent = t_("rereadPage");
    $("btn-new").title = t_("newTask");
    $("btn-collapse").title = t_("collapse");
    $("btn-lang").title = t_("lang");
    $("lbl-send").textContent = t_("sendLbl");
    $("lbl-subj").textContent = t_("subjTitle");
    $("btn-subjects").title = t_("subjTitle");
    $("brand").title = t_("tasksTitle");
    $("btn-dl").title = t_("dlTitle");
    $("gpt-warn")?.remove(); // the ChatGPT warning is rebuilt in the new language when opened again
    lastPlayingShown = null; // re-label the Play / Pause button in the new language
    $("chat-no").title = t_("transPw");
    $("chat-box").setAttribute("aria-label", t_("transAi"));
    if (changed || !$("tag-panel").dataset.lang) buildTagPanel();
    if (changed) { try { drawWave(); } catch {} renderSpeed(); renderSendBtn(); renderAuto(); } // texts drawn in the graph too
  }

  // ------------------------------------------------------------------ task list (hover the title)

  let tasksTimer = null;
  function renderTaskList() {
    const box = $("tasks");
    box.replaceChildren();
    const list = Object.values(data.tasks || {}).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    const th = document.createElement("div");
    th.className = "th";
    th.textContent = t_("tasksTitle", { n: list.length });
    box.append(th);
    if (!list.length) {
      const e = document.createElement("div");
      e.className = "empty";
      e.textContent = t_("noTasks");
      box.append(e);
      return;
    }
    const curId = data.state?.currentTaskId;
    for (const t of list) {
      const row = document.createElement("div");
      row.className = "trow" + (t.id === curId ? " cur" : "");
      const info = document.createElement("div");
      info.className = "info";
      const b = document.createElement("b");
      b.className = "mono";
      b.textContent = t.id;
      const sub = document.createElement("span");
      const d = new Date(t.createdAt);
      const done = Object.keys(t.segments || {}).length;
      sub.textContent = `${AI_NAMES[t.chat?.engine || "chatgpt"]} · ` + t_("taskSub", { date: d.toLocaleDateString(), time: hhmm(t.createdAt), a: t.audios.length, d: done }) + (t.id === curId ? t_("current") : "");
      info.append(b, sub);
      const load = document.createElement("button");
      load.type = "button";
      load.className = "mbtn load";
      load.textContent = t_("load");
      load.disabled = t.id === curId;
      load.addEventListener("click", async () => {
        if (dirty) await saveDraftNow();
        const r = await send("PA_SET_CURRENT", { taskId: t.id });
        if (r?.ok) {
          currentN = null; chatN = null; chatOverride = false;
          $("seg-no").value = "";
          toast(t_("loaded", { id: t.id }), "ok");
          hideTasks(true);
        } else toast(r?.error || t_("err"), "err");
      });
      const del = document.createElement("button");
      del.type = "button";
      del.className = "mbtn del";
      del.textContent = t_("del");
      del.addEventListener("click", async () => {
        if (!confirm(t_("confirmDel", { id: t.id }))) return;
        const r = await send("PA_DELETE_TASK", { taskId: t.id });
        if (r?.ok) {
          if (t.id === curId) { currentN = null; chatN = null; $("seg-no").value = ""; }
          toast(t_("deleted", { id: t.id }), "ok");
        } else toast(r?.error || t_("err"), "err");
      });
      row.append(info, load, del);
      box.append(row);
    }
  }

  function showTasks() {
    clearTimeout(tasksTimer);
    renderTaskList();
    const r = $("brand").getBoundingClientRect();
    const box = $("tasks");
    box.style.top = Math.round(r.bottom + 8) + "px";
    box.style.left = Math.round(Math.max(8, r.left - 6)) + "px";
    box.classList.remove("hidden");
    $("brand").classList.add("on");
  }
  function hideTasks(now) {
    clearTimeout(tasksTimer);
    const go = () => { $("tasks").classList.add("hidden"); $("brand").classList.remove("on"); };
    if (now) go(); else tasksTimer = setTimeout(go, 250);
  }
  $("brand").addEventListener("mouseenter", showTasks);
  $("brand").addEventListener("mouseleave", () => hideTasks());
  $("brand").addEventListener("click", () => ($("tasks").classList.contains("hidden") ? showTasks() : hideTasks(true)));
  $("tasks").addEventListener("mouseenter", () => clearTimeout(tasksTimer));
  $("tasks").addEventListener("mouseleave", () => hideTasks());

  // ------------------------------------------------------------------ tags

  let tagPanelWired = false;
  function buildTagPanel() {
    const p = $("tag-panel");
    const esc = (x) => String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const lg = L();
    p.dataset.lang = LANG;
    p.setAttribute("dir", lg.dir);
    p.innerHTML = `
      <div class="tp-head"><b>${esc(t_("vocalTags"))}</b><span class="tp-hint hidden" id="tag-hint"></span></div>
      <div class="tp-grid">${TAGS.map((tg) => `<button type="button" class="tg" data-tag="${tg}"><code dir="ltr">[${tg}]</code><span>${esc(lg.tags[tg] || "")}</span></button>`).join("")}</div>
      <div class="tp-cols">
        <div class="tp-box"><b>${esc(t_("rulesTitle"))}</b><ul>${lg.rules.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
        <div class="tp-box"><b>${esc(t_("obsoleteTitle"))}</b><div class="obs">${OBSOLETE.map((tg) => `<code>[${tg}]</code>`).join("")}</div></div>
      </div>`;
    updateTagSelection();
    if (tagPanelWired) return;
    tagPanelWired = true;
    p.addEventListener("click", (e) => {
      const b = e.target.closest(".tg");
      if (!b) return;
      selectedTag = selectedTag === b.dataset.tag ? null : b.dataset.tag;
      updateTagSelection();
    });
  }

  function updateTagSelection() {
    for (const b of root.querySelectorAll(".tg")) b.classList.toggle("sel", b.dataset.tag === selectedTag);
    const hint = root.getElementById("tag-hint");
    if (hint) {
      hint.textContent = selectedTag ? t_("tagHint", { tag: selectedTag }) : "";
      hint.classList.toggle("hidden", !selectedTag);
    }
    $("chat-box").classList.toggle("armed", !!selectedTag);
    $("btn-tags").classList.toggle("on", !!selectedTag);
  }

  function toggleTagPanel(force) {
    const p = $("tag-panel");
    const open = force ?? p.classList.contains("hidden");
    if (open) {
      const r = $("bar").getBoundingClientRect();
      p.style.top = Math.round(r.bottom + 6) + "px";
      p.style.left = Math.round(r.left + 12) + "px";
    }
    p.classList.toggle("hidden", !open);
    if (!open) { selectedTag = null; updateTagSelection(); }
  }

  function insertTagAtCaret() {
    if (!selectedTag) return;
    const box = $("chat-box");
    const pos = box.selectionStart ?? box.value.length;
    const before = box.value.slice(0, pos);
    const after = box.value.slice(pos);
    const left = before && !/\s$/.test(before) ? " " : "";
    const right = after && !/^\s/.test(after) ? " " : "";
    const ins = `${left}[${selectedTag}]${right}`;
    recordEditForce("chat-box");
    box.value = before + ins + after;
    const caret = pos + ins.length;
    box.setSelectionRange(caret, caret);
    selectedTag = null;
    updateTagSelection();
    toggleTagPanel(false);
    onChatInput();
  }

  // ------------------------------------------------------------------ events

  function onChatInput() {
    recordEdit("chat-box");
    dirty = true;
    autosize($("chat-box"));
    const t = task();
    const audio = t?.audios.find((a) => a.n === chatN);
    $("chat-meta").textContent = audio ? audio.language : "";
    clearTimeout(draftTimer);
    draftTimer = setTimeout(saveDraftNow, 800);
  }

  $("chat-box").addEventListener("input", onChatInput);
  $("pw-box").addEventListener("input", () => {
    recordEdit("pw-box");
    pwDirty = $("pw-box").value !== (segTextarea(currentN)?.value ?? "");
    $("pw-box").classList.toggle("edited", pwDirty);
    $("btn-keep").classList.toggle("blinkb", pwDirty); // Garder blinks: your change still has to be saved
    setNote("pw-note", pwDirty ? t_("pwEdited") : t_("found", { n: currentN }), pwDirty ? "orange" : "muted");
    autosize($("pw-box"));
  });
  $("pw-box").addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") { e.preventDefault(); lastEdited = "pw-box"; undo(); }
  });

  $("chat-box").addEventListener("click", () => { if (selectedTag) insertTagAtCaret(); });
  $("btn-search").addEventListener("click", () => search($("seg-no").value.trim()));
  $("seg-no").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); search($("seg-no").value.trim()); } });
  $("btn-undo").addEventListener("click", undo);
  $("btn-eq").addEventListener("click", equalize);
  $("btn-eq-undo").addEventListener("click", undoEqualize);
  window.addEventListener("resize", () => renderWave(true));
  $("wave-cv").addEventListener("pointerdown", waveDown);
  $("wave-cv").addEventListener("dblclick", (ev) => {
    if (bandAt(ev.clientY) && levelMap.delete(LEVEL_KEY)) { setNote("time-note", t_("bandReset"), "muted"); drawWave(); }
  });
  $("wave-cv").addEventListener("pointermove", waveMove);
  $("wave-cv").addEventListener("pointerup", waveUp);
  $("wave-cv").addEventListener("pointercancel", waveUp);
  $("wave-cv").addEventListener("pointerleave", () => { if (!wv.drag && wv.hover) { wv.hover = null; drawWave(playheadTime()); } });
  $("btn-play").addEventListener("click", togglePlay);
  $("spd-down").addEventListener("click", () => changeSpeed(-1));
  $("spd-up").addEventListener("click", () => changeSpeed(1));
  renderSpeed();
  for (const v of ["positive", "neutral", "negative"]) {
    $("sent-" + v).addEventListener("click", () => {
      if (currentN === null) return toast(t_("e_noNum"), "err");
      // Written to Maven right away, no other button needed.
      if (!writeSentiment(currentN, v)) return toast(t_("sentFail"), "err", 4000);
      sentChoice = v;
      renderSentiment();
    });
  }

  $("btn-replace").addEventListener("click", () => {
    if (!autoRun) return replace();
    if (autoRun.replacing || autoRun.skip) return; // Auto is already replacing / moving on
    // in Auto: replace now, go to the next segment, Auto goes on
    autoRun.skip = true;
    if (isPlayingNow()) pauseSegment();
    autoRun.keepDone = replace();
  });
  $("btn-next").addEventListener("click", async () => {
    if (currentN === null) return toast(t_("e_noNum"), "err");
    await goNext();
  });
  $("btn-keep").addEventListener("click", () => {
    if (!autoRun) return keep();
    if (autoRun.replacing || autoRun.skip) return;
    // in Auto: keep this segment, go to the next one, Auto goes on
    autoRun.skip = true;
    if (isPlayingNow()) pauseSegment();
    autoRun.keepDone = keep();
  });
  $("btn-new").addEventListener("click", () => { newClicked = true; $("btn-new").classList.remove("blink"); openAiMenu(); });
  $("btn-lang").addEventListener("click", openLangMenu);
  root.addEventListener("click", (e) => {
    const inside = e.composedPath().some((n) => n?.id === "ai-menu" || n?.id === "lang-menu" || n?.id === "btn-new" || n?.id === "btn-lang");
    if (!inside) closeMenus();
  });
  document.addEventListener("click", closeMenus);
  $("btn-tags").addEventListener("click", () => toggleTagPanel());
  $("btn-send").addEventListener("click", sendSegmentToAi);
  $("btn-dl").addEventListener("click", downloadSegmentWav);
  // Auto button removed (v15.6): Search -> Send -> Replace, and Replace jumps to the next segment by itself.
  $("btn-auto").style.setProperty("display", "none", "important");
  $("btn-auto").remove();
  renderAuto();
  $("btn-subjects").addEventListener("click", () => {
    const open = $("subj").classList.contains("hidden");
    $("subj").classList.toggle("hidden", !open);
    $("bar").classList.toggle("subjmode", open); // subjects page only, so the bar stays short
    $("btn-subjects").classList.toggle("on", open);
    if (!$("tag-panel").classList.contains("hidden")) toggleTagPanel(true);
  });
  $("btn-reread-subj").addEventListener("click", async () => {
    const subjects = readSubjectsFromPage();
    if (!subjects.length) return toast(t_("noSubjPage"), "err");
    if (!task()) return toast(t_("e_noTask"), "err");
    await send("PA_SET_SUBJECTS", { subjects });
    toast(t_("subjRead", { n: subjects.length }), "ok");
  });
  $("btn-filter").addEventListener("click", async () => {
    if (task()) filterClicked.add(task().id);
    $("btn-filter").classList.remove("blinkb");
    // Read the subjects AND what is written in each annotation box right now (read only).
    const r = await send("PA_FILTER", { subjects: readSubjectsFromPage() });
    if (r?.ok) toast(t_("filterSent"), "info");
    else toast((r?.error || t_("err")) + (r?.manualPrompt ? t_("clickManual") : ""), "err", 6000);
  });
  $("chat-pill").addEventListener("click", async () => {
    const st = data.state?.chatgpt;
    if (st?.status === "manual" && st.manualPrompt) {
      try { await navigator.clipboard.writeText(st.manualPrompt); toast(t_("promptCopied"), "ok"); }
      catch { toast(t_("copyFail"), "err"); }
    } else if (st?.status === "disconnected") {
      const r = await send("PA_RECONNECT");
      toast(r?.ok ? t_("reconnected") : (r?.error || t_("notFound")), r?.ok ? "ok" : "err");
    }
  });
  $("btn-collapse").addEventListener("click", () => {
    $("wrap").classList.add("hidden");
    $("mini").classList.remove("hidden");
    toggleTagPanel(false);
  });
  $("mini").addEventListener("click", () => {
    $("wrap").classList.remove("hidden");
    $("mini").classList.add("hidden");
  });

  // Audio output (Windows helper through the background)
  async function renderAudio(reply) {
    const devices = reply?.ok ? reply.devices || [] : [];
    const active = devices.find((d) => d.isDefault);
    for (const [kind, id] of [["headset", "out-headset"], ["speakers", "out-speakers"]]) {
      const dev = devices.find((d) => d.kind === kind);
      const b = $(id);
      b.disabled = !dev;
      b.title = dev ? dev.name : reply?.offline ? t_("helperOff") : t_("notDetected");
      b.setAttribute("aria-checked", String(!!(dev && active && dev.id === active.id)));
    }
  }
  for (const [kind, id] of [["headset", "out-headset"], ["speakers", "out-speakers"]]) {
    $(id).addEventListener("click", async () => {
      const r = await send("PA_AUDIO_SET", { target: kind });
      renderAudio(r);
      if (!r?.ok) toast(r?.error || t_("audioFail"), "err");
    });
  }

  // ------------------------------------------------------------------ data sync

  async function loadData() {
    const d = await chrome.storage.local.get(["pa_state", "pa_tasks"]);
    return { state: d.pa_state || null, tasks: d.pa_tasks || {} };
  }

  function handleEvent() {
    const ev = data.state?.lastEvent;
    const t = task();
    if (!ev || !t || ev.taskId !== t.id) return;
    const key = ev.kind + "|" + ev.at;
    if (key === lastEventSeen) return;
    const first = lastEventSeen === null;
    lastEventSeen = key;
    if (first) return; // don't replay an old event when the page loads

    if (ev.kind === "new") {
      if (ev.dupOf !== null && ev.dupOf !== undefined) toast(t_("dupSaved"), "warn", 5000);
      else toast(t_("newSaved", { n: ev.n }), "ok", 4000);
      if (!dirty) { chatOverride = false; renderChat(); }
    } else if (ev.kind === "duplicate") {
      dupShownUntil = Date.now() + 15000;
      toast(t_("dupIgnored", { n: ev.n }), "warn", 5000);
      renderChat({ fill: false });
      setTimeout(() => renderChat({ fill: false }), 15100);
    } else if (ev.kind === "invalid") {
      lastInvalid = { at: Date.now(), notes: ev.notes || [], audioId: ev.audioId || "" };
      toast(t_("invalid") + (ev.errors || []).join("\n") + (ev.notes?.length ? "\n" + ev.notes.join(" ") : ""), "err", 7000);
    } else if (ev.kind === "filter") {
      toast(t_("filterReady"), "ok", 5000);
      $("subj").classList.remove("hidden");
      $("btn-subjects").classList.add("on");
    } else if (ev.kind === "task") {
      currentN = null;
      $("seg-no").value = "";
    }
  }

  async function refresh() {
    data = await loadData();
    const editing = root.activeElement === $("chat-box") && dirty;
    applyLang();
    renderAll({ fill: !editing });
    if (!$("tasks").classList.contains("hidden")) renderTaskList();
    handleEvent();
  }

  chrome.storage.onChanged.addListener((_c, area) => { if (area === "local") refresh(); });

  // Read the Subjects once per task, as soon as they are visible on the page.
  setInterval(async () => {
    const t = task();
    if (t && !t.subjects?.length) {
      const subjects = readSubjectsFromPage();
      if (subjects.length) await send("PA_SET_SUBJECTS", { subjects });
    }
    if (currentN !== null && root.activeElement !== $("pw-box") && !pwDirty) renderPoliwag();
    if (!$("subj").classList.contains("hidden")) renderSubjects();
    renderTime();
    renderSentiment();
  }, 4000);
  setInterval(() => send("PA_STATUS_CHECK"), 20000);
  // Maven's signed audio links expire after a while (HTTP 403). As soon as Maven loads the
  // audio of a task, the bar reads it once too, while the link is still valid, and keeps it
  // in memory for the graph and Équilibrer. Files of earlier tasks are dropped.
  const prefetchFailed = new Map();
  async function prefetchAudio() {
    try {
      const urls = await audioUrls();
      if (!urls.length) return;
      audioSeen = true;
      const keep = new Set(urls.map((u) => u.split("?")[0]));
      for (const u of [...audioCache.keys()]) if (!keep.has(u.split("?")[0])) audioCache.delete(u);
      for (const u of urls) {
        const path = u.split("?")[0];
        if ([...audioCache.keys()].some((k) => k.split("?")[0] === path)) continue;
        if (Date.now() - (prefetchFailed.get(u) || 0) < 60000) continue; // a refused link is not asked again and again
        decode(u).catch(() => prefetchFailed.set(u, Date.now()));
      }
    } catch {}
  }
  prefetchAudio();
  setInterval(prefetchAudio, 3000);
  setInterval(() => {
    if (currentN !== null) renderPlayer();
    renderSpeed();
    renderSendBtn();
    $("btn-keep").classList.toggle("blinkb", !!pwDirty && currentN !== null); // edited in Trans Poliwag, not saved yet
  }, 500);

  refresh().then(() => {
    const ev = data.state?.lastEvent;
    lastEventSeen = ev ? ev.kind + "|" + ev.at : "";
  });
  send("PA_AUDIO_LIST").then(renderAudio);
  send("PA_STATUS_CHECK");
})();

