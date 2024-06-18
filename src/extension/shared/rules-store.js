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
      } else {
        //console.debug("No match for %s in %s", currentUrl, urlRE);
      }
    }
  }

  return [];
}

export async function saveRulesToStorage(rules) {
  await chrome.storage.local.set({ 'testofill.rules': rules });
  if (typeof chrome.runtime.lastError === "undefined") {
    return true;
  } else {
    // F.ex. due to {message: "QUOTA_BYTES_PER_ITEM quota exceeded"} // 4kB
    var error = chrome.runtime.lastError.message + " when trying to save " +
      JSON.stringify(rules).length + 'testofill.rules'.length + " B";
    console.log("FAILED to store rules due to %s; rules: ",
      error,
      rules);
    throw new Error(error);
  }
}
