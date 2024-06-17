// function injectTestofillContentScript() {
//   return chrome.scripting.registerContentScripts([{
//     id: "testofill",
//     js: ["content/lib/sizzle-20140125.min.js",
//       "content/lib/underscore-min.js",
//       "content/lib/chance.min.js",
//       "content/generative.js",
//       "content/testofill-run.js",
//       "content/delme_alert.js"
//     ],
//     // runAt: "document_start", persistAcrossSessions: "yes", 
//     matches: ["http://*/*", "https://*/*"],
//   }])
//   .catch((err) => {
//     console.error(`failed to register content scripts: ${err}`);
//     throw err;
//    });
// }

function tabDomainPermission(tab) {
  return { origins: [`${new URL(tab.url).origin}/*`] };
}
/** Call directly upon user's interaction (not e.g. in a .then)
 * to check for / request permissions to the current domain
 * <=> content script injected.
 * Returns true/false.
*/
export function ensureDomainPermission(tab) {
  // FIXME Right after permissions are granted, the auto-injected content script
  // isn't immediately avail., so we cannot continue with 
  // the action and the user needs to retry.
  return chrome.permissions.request(tabDomainPermission(tab))
}
export function hasDomainPermission(tab) {
  return chrome.permissions.contains(tabDomainPermission(tab))
}


export async function sendMessageToContentScript(tab, messageId, payload) {
  // Why did we ever inject the script, if the manifest asks Ch. to load if
  // for us? Note: instead of loading it statically as we do now, we could
  // inject it dynamically like we do here - perhaps would need fewer permissions
  // then? See https://medium.com/@fullstackmatt/injecting-content-scripts-in-chrome-extensions-statically-vs-programmatically-763ba90e6fc3
  // return chrome.scripting.executeScript({
  //   target: { tabId: tab.id, allFrames: true },
  //   files: ["generated/testofill-content-packed.js"]
  // }) 
  //await injectTestofillContentScript();
  try {
    // const scripts = await chrome.scripting.getRegisteredContentScripts();
    // const scriptIds = scripts.map(script => script.id);
    // console.log("Registered content scripts:", scriptIds);
    // Note: There is 1 cont. script per domain allowed, and 
    // it has a long name containing somewhere the origin
    // webext-dynamic-content-script-{"js":["/content/lib/sizzle-20140125.min.js","/content/lib/underscore-min.js","/content/lib/chance.min.js","/content/generative.js","/content/testofill-run.js"],"css":[],"allFrames":true,"matches":["https://duckduckgo.com/*"],"runAt":"document_idle"}

    const resp = await chrome.tabs.sendMessage(tab.id, { id: messageId, payload: payload });
    console.debug("Response from content script for", messageId, resp);
    return resp;
  } catch (err) {
    console.error("Failed to send message to content script:", err.message);
    // FIXME This likely means the user had not granted us host permissions
    // on this domain => ask them!
    throw err;
  }
}
// Of interest:
// const scripts = await chrome.scripting.getRegisteredContentScripts();
//     const scriptIds = scripts.map(script => script.id);
//     return chrome.scripting.unregisterContentScripts(scriptIds);

// FIXME study https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/api-samples/scripting
// FIXME !!!! see https://stackoverflow.com/a/57336499