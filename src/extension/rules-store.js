/* Get the rules and try to apply them to this page, if matched */
export async function findMatchingRules(currentUrl) {
  const items = await chrome.storage.local.get('testofill.rules');
  
  if (typeof chrome.runtime.lastError !== "undefined") {
    console.log("ERROR Run.js: Rules loading failed", chrome.runtime.lastError);
    throw new Error(`ERROR Run.js: Rules loading failed: ${chrome.runtime.lastError}`);
  }

  var rules = items['testofill.rules'];
  var matchFound = false;

  if (typeof rules !== 'undefined' && typeof rules.forms !== 'undefined') {
    for (var urlRE in rules.forms) {
      if (currentUrl.match(new RegExp(urlRE))) {
        matchFound = true;
        return rules.forms[urlRE];
      }
    }
  }

  return [];
}
