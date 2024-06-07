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
    await chrome.tabs.sendMessage(tab.id, { id: messageId, payload: payload });
  } catch (err) {
    console.error("Failed to send message to content script:", err.message);
    throw err;
  }
}
// Of interest:
// const scripts = await chrome.scripting.getRegisteredContentScripts();
//     const scriptIds = scripts.map(script => script.id);
//     return chrome.scripting.unregisterContentScripts(scriptIds);

// FIXME study https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/api-samples/scripting
// FIXME !!!! see https://stackoverflow.com/a/57336499