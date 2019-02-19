/**
 * The Content Script injected into the browser document and
 * invoked by messages from the extension (via event.js).
 * @type {String}
 */

//---------------------------------------------------------------------- FILL FORM
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
                ruleSet.name,
                unmatchedSelectors);
  }

}

/* Apply rule to a field to fill it (exec. for each matching field, e.g. radio). */
function fillField(fieldElm, fieldRule) {
  if (!_.isUndefined(fieldRule.generate)) {
    var tmp = fieldRule.generate ;
    fieldRule.value = parseTopGenExpr(fieldRule.generate);
    console.log("Gen random for field %s => %s, gen: %s", fieldRule.query, fieldRule.value, JSON.stringify(fieldRule.generate), fieldRule, tmp);
  }

  if (fieldElm.type === 'checkbox') {
    assertFieldType(fieldElm.type, fieldRule, 'boolean');
    if (fieldElm.checked === Boolean(fieldRule.value)) return;
    fieldElm.dispatchEvent(new MouseEvent('click', {'view': window,'bubbles': true}));
  } else if (fieldElm.type === 'select-one') { // FIXME reuse select-multi code
    assertFieldType(fieldElm.type, fieldRule, 'string');
    if (fieldElm.value === fieldRule.value) return;
    fieldElm.value = fieldRule.value;
    fieldElm.dispatchEvent(new Event('change', {'view': window,'bubbles': true}));
  } else if (fieldElm.type === 'select-multiple') {
    const value = (fieldRule.value === null) ? [] : fieldRule.value;
    if (!Array.isArray(value)) {
      console.error("The form element is a select-multiple and thus the value " +
        "to fill in should be null or an array of 0+ values but it is not an array; " +
                    "query: " + fieldRule.query + ", the value: ", value,
                    "; the field: ", fieldElm);
      return;
    }
    for(var j = fieldElm.length - 1; j >= 0; j--) {
      var multiOpt = fieldElm[j];
      multiOpt.selected = (value.indexOf(multiOpt.value) >= 0);
    }
    fieldElm.dispatchEvent(new Event('change', {'view': window,'bubbles': true}));
  } else if (fieldElm.type === 'radio') {
    assertFieldType(fieldElm.type, fieldRule, 'string');
    console.assert(fieldRule.value !== null, `null is not supported for radio fields, you must choose a value; rule query=${fieldRule.query}`);
    // find the one with matching value or unset all:
    const wantChecked = (fieldElm.value === fieldRule.value);
    if (wantChecked === fieldElm.checked) return;
    fieldElm.dispatchEvent(new MouseEvent('click', {'view': window,'bubbles': true}));
  } else if (fieldRule.textContent) {
    fieldElm.textContent = fieldRule.textContent; // labels, text elements
    fieldElm.dispatchEvent(new Event('input', {bubbles: true})); // Notify e.g. React of the changed value
 } else { // Typically a text <input>
    fieldElm.value = fieldRule.value;
    fieldElm.dispatchEvent(new Event('input', {bubbles: true})); // Notify e.g. React of the changed value
  }
}

/** Warn if fieldRule.value is not of the expectedType. */
function assertFieldType(fieldType, fieldRule, expectedType) {
  if (fieldRule.value === null) return;
  const actualType = (typeof fieldRule.value === 'object') ?
    fieldRule.value.constructor.name : typeof fieldRule.value;
  if (actualType === expectedType) return true;
  console.assert(
    actualType === expectedType,
    `fieldRule.value for a ${fieldType} must be a ${expectedType} (or null); fieldRule={query: ${fieldRule.query}, value:${fieldRule.value}}`);
  return false;
}

// function elmToString(elm) {
//   if (elm.id) return `[id=${elm.id}]`;
//   if (elm.name) return `[name=${elm.name}]`;
//   if (elm.className) return `[class=${elm.className}]`;
// }

//---------------------------------------------------------------------- SAVE FORM

/**
 * Find all forms on the page, create query+value pair for each relevant field,
 * return an array of {name: .., fields: [..]} that can be merged into the existing config.
 */
