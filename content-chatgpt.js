// By svmovo (github.com/svmovo) - Sam Poliwag Assist
// Sam Poliwag Assist v7 — content script for chatgpt.com AND gemini.google.com
//
// What it does (and only this):
//   • SEND_PROMPT : types a prompt into the ChatGPT composer and presses Send.
//   • READ_LATEST : returns the text of the latest assistant reply and whether ChatGPT is still writing.
//   • Watches the page and tells the background when a new, finished assistant reply appears.
// It never reads cookies, tokens or private APIs — only the visible conversation.

(() => {
  if (window.__poliwagChatgptLoaded) return;
  window.__poliwagChatgptLoaded = true;

  const IS_GEMINI = location.hostname === "gemini.google.com";

  const COMPOSER_SELECTORS = [
    "#prompt-textarea",
    'rich-textarea .ql-editor[contenteditable="true"]',
    '.ql-editor[contenteditable="true"]',
    'div[contenteditable="true"][role="textbox"]',
    'div[contenteditable="true"].ProseMirror',
    'div[contenteditable="true"][data-virtualkeyboard]',
    "form textarea"
  ];
  const SEND_SELECTORS = [
    'button[data-testid="send-button"]',
    "#composer-submit-button",
    'button[aria-label="Send prompt"]',
    'button[aria-label*="Send"]',
    'button[aria-label*="Envoyer"]',
    "button.send-button",
    'button[aria-label*="Send message"]',
    'button[aria-label*="Envoyer le message"]',
    'button[aria-label*="إرسال"]'
  ];
  const STOP_SELECTORS = [
    'button[data-testid="stop-button"]',
    'button[aria-label*="Stop"]',
    'button[aria-label*="Arrêter"]',
    "button.stop",
    'button[aria-label*="Stop response"]',
    'button[aria-label*="Arrêter la réponse"]',
    'button[aria-label*="إيقاف"]'
  ];

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const q = (list) => {
    for (const s of list) {
      const el = document.querySelector(s);
      if (el) return el;
    }
    return null;
  };

  function isGenerating() {
    return !!q(STOP_SELECTORS);
  }

  function assistantMessages() {
    if (IS_GEMINI) return Array.from(document.querySelectorAll("model-response"));
    return Array.from(document.querySelectorAll('[data-message-author-role="assistant"]'));
  }

  function userMessageCount() {
    if (IS_GEMINI) return document.querySelectorAll("user-query").length;
    return document.querySelectorAll('[data-message-author-role="user"]').length;
  }

  // Code blocks written by the AI only (Gemini also shows the user's prompt, which contains JSON examples).
  function replyBlocks() {
    if (IS_GEMINI) {
      return Array.from(document.querySelectorAll("model-response pre, model-response code-block"))
        .filter((el) => el.tagName === "PRE" || !el.querySelector("pre"))
        .map((el) => (el.querySelector("code") || el).innerText);
    }
    return Array.from(document.querySelectorAll("pre")).map((p) => (p.querySelector("code") || p).innerText);
  }

  function readMessage(el) {
    if (!el) return { text: "", codeText: "" };
    let codes = Array.from(el.querySelectorAll("pre code")).map((c) => c.innerText);
    if (!codes.length) codes = Array.from(el.querySelectorAll("pre")).map((c) => c.innerText);
    if (!codes.length && el.tagName === "PRE") codes = [el.innerText];
    return {
      text: (el.innerText || "").trim(),
      codeText: codes.join("\n\n").trim(),
      id: el.getAttribute("data-message-id") || ""
    };
  }

  // Latest assistant reply. ChatGPT changes its markup often, so there are fallbacks:
  // 1) [data-message-author-role="assistant"]  2) the last conversation turn with a code block
  // 3) the last <pre> code block on the page (user messages never render code blocks).
  function latestReplyNode() {
    const msgs = assistantMessages();
    if (msgs.length) return msgs[msgs.length - 1];
    const pres = Array.from(document.querySelectorAll("main pre, pre"));
    const pre = pres[pres.length - 1];
    if (!pre) return null;
    return pre.closest('[data-message-id], [data-testid^="conversation-turn"], article') || pre;
  }

  // A visible error / limit message from the AI page (so a silent failure is reported, not waited for).
  const ERR_RE = /something went wrong|try again later|reached (your|the) (usage )?limit|usage limit|limit reached|can'?t (help|process)|couldn'?t (process|generate)|unable to (process|generate)|too many requests|حدث خطأ|حصل خطأ|وصلت (إلى )?الحد|الحد الأقصى|حاول مرة أخرى|une erreur s'est produite|limite (d'utilisation )?atteinte|réessayez/i;
  function pageError() {
    try {
      const last = latestReplyNode();
      const cands = [];
      if (last && !last.querySelector("pre")) cands.push((last.innerText || "").trim());
      for (const el of document.querySelectorAll('[role="alert"], [role="status"], snack-bar-container, .error-message, .error-container, message-content .error')) cands.push((el.innerText || "").trim());
      for (const t of cands) if (t && t.length < 400 && ERR_RE.test(t)) return t.slice(0, 200);
    } catch {}
    return "";
  }

  function readLatest() {
    const last = latestReplyNode();
    const m = readMessage(last);
    return {
      ok: true,
      generating: isGenerating(),
      pageError: pageError(),
      hasMessage: !!last,
      preCount: document.querySelectorAll("pre").length,
      // Every code block of the conversation, in order (user messages never render code blocks),
      // so a reply that was missed while the extension was reloading is still picked up.
      blocks: replyBlocks(),
      msgCount: assistantMessages().length,
      messageId: m.id,
      text: m.text,
      codeText: m.codeText,
      url: location.href
    };
  }

  async function waitFor(fn, timeoutMs, stepMs = 250) {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
      const v = fn();
      if (v) return v;
      await sleep(stepMs);
    }
    return null;
  }

  function composerText(el) {
    return el.tagName === "TEXTAREA" ? el.value : el.innerText || "";
  }

  function insertText(el, text) {
    el.focus();
    if (el.tagName === "TEXTAREA") {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
      setter.call(el, text);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }
    // ProseMirror editor: a paste event keeps line breaks intact.
    const dt = new DataTransfer();
    dt.setData("text/plain", text);
    el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
    if (!composerText(el).includes(text.slice(0, 30))) {
      document.execCommand("selectAll", false, null);
      document.execCommand("insertText", false, text);
    }
  }

  async function sendPrompt(text, sendWaitMs = 8000) {
    const composer = await waitFor(() => q(COMPOSER_SELECTORS), 25000);
    if (!composer) return { ok: false, error: "مش لاقي خانة الكتابة. هل إنت مسجّل دخول؟" };

    const before = userMessageCount();
    insertText(composer, text);
    await sleep(400);
    if (!composerText(composer).includes(text.slice(0, 30))) {
      return { ok: false, error: "ما قدرتش أكتب البرومبت." };
    }

    const send = await waitFor(() => {
      const b = q(SEND_SELECTORS);
      return b && !b.disabled ? b : null;
    }, sendWaitMs);
    if (!send) return { ok: false, error: "زر الإرسال مش متاح." };
    send.click();

    // Sent when the composer empties or a new user message appears (works across ChatGPT layouts).
    const sent = await waitFor(() => userMessageCount() > before || composerText(q(COMPOSER_SELECTORS) || composer).trim().length < 5, 10000);
    if (!sent) return { ok: false, error: "البرومبت ما ظهرش في المحادثة." };
    return { ok: true, url: location.href };
  }

  // ---------- attach a file (the segment .wav) and send it with its prompt ----------
  function b64ToFile(b64, name, mime) {
    const bin = atob(b64), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return new File([u8], name, { type: mime });
  }
  function fileInputs() {
    return Array.from(document.querySelectorAll('input[type="file"]'))
      .filter((i) => !i.accept || /audio|\*|\.wav/i.test(i.accept) || !/^image\//.test(i.accept));
  }
  // The page shows the attached file (its name, maybe cut, or an attachment chip).
  let attachBase = null;
  function attachSig(name) {
    const base = name.replace(/\.wav$/i, "");
    const text = document.body.innerText;
    const hits = text.split("poliwag_seg").length - 1;
    const chips = document.querySelectorAll('[data-testid*="attachment" i], [class*="attachment" i], [aria-label*="poliwag_seg" i], [title*="poliwag_seg" i], uploader-file-preview, .file-preview, [data-test-id*="file" i]').length;
    return { full: text.includes(base), hits, chips };
  }
  function attachmentShown(name) {
    const s = attachSig(name);
    if (!attachBase) return s.full;
    return s.full || s.hits > attachBase.hits || s.chips > attachBase.chips;
  }
  async function attachFile(file, composer) {
    attachBase = attachSig(file.name);
    const dt = () => { const d = new DataTransfer(); d.items.add(file); return d; };
    // 1) the page's own file input (ChatGPT)
    for (const input of fileInputs()) {
      try {
        input.files = dt().files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
        if (await waitFor(() => attachmentShown(file.name), 4000)) return true;
      } catch {}
    }
    // 2) paste the file into the composer (Gemini, ChatGPT)
    composer.focus();
    composer.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt(), bubbles: true, cancelable: true }));
    if (await waitFor(() => attachmentShown(file.name), 5000)) return true;
    // 3) drop it on the composer
    for (const target of [composer, composer.closest("form") || composer.parentElement, document.querySelector("main") || document.body]) {
      if (!target) continue;
      const d = dt();
      for (const type of ["dragenter", "dragover", "drop"]) {
        target.dispatchEvent(new DragEvent(type, { dataTransfer: d, bubbles: true, cancelable: true }));
      }
      if (await waitFor(() => attachmentShown(file.name), 4000)) return true;
    }
    return false;
  }
  async function sendFile(msg) {
    const composer = await waitFor(() => q(COMPOSER_SELECTORS), 25000);
    if (!composer) return { ok: false, error: "مش لاقي خانة الكتابة. هل إنت مسجّل دخول؟" };
    const file = b64ToFile(String(msg.b64 || ""), String(msg.name || "segment.wav"), msg.mime || "audio/wav");
    if (!(await attachFile(file, composer))) {
      return { ok: false, error: (IS_GEMINI ? "Gemini" : "ChatGPT") + " ما قبلش ملف الصوت." };
    }
    // Give the upload time to finish completely before sending (15 s, 20 s for a long audio):
    // sending too early can send a file that is not fully loaded.
    const settle = Math.max(0, Math.min(60000, Number(msg.waitMs) || 0));
    if (settle) await sleep(settle);
    // Then, as soon as the upload has finished, send: the Send button is usable and nothing is loading
    // in the message box (only the box is checked, not the whole page).
    const box = composer.closest("form") || composer.closest("rich-textarea")?.parentElement?.parentElement || composer.parentElement?.parentElement || document.body;
    const loading = () => box.querySelector('[role="progressbar"], .animate-spin, mat-progress-spinner, mat-spinner, [aria-busy="true"], .loading');
    const ready = () => { const b = q(SEND_SELECTORS); return b && !b.disabled && b.getAttribute("aria-disabled") !== "true" && !loading() ? b : null; };
    const text = String(msg.text || "");
    if (text) { await waitFor(ready, 60000, 150); return sendPrompt(text, 60000); }
    const before = userMessageCount();
    // Sent = a new user message, or the file is no longer in the message box, or the AI is answering.
    // (The file name also shows in the conversation once sent, so only the box is looked at.)
    const base = file.name.replace(/\.wav$/i, "");
    const inBox = () => {
      const t = box.innerText || "";
      return t.includes(base) || !!box.querySelector('[aria-label*="poliwag_seg" i], [title*="poliwag_seg" i], uploader-file-preview, .file-preview, [data-testid*="attachment" i]');
    };
    const answering = () => !!document.querySelector('button[aria-label*="Stop" i], button[aria-label*="Arrêter" i], button.stop, [data-testid="stop-button"]');
    // (only use "left the box" if the file could be seen in the box at all)
    const seenInBox = inBox();
    const isSent = () => userMessageCount() > before || (seenInBox && !inBox()) || answering();
    // Wait until Send is open AND nothing is loading, steadily for 1.5 s (upload really finished),
    // then click Send ONE time only, and just wait for it to go.
    const end = Date.now() + 90000;
    let clicked = false, okSince = 0;
    while (Date.now() < end && !isSent()) {
      const b = ready();
      if (!b) { okSince = 0; await sleep(150); continue; }
      if (!okSince) okSince = Date.now();
      if (Date.now() - okSince < 1500) { await sleep(150); continue; }
      b.click(); clicked = true;
      await waitFor(isSent, 30000, 150);
      break; // never a second click (it could stop the AI's answer)
    }
    // it may have been sent already (the page sent it, or it left the box): that is a success, not an error
    if (!clicked && isSent()) return { ok: true, url: location.href };
    if (!clicked) {
      // Send never opened. Only if the file is still in the message box, send it with its name;
      // never send the name alone (the AI would answer without having the audio).
      if (seenInBox && inBox()) return sendPrompt(file.name, 8000);
      return { ok: false, error: "ملف الصوت مش موجود في خانة الرسالة — ما اتبعتش، جرّب إرسال تاني." };
    }
    if (!isSent()) return { ok: false, error: "الصوت ما ظهرش في المحادثة." };
    return { ok: true, url: location.href };
  }

  // ---------- messages from the extension ----------
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === "PA_HAS_TEXT") {
      sendResponse({ ok: true, found: document.body.innerText.includes(String(msg.text || "")) });
      return false;
    }
    if (msg?.type === "PA_PING") {
      sendResponse({ ok: true, url: location.href });
      return false;
    }
    if (msg?.type === "PA_READ_LATEST") {
      sendResponse(readLatest());
      return false;
    }
    if (msg?.type === "PA_SEND_FILE") {
      sendFile(msg).then(sendResponse, (e) => sendResponse({ ok: false, error: String(e) }));
      return true; // async
    }
    if (msg?.type === "PA_SEND_PROMPT") {
      sendPrompt(String(msg.text || "")).then(sendResponse, (e) => sendResponse({ ok: false, error: String(e) }));
      return true; // async
    }
    return false;
  });

  // ---------- watch for finished replies ----------
  let lastReported = "";
  let lastSeen = "";
  let stableTicks = 0;
  let lastUrl = location.href;

  function report() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      chrome.runtime.sendMessage({ type: "PA_CHAT_URL", url: location.href }).catch(() => {});
    }
    const r = readLatest();
    if (!r.hasMessage || r.generating) { stableTicks = 0; return; }
    const sig = r.messageId + "|" + r.text.length + "|" + r.text.slice(-80);
    if (sig !== lastSeen) { lastSeen = sig; stableTicks = 0; return; }
    stableTicks++;
    // Same text for 2 ticks and no Stop button: the reply is finished.
    if (stableTicks >= 2 && sig !== lastReported) {
      lastReported = sig;
      chrome.runtime.sendMessage({ type: "PA_REPLY_FINISHED", ...r }).catch(() => {});
    }
  }

  setInterval(report, 700);
  chrome.runtime.sendMessage({ type: "PA_CHAT_URL", url: location.href }).catch(() => {});
})();

