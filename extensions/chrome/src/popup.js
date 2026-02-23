const applyButton = document.getElementById("apply");
const payloadElement = document.getElementById("payload");

applyButton?.addEventListener("click", async () => {
  try {
    const payload = JSON.parse(payloadElement.value || "{}");
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    await chrome.tabs.sendMessage(tab.id, {
      type: "SLACKBRACKET_APPLY",
      payload
    });
  } catch (error) {
    console.error("Unable to apply picks", error);
  }
});
