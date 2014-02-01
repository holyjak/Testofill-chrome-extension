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

  sendMessageToContentScript(tab, ruleSet);
  window.close();
}

// TODO Do not copy, reuse from run.js
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

function sendMessageToContentScript(tab, message) {
    chrome.tabs.executeScript(tab.id, {file: "sizzle-20140125.min.js"}, function() {
      chrome.tabs.executeScript(tab.id, {file: "testofill-run.js"}, function() {
        chrome.tabs.sendMessage(tab.id, message);
      });
    });
}

document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var tab = tabs[0];
    findMatchingRules(tab.url, function(ruleSets) {
      renderRuleSetSelection(ruleSets);
      document.querySelector('#ruleSetList').addEventListener('change', function(evt){
        handleRuleSetSelected(evt, tab, ruleSets);
      });
    });
  });
});
