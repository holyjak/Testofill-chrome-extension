export function sendMessageToContentScript(tab, messageId, payload) {
  // Beware - there is an issue here:
  // We re-insert the script every time, even if already inserted (could lead to duplicate listeners etc.)
  // Could be fixed by sending msg first and only exec. script if it fails (b/c not inserted yet).
  // Notice that when the plugin is updated, it also needs to re-insert the content script (communication will fail)
  return chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["generated/testofill-content-packed.js"]
  })
    .then(() => chrome.tabs.sendMessage(tab.id, { id: messageId, payload: payload }));
}