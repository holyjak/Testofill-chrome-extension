/** Entry point for initializing the matching ruleSets select for the given tab */
function renderForTab(tab) {
  findMatchingRules(tab.url, function(ruleSets) {
    renderRuleSetSelection(ruleSets);
    document.querySelector('#ruleSetList').addEventListener('change', function(evt){
      handleRuleSetSelected(evt, tab, ruleSets);
    });
  });
}

/* Find defined ruleSets matching this URL */
function findMatchingRules(currentUrl, ruleSetsCallback) {
  chrome.runtime.getBackgroundPage(function(eventsWin){
    eventsWin.findMatchingRules(currentUrl, ruleSetsCallback);
  });
}
/** Fill in the rule set <select> with the given ruleSets */
function renderRuleSetSelection(ruleSets) {
  var ruleSetList = document.getElementById("ruleSetList");
  ruleSetList.size = ruleSets.length;

  ruleSets.forEach(function(ruleSet, idx){
    var label = ruleSet.name + (ruleSet.doc ? " - " + ruleSet.doc : "");
    ruleSetList.add(new Option(label, idx));
  });
}

/** Get the selected ruleSet, send message to the content script to apply it */
function handleRuleSetSelected(evt, tab, ruleSets) {
  event.preventDefault();
  var select = evt.target;
  var ruleSetIdx = select.value;

  var ruleSet = ruleSets[ruleSetIdx];

  chrome.runtime.getBackgroundPage(function(bp){
    bp.sendMessageToContentScript(tab, "fill_form", ruleSet);
    window.close();
  });
}

// Trigger renderForTab when loaded
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
