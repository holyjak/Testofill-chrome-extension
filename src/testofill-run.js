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
        fillField(inputElm, field);
      });
    }
  });

  if (unmatchedSelectors.length > 0) {
    console.log("Warning: some fields matched nothing in the set named " +
                ruleSet.name
                , unmatchedSelectors);
  }

}

/* Apply rule to a field to fill it (exec. for each matching field, e.g. radio). */
function fillField(fieldElm, fieldRule) {
  if (fieldElm.type === 'checkbox') {
    fieldElm.checked = fieldRule.value;
  } else if (fieldElm.type === 'select-one') { // TODO select multi too
    console.log("WARN: selects not yet supported");
  } else if (fieldElm.type === 'radio') {
    fieldElm.checked = (fieldElm.value === fieldRule.value);
    // find the one with matching value or unset all
    console.log("WARN: radio not yet supported");
  } else {
    fieldElm.value = fieldRule.value;
  }
}

// Listen for message from the popup with the selected ruleSet
chrome.runtime.onMessage.addListener(function(ruleSet, sender, sendResponseFn){
  //console.log("Msg retrieved; sender is extension: ", !sender.tab, ruleSet);
  var fromExtension = !sender.tab;
  if (fromExtension) fillForms(ruleSet)
});
