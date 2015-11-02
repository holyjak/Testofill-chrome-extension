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
    fieldElm.checked = fieldRule.value;
  } else if (fieldElm.type === 'select-one') {
    for(var i = fieldElm.length - 1; i >= 0; i--) {
      var opt = fieldElm[i];
      opt.selected = (opt.value === fieldRule.value);
    }
  } else if (fieldElm.type === 'select-multiple') {
    var value = (fieldRule.value === null)? [] : fieldRule.value;
    if (!Array.isArray(value)) {
      console.error("The form element is a select-multiple and thus the value " +
        "to fill in should be an array of 0+ values but it is not an array; " +
                    "query: " + fieldRule.query + ", the value: ", value,
                    "; the field: ", fieldElm);
      return;
    }
    for(var j = fieldElm.length - 1; j >= 0; j--) {
      var multiOpt = fieldElm[j];
      multiOpt.selected = (value.indexOf(multiOpt.value) >= 0);
    }
  } else if (fieldElm.type === 'radio') {
    fieldElm.checked = (fieldElm.value === fieldRule.value);
    // find the one with matching value or unset all
  } else if (fieldRule.textContent) {
    fieldElm.textContent = fieldRule.textContent; // labels, text elements
  } else {
    fieldElm.value = fieldRule.value;
  }
  
  var eventName = "change";
  if(fieldElm.type === 'checkbox'){
    eventName = "click";
  }
  
  if ("createEvent" in document) {
      var evt = document.createEvent("HTMLEvents");
      evt.initEvent(eventName, true, true);
      fieldElm.dispatchEvent(evt);
  }
  else
      fieldElm.fireEvent("on" + eventName);
  }

//---------------------------------------------------------------------- SAVE FORM

/**
 * Find all forms on the page, create query+value pair for each relevant field,
 * return an array of {name: .., fields: [..]} that can be merged into the existing config.
 */
function makeTestofillJsonFromPageForms() {
  var excludedTypes = ['button', 'submit', 'reset', 'form', 'hidden'];
  var debugStrs = [];

  var formListJson =
    _.map(document.forms, function(form){
      var formName = "TODO Name this " + form.id;
      var fieldElms = Sizzle(":input", form); // Find inputs and  textareas, selects, and buttons:

      var fieldElmsOnlyRelevant = _.filter(fieldElms, function(f) {
            return f.name !== "" &&
              f.value !== '' &&
              excludedTypes.indexOf(f.type) === -1 &&
              !f.disabled &&
              !f.readonly;
          });

      var jsonFieldsAll = _.chain(fieldElmsOnlyRelevant)
          .groupBy('name') // group f.ex. radios into one array
          .map(_.values) // turn {'fieldName': [field1, field2,...]} into just the array of fields
          .map(function(inputGrp) {
            return {"query": makeQueryFrom(inputGrp[0]), "value": makeValueFrom(inputGrp)};
          })
          .value();

      // Filter out checkboxes not selected, ...
      var jsonFieldsOnlySet = _.filter(jsonFieldsAll, function(rule) {return rule.value !== false;});

      debugStrs.push("Form " + form.id + ": out of " +
        fieldElms.length + " fields, " +
        (fieldElms.length - fieldElmsOnlyRelevant.length) +
        " were irrelevant (no name or value / disabled / type such as hidden) and " +
        (jsonFieldsAll.length - jsonFieldsOnlySet.length) + " were exluded due to having value of false");

      return {"name": formName, "fields": jsonFieldsOnlySet};
    });

  var formsNonempty = formListJson.filter(function(f) {
    return f.fields.length > 0;
  });

  if (formsNonempty.length < formListJson.length) {
    debugStrs.push("Also, " + (formListJson.length - formsNonempty.length) +
      " forms were skipped for they had no relevant fields");
  }

  console.log("Report for Save forms at %s: ", document.location.toString(), debugStrs);

  return formsNonempty;
}

function makeQueryFrom(input) {
  return "[name='" + input.name + "']";
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
    return fieldElm.selectedOptions[0].value; // TODO if none selected?
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
    sendResponseFn(makeTestofillJsonFromPageForms());
  } else if (message.id === "extracted_forms_saved") {
    alert("Input from " + payload.count + " forms has been saved for " + payload.url + "\n(See console log for details)");
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