function makeTestofillJsonFromPageForms() {
  var excludedTypes = ['button', 'submit', 'reset', 'form', 'hidden'];
  var debugStrs = [];

  var formListJson =
    _.map(document.forms, function(form, idx){
      var formName = "TODO Name this " + form.id;
      var fieldElms = Sizzle(":input", form); // Find inputs and  textareas, selects, and buttons:

      var fieldElmsOnlyRelevant = _.filter(fieldElms, f =>
            (f.name !== "" || f.id !== "") &&
              f.value !== '' &&
              excludedTypes.indexOf(f.type) === -1 &&
              !f.disabled &&
              !f.readonly
          );

      var jsonFieldsAll = _.chain(fieldElmsOnlyRelevant)
          .groupBy(f => f.name ? f.name : f.id) // group all radios with the same value into one array
          .map(_.values) // turn {'fieldName': [field1, field2,...]} into just the array of fields (for that name/id)
          .map(inputGrp => ({"query": makeQueryFrom(inputGrp[0]), "value": makeValueFrom(inputGrp)}))
          .value();

      // Filter out fields with no discernible value, ...
      var jsonFieldsOnlySet = _.filter(jsonFieldsAll, rule => rule.value !== undefined);

      const cntAllFields = fieldElms.length;
      const formIdent = form.id || form.className || '';
      let msg = `Form #${idx} ${formIdent ? `{${formIdent}}` : ''}`;
      if (cntAllFields === 0) {
          debugStrs.push(`${msg} has no fields`);
      } else {
        const cntIrrelevant = (fieldElms.length - fieldElmsOnlyRelevant.length);
        if (cntIrrelevant) msg += ` ${cntIrrelevant}/${cntAllFields} field(s) were irrelevant (no name or value / disabled / type such as hidden)`;
        const cntExcluded = (jsonFieldsAll.length - jsonFieldsOnlySet.length);
        if (cntExcluded) msg += ` ${cntExcluded}/${cntAllFields} field(s) were exluded due to not having any value I could understand`;
        debugStrs.push(`${msg}`);
      }

      return {"name": formName, "fields": jsonFieldsOnlySet};
    });

  var formsNonempty = formListJson.filter(function(f) {
    return f.fields.length > 0;
  });

  if (formsNonempty.length < formListJson.length) {
    debugStrs.push("Also, " + (formListJson.length - formsNonempty.length) +
      " forms were skipped for they had no relevant fields");
  }

  console.log(`Testofill: Report for Save forms of ${formsNonempty.length} out of ${document.forms.length} forms at ${document.location.toString()}: `, debugStrs, "See https://github.com/holyjak/Testofill-chrome-extension/wiki/Help:-Save-forms-saved-input-from-0-forms for help");

  return formsNonempty;
}

function makeQueryFrom(input) {
  return input.name ? "[name='" + input.name + "']" : "[id='" + input.id + "']";
}

function makeValueFrom(inputGrp) {
  if (inputGrp.length > 1) { // group of radio buttons
    return _.chain(inputGrp)
      .where({checked: true})
      .pluck('value')
      .sample() // list to (the only one) single element or undefined
      .value(); // -> undefined if no match
  }

  var fieldElm = inputGrp[0];
  if (fieldElm.type === 'checkbox') {
    return fieldElm.checked;
  } else if (fieldElm.type === 'select-one') {
    return (fieldElm.selectedOptions[0] || {}).value;
  } else if (fieldElm.type === 'select-multiple') {
    return _.pluck(fieldElm.selectedOptions, 'value');
  } else {
    return fieldElm.value;
  }
}

//---------------------------------------------------------------------- LISTENERS

/** Listen for message from the popup or ctx. menu with the selected ruleSet */
function handleMessage(message, sender, sendResponseFn){
  var fromExtension = !sender.tab;
  if (!fromExtension) return;

  var payload = message.payload;

  if (message.id === "fill_form") {
    var ruleSet = payload;
    fillForms(ruleSet);
  } else if (message.id === "save_form") {
    const extractedForms = makeTestofillJsonFromPageForms();
    sendResponseFn(extractedForms);
  } else if (message.id === "extracted_forms_saved") {
    alert("Input from " + payload.count + " forms has been saved for " + payload.url +
      (payload.count ? `\nGive it a name in the extension options if you want multiple values for the form.` : '') +
      "\n(See DevTools Console for details)");
  } else if (message.id === "extracted_forms_save_failed") {
    alert("FAILED to save " + payload.count + " forms extracted from " + payload.url + " due to " + payload.error);
  } else {
    console.log("ERROR: Unsupported message id received: " + message.id, message);
  }

}

// Add listeners - invoked whenever the user presses the browser action icon or when
// we (re)insert the content script => avoid adding the listener if already there
// NOTE: `chrome.runtime.onMessage.hasListener(handleMessage` always returns false?!
if (!chrome.runtime.onMessage.hasListeners()) {
  chrome.runtime.onMessage.addListener(handleMessage);
}
