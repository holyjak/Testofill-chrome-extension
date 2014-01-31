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
    var fieldElms = $(field.query);
    if (fieldElms.length === 0) {
      unmatchedSelectors.push(field);
    } else {
      fieldElms.val(field.value);
    }
  });

  if (unmatchedSelectors.length > 0) {
    console.log("Warning: some fields matched nothing in the set named " +
                ruleSet.name
                , unmatchedSelectors);
  }

}

// Get the rules and try to apply them to this page, if matched
chrome.storage.sync.get('testofill.rules', function(items) {
  if (typeof chrome.runtime.lastError === "undefined") {
    var rules = items['testofill.rules'];
    for (var urlRE in rules.forms) {
      if (document.location.href.match(new RegExp(urlRE))) {
        fillForms(rules.forms[urlRE]);
      }
    }
  } else {
    console.log("ERROR Run.js: Rules loading failed", chrome.runtime.lastError);
  }
});
