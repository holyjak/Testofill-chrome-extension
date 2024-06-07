import * as rs from "./shared/rules-store.js";
import * as integr from "./shared/integration.js";
import { addPermissionToggle } from './lib/bundled-npm-deps.js';

addPermissionToggle();

/** 
 * An environment that lives independent of any other window or tab,
 * which can observe and act in response to events. In particular, it
 * handles browsing and extension events and invoke the content script
 * (testofill-run.js).
 */

//---------------------------------------------------------------- reusable: ruleSets, content, storage
/* Get the rules and try to apply them to this page, if matched */
async function findMatchingRules(currentUrl, ruleSetsCallback, _callIfNone) {
  rs.findMatchingRules(currentUrl).then(ruleSetsCallback);
}

function sendMessageToContentScript(tab, messageId, payload, responseCallback) {
  integr.sendMessageToContentScript(tab, messageId, payload).then(responseCallback);
}

/**
 * @param rules {object} the full rules JSON object to save
 * @param rules {fn} function to all; params: error {optional} - error message upon failure
 */
function saveRulesToStorage(rules, responseCallback) {
  rs.saveRulesToStorage(rules).then(() => responseCallback()).catch((error) => responseCallback(error));
}
//---------------------------------------------------------------- listeners

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ listeners:menu

function ctxMenuHandler(info, tab) {
  if (info.menuItemId === "fill_form") {
    ctxMenuFillFormHandler(tab);
  } else { // save_form
    ctxMenuSaveFormHandler(tab);
  }
}

function ctxMenuFillFormHandler(tab) {
  // TODO use frame url if defined
  findMatchingRules(tab.url, function (ruleSets) {
    if (ruleSets.length === 0) {
      // this handler currently not called if no rulesets
      chrome.windows.create({ url: 'no-rulesets.html?url=' + encodeURI(tab.url), type: 'popup', width: 400, height: 250 });
    } else if (ruleSets.length == 1) {
      // Apply directly
      sendMessageToContentScript(tab, "fill_form", ruleSets[0]);
    } else {
      // Show popup // TODO does not work; also, open rather popup not full window
      chrome.windows.create({ url: 'popup.html#' + tab.id, type: 'popup', width: 350, height: 200 });
    }
  }, true);
}

function ctxMenuSaveFormHandler(tab) {
  sendMessageToContentScript(tab, "save_form", { tabUrl: tab.url }, forms => mergeIntoOptions(tab, forms));
}

/** Merge the given map with the options.forms map. */
function mergeIntoOptions(tab, forms) {
  if (!forms) return;
  const url = tab.url;

  chrome.storage.local.get('testofill.rules', function (items) {
    if (typeof chrome.runtime.lastError !== "undefined") {
      return; // TODO report error; how?
    }

    var rules = items['testofill.rules'];

    // data sanitization
    if (typeof rules === "undefined") {
      rules = { "forms": {} };
    } else if (typeof (rules.forms) === "undefined") {
      rules.forms = {};
    }
    if (typeof (rules.forms[url]) === "undefined") {
      rules.forms[url] = [];
    }

    // data merging
    var existingUrlForms = rules.forms[url];
    rules.forms[url] = existingUrlForms.concat(forms);

    saveRulesToStorage(rules, function (error) {
      if (typeof error === 'undefined') {
        sendMessageToContentScript(tab, 'extracted_forms_saved', { url: url, count: forms.length });
      } else {
        sendMessageToContentScript(tab, 'extracted_forms_save_failed', { url: url, count: forms.length, error: error });
      }
    });

  });
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ listeners:other

/* Set # ruleSets on icon when tab/url changes, set popup */
function setBadgeAndIconAction(tabId, ruleSets) {
  // When 1+ sets => show in the badge; tabId => shows only when this tab active
  chrome.action.setBadgeText({ tabId: tabId, text: ruleSets.length.toString() });
  chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: '#04B4AE' });

  // If 2+ rule sets => set popup (replaces the default action.onCliked action set below)
  if (ruleSets.length > 1) {
    chrome.action.setPopup({ tabId: tabId, popup: 'popup.html' });
  } else {
    chrome.action.setPopup({ tabId: tabId, popup: '' }); // remove the popup, if any (needed????)
  }
}

function triggerAutofillingIfEnabled(tab, ruleSets) {
  // todo check if autofill enabled ...
  sendMessageToContentScript(tab, "fill_form", ruleSets[0]); // TODO Defaulting to 1st ruleSet not so smart?
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ listeners:installationOf
/*
 * When new URL loaded: Set # ruleSets on icon when tab/url changes, set popup, trigger auto-fill.
 *
 * BEWARE: Seems not to be triggered for cached pages.
 */
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status !== "complete") return;
  if (tab.url.startsWith("chrome://")) return;
  if (tab.url.startsWith("chrome-extension://")) return;

  const url = tab.url;
  // Default badge/popup if no matching rulesets
  chrome.action.setBadgeText({ tabId: tabId, text: 'N/A' });
  chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: '#808080' });
  chrome.action.setPopup({ tabId: tabId, popup: 'no-rulesets.html?url=' + encodeURI(url) });

  findMatchingRules(url, function (ruleSets) {
    setBadgeAndIconAction(tabId, ruleSets);
    triggerAutofillingIfEnabled(tab, ruleSets);
  });
  // Note: changeInfo.status loading/complete/undefined; url only while 'loading'
  // - Not triggered when another tab activated (i.e. switching tabs)
  // - Also triggered for new tab, url=chrome://newtab/
  // - Also triggered when navigating to an anchor on the same page or back
});

/* Only triggered if there is 0-1 ruleSets (i.e. of there is no popup win). */
chrome.action.onClicked.addListener((tab) => {
  findMatchingRules(tab.url, function (ruleSets) {
    sendMessageToContentScript(tab, "fill_form", ruleSets[0]);
  });
});

chrome.contextMenus.onClicked.addListener(ctxMenuHandler);

// Set up context menu tree at install time.
chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    "title": "Testofill this!",
    "contexts": ["page", "frame", "editable"],
    "id": "fill_form"
  });
  chrome.contextMenus.create({
    "title": "Save form(s)",
    "contexts": ["page", "frame", "editable"],
    "id": "save_form"
  });
});

/**
 * Notify of data stored into the storage
 * @param changes {map} key -> {oldValue> .., newValue: ..}
 * @param namespace {string} e.g. 'sync'
 */
chrome.storage.onChanged.addListener(function (changes, namespace) {
  for (var key in changes) {
    if (key !== 'testofill.rules') return;

    // TODO Notify Options page to reload? Update browser icon?

  }
});
