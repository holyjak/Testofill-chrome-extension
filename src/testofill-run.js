/* Apply the selected rule set to the current page, filling its form.
 * ruleSets ex.: [{"name":"kid user test", "fields":
 *  [{"query": "[name='q']", "value": "Hi!"}]}]
 *
 */
function fillForms(ruleSets) {
  if (ruleSets.length === 0) return;

  var unmatchedSelectors = [];
  var ruleSet = ruleSets[0]; // TODO use the set select by the user / default to 1st

  ruleSet.fields.forEach(function(field) {
    var fieldElms = Sizzle(field.query);
    if (fieldElms.length === 0) {
      unmatchedSelectors.push(field);
    } else {
      fieldElms.forEach(function(inputElm) {
        inputElm.value = field.value;
      });
    }
  });

  if (unmatchedSelectors.length > 0) {
    console.log("Warning: some fields matched nothing in the set named " +
                ruleSet.name
                , unmatchedSelectors);
  }

}

// Get the rules and try to apply them to this page, if matched
function findMatchingRules(currentUrl, ruleSetsCallback) {
  chrome.storage.sync.get('testofill.rules', function(items) {
    if (typeof chrome.runtime.lastError === "undefined") {
      var rules = items['testofill.rules'];
      for (var urlRE in rules.forms) {
        if (currentUrl.match(new RegExp(urlRE))) {
          ruleSetsCallback(rules.forms[urlRE]);
        }
      }
    } else {
      console.log("ERROR Run.js: Rules loading failed", chrome.runtime.lastError);
    }
  });
}

findMatchingRules(document.location.href, fillForms);


// listen for  runtime.onMessage
chrome.runtime.onMessage.addListener(function(request, sender, sendResponseFn){
  console.log("Msg retrieved; sender is extension: ", !sender.tab, "req", request);
});

chrome.runtime.onMessage.addListener(function(msg, _, sendResponse) {
  console.log("Got message from background page: " + msg);
});
