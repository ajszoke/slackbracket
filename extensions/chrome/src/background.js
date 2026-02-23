chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SLACKBRACKET_AUTOFILL_RESULT") {
    sendResponse({ ok: true });
  }
});
