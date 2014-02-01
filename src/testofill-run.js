/* Apply the selected rule set to the current page, filling its form(s).
 * ruleSet ex.: {"name":"kid user test", "fields":
 *  [{"query": "[name='q']", "value": "Hi!"}]}
 *
 */
function fillForms(ruleSet) {
  if (typeof ruleSet === 'undefined') return;

  var unmatchedSelectors = [];
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

/* Get the rules and try to apply them to this page, if matched */
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

// Listen for message from the popup with the selected ruleSet
chrome.runtime.onMessage.addListener(function(ruleSet, sender, sendResponseFn){
  //console.log("Msg retrieved; sender is extension: ", !sender.tab, ruleSet);
  var fromExtension = !sender.tab;
  if (fromExtension) fillForms(ruleSet)
});

//
// TODO Remove this when autcomplete implemented properl, w/o randomly picking the 1st ruleset
//
function fillFormsUsingFirstRuleSet(ruleSets) {
  if (ruleSets.length === 0) return;
  fillForms(ruleSets[0]);
}
findMatchingRules(document.location.href, fillFormsUsingFirstRuleSet);
