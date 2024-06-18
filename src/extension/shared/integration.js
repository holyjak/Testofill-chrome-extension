/**
 * Integration between the extension code and the content script,
 * plus permission support.
 */

function tabDomainPermission(tab) {
  return { origins: [`${new URL(tab.url).origin}/*`] };
}
/** Call directly upon user's interaction (not e.g. in a .then)
 * to check for / request permissions to the current domain
 * <=> content script injected.
 * Returns true/false.
*/
export function ensureDomainPermission(tab) {
  // NOTE: Right after permissions are granted, the auto-injected content script
  // isn't immediately avail. => can't continue with the action
  return chrome.permissions.request(tabDomainPermission(tab))
}
export function hasDomainPermission(tab) {
  return chrome.permissions.contains(tabDomainPermission(tab))
}


export async function sendMessageToContentScript(tab, messageId, payload) {
  try {
    const resp = await chrome.tabs.sendMessage(tab.id, { id: messageId, payload: payload });
    console.debug("Response from content script for", messageId, resp);
    return resp;
  } catch (err) {
    console.error("Failed to send message to content script:", err.message, err);
    // This likely means the user had not granted us host permissions
    // on this domain
    throw err;
  }
}
