// Sam Poliwag Assist v2 — popup: turns the top bar on for the Poliwag site, or hides / shows it.

const $ = (id) => document.getElementById(id);
let tab = null;
let origin = null;

function showError(text) {
  $("msg").textContent = text;
  $("msg").hidden = !text;
}

async function hiddenSetting() {
  const d = await chrome.storage.local.get("pa_state");
  return !!d.pa_state?.settings?.barHidden;
}

async function render() {
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url || "";
  $("ver").textContent = chrome.runtime.getManifest().version;

  if (!/^https:\/\//.test(url) || /^https:\/\/(chatgpt\.com|gemini\.google\.com)\//.test(url)) {
    $("where").textContent = "Ouvrez la page Poliwag (Maven), puis cliquez de nouveau sur l'icône.";
    $("need").hidden = true;
    $("active").hidden = true;
    return;
  }

  origin = new URL(url).origin;
  $("where").innerHTML = "";
  $("where").append("Site : ", Object.assign(document.createElement("span"), { className: "host", textContent: new URL(url).host }));

  const granted = await chrome.permissions.contains({ origins: [origin + "/*"] });
  $("need").hidden = granted;
  $("active").hidden = !granted;
  $("btn-toggle").textContent = (await hiddenSetting()) ? "Afficher la barre" : "Masquer la barre";
}

$("btn-enable").addEventListener("click", async () => {
  showError("");
  try {
    const ok = await chrome.permissions.request({ origins: [origin + "/*"] });
    if (!ok) return showError("Autorisation refusée — la barre ne peut pas s'afficher sur ce site.");
    // The background registers the bar for this site; show it right away in this tab too.
    await chrome.runtime.sendMessage({ type: "PA_SYNC_BAR" });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["bar.js"] }).catch(() => {});
    await chrome.runtime.sendMessage({ type: "PA_SET_BAR_HIDDEN", hidden: false });
    render();
  } catch (e) {
    showError(String(e.message || e));
  }
});

$("btn-toggle").addEventListener("click", async () => {
  const hidden = !(await hiddenSetting());
  await chrome.runtime.sendMessage({ type: "PA_SET_BAR_HIDDEN", hidden });
  if (!hidden) await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["bar.js"] }).catch(() => {});
  render();
});

render();
