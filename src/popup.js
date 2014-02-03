// Render the select of available rule sets
function renderRuleSetSelection(ruleSets) {
  var ruleSetList = document.getElementById("ruleSetList");
  ruleSetList.size = ruleSets.length;

  ruleSets.forEach(function(ruleSet, idx){
    var label = ruleSet.name + (ruleSet.doc ? " - " + ruleSet.doc : "");
    ruleSetList.add(new Option(label, idx));
  });
}

// Get the selected ruleSet, send message to the content script to apply it
function handleRuleSetSelected(evt, tab, ruleSets) {
  event.preventDefault();
  var select = evt.target;
  var ruleSetIdx = select.value;

  var ruleSet = ruleSets[ruleSetIdx];

  chrome.runtime.getBackgroundPage(function(bp){
    bp.sendMessageToContentScript(tab, ruleSet);
    window.close();
  });
}

/* Find defined ruleSets matching this URL */
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

function renderForTab(tab) {
  findMatchingRules(tab.url, function(ruleSets) {
    renderRuleSetSelection(ruleSets);
    document.querySelector('#ruleSetList').addEventListener('change', function(evt){
      handleRuleSetSelected(evt, tab, ruleSets);
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  var tabIdFromUrl = window.location.hash.substring(1);
  if (tabIdFromUrl) {
    // Opened from ctx menu
    chrome.tabs.get(parseInt(tabIdFromUrl), function(tab) {
      renderForTab(tab);
    });
  } else {
    // Opened from browserAction icon
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      var tab = tabs[0];
      renderForTab(tab);
    });
  }
});
