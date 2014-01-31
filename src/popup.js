
function sendMessage() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var lastTabId = tabs[0].id;
    chrome.tabs.sendMessage(lastTabId, "Background page started.");
  });
}

function renderRuleSetSelection(ruleSets) {
  var ruleSetList = document.getElementById("ruleSetList");
  var tpl = document.getElementById("template");

  ruleSets.forEach(function(ruleSet){
    var item = tpl.cloneNode(true);
    item.innerHTML = ruleSet.name + " - " + ruleSet.doc;
    ruleSetList.appendChild(item);
  });

  tpl.style.display = 'none'; // hide it
 // TODO is the list reset when popup redislayed?
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

function sendMessageToContentScript(tab) {
    chrome.tabs.executeScript(tab.id, {file: "sizzle-20140125.min.js"}, function() {
      chrome.tabs.executeScript(tab.id, {file: "testofill-run.js"}, function() {
        // Note: we also sent a message above, upon loading the event page,
        // but the content script will not be loaded at that point, so we send
        // another here.
        sendMessage();
      });
    });
}

document.addEventListener('DOMContentLoaded', function() {
  //document.querySelector('#button').addEventListener(      'click', sendRequest);
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {

    var tab = tabs[0];

    findMatchingRules(tab.url, function(ruleSets) {
      renderRuleSetSelection(ruleSets);
    });
    sendMessageToContentScript(tab);
  });
});
