//---------------------------------------------------------------- ruleSets & content
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

function sendMessageToContentScript(tab, message) {
    chrome.tabs.executeScript(tab.id, {file: "sizzle-20140125.min.js"}, function() {
      chrome.tabs.executeScript(tab.id, {file: "testofill-run.js"}, function() {
        chrome.tabs.sendMessage(tab.id, message);
      });
    });
}

//---------------------------------------------------------------- listeners

function ctxMenuHandler(info, tab) {
  // The default popup if no matching rules:
  chrome.windows.create({ url: 'no-rulesets.html', type: 'popup', width: 300, height: 200});

  // TODO use frame url if defined
  findMatchingRules(tab.url, function(ruleSets){
    if (ruleSets.length == 0) {
      // this handler currently not called if no rulesets
      chrome.windows.create({ url: 'no-rulesets.html', type: 'popup', width: 300, height: 200});
    } else if (ruleSets.length == 1) {
      // Apply directly
      sendMessageToContentScript(tab, ruleSets[0]);
    } else {
      // Show popup // TODO does not work; also, open rather popup not full window
      chrome.windows.create({ url: 'popup.html#' + tab.id, type: 'popup', width: 350, height: 200});
    }
  });
}

/* Set # ruleSets on icon when tab/url changes, set popup */
function setBadgeAndIconAction(tabId, ruleSets) {
  // When 1+ sets => show in the badge; tabId => shows only when this tab active
  chrome.browserAction.setBadgeText({tabId: tabId, text: ruleSets.length.toString()});
  chrome.browserAction.setBadgeBackgroundColor({tabId: tabId, color: '#04B4AE'});

  // If 2+ rule sets => set popup (replaces the default browserAction.onCliked action set below)
  if (ruleSets.length > 1) {
    chrome.browserAction.setPopup({tabId: tabId, popup: 'popup.html'});
  } else {
    chrome.browserAction.setPopup({tabId: tabId, popup: ''}); // remove the popup, if any (needed????)
  }
}

function triggerAutofillingIfEnabled(tab, ruleSets) {
  // todo check if autofill enabled ...
  sendMessageToContentScript(tab, ruleSets[0]); // TODO Defaulting to 1st ruleSet not so smart?
}

/*
 * When new URL loaded: Set # ruleSets on icon when tab/url changes, set popup, trigger auto-fill.
 *
 * BEWARE: Seems not to be triggered for cached pages.
 */
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.url) {
    // Default badge/popup if no matching rulesets
    chrome.browserAction.setBadgeText({tabId: tabId, text: 'N/A'});
    chrome.browserAction.setBadgeBackgroundColor({tabId: tabId, color: '#808080'});
    chrome.browserAction.setPopup({tabId: tabId, popup: 'no-rulesets.html'});

    findMatchingRules(changeInfo.url, function(ruleSets){
      setBadgeAndIconAction(tabId, ruleSets);
      triggerAutofillingIfEnabled(tab, ruleSets);
    });
  }
  // Note: changeInfo.status loading/complete/undefined; url only while 'loading'
  // - Not triggered when another tab activated (i.e. switching tabs)
  // - Also triggered for new tab, url=chrome://newtab/
  // - Also triggered when navigating to an anchor on the same page or back
});

/* Only triggered if there is 0-1 ruleSets (i.e. of there is no popup win). */
chrome.browserAction.onClicked.addListener(function(tab){
  findMatchingRules(tab.url, function(ruleSets){
    sendMessageToContentScript(tab, ruleSets[0]);
  });
});

chrome.contextMenus.onClicked.addListener(ctxMenuHandler);

// Set up context menu tree at install time.
chrome.runtime.onInstalled.addListener(function() {
 chrome.contextMenus.create({"title": "Testofill this!",
                             "contexts":["page", "frame"],
                             "id": "1"});
});
