// Options storage

function showStatus(message, type) {
  var statusElm = document.getElementById("status");
  if (type === "error") {
    statusElm.innerHTML = '<span style="color:red">ERROR: ' + message + '</span>';
  } else {
    statusElm.innerHTML = '<span style="color:blue">' + message + '</span>';;
  }

  // TODO fix this timeout reset, does not work:
  setTimeout(function() {
    status.innerHTML = "";
  }, 750);
}

function showError(message) {
  showStatus(message, "error");
}

function saveToStorage(json) {
  chrome.storage.sync.set({'testofill.rules': json}, function() {
    if (typeof chrome.runtime.lastError === "undefined") {
      showStatus("Options Saved.");
    } else {
      showError("saving failed: " + chrome.runtime.lastError);
      console.log("ERROR saving rules", chrome.runtime.lastError);
    }
  })
}

function save_options() {
  var rulesElm = document.getElementById("rules");
  try {
    var rules = JSON.parse(rulesElm.value);
    saveToStorage(rules);
  } catch (e) {
    showError("The rules are not a valid JSON object: " + e);
    console.error("Rules parsing error: ", e, rulesElm.value);
  }
}

function restore_options() {
  chrome.storage.sync.get('testofill.rules', function(items) {
    if (typeof chrome.runtime.lastError === "undefined") {
      var rules = items['testofill.rules'];
      console.log("Rules restored: ", rules);
      if (typeof rules !== "undefined") { // TODO verify behaves OK if there are no saved rules
        var rulesElm = document.getElementById("rules");
        rulesElm.value = JSON.stringify(rules, null, "  ");
      }
    } else {
      showError("Restoring the rules failed: " + chrome.runtime.lastError);
      console.log("ERROR restoring rules", chrome.runtime.lastError);
    }
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);
