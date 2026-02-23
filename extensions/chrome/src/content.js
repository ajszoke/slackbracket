chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "SLACKBRACKET_APPLY") return;
  import(chrome.runtime.getURL("src/adapters.js"))
    .then((module) => {
      module.applyPicksForSite(message.payload);
      sendResponse({ ok: true });
    })
    .catch((error) => {
      sendResponse({ ok: false, error: String(error) });
    });
  return true;
});
