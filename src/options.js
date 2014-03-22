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

function save_options(editor) {
  var rules = editor.get();
  saveToStorage(rules);
}

function restore_options(editor) {

  var exampleJson = {
    "forms": {
      "seznam.cz": [
        {
          "name": "Bob the Test Manager",
          "doc": "Register as the test manager Bob",
          "fields": [
            {"query": "[name='q']", "value": "Testofill rocks!"}
          ]
        }
      ]
    }
  };

  chrome.storage.sync.get('testofill.rules', function(items) {
    if (typeof chrome.runtime.lastError === "undefined") {
      var rules = items['testofill.rules'];
      console.log("Rules restored: ", rules);

      if (typeof rules !== "undefined") { // TODO verify behaves OK if there are no saved rules
        editor.set(rules);
      } else {
        editor.set(exampleJson);
      }

    } else {
      showError("Restoring the rules failed: " + chrome.runtime.lastError);
      console.log("ERROR restoring rules", chrome.runtime.lastError);
    }
  });
}

function init() {
  var editor = new jsoneditor.JSONEditor(document.getElementById("jsoneditor"));

  restore_options(editor);

  document.querySelector('#save').addEventListener('click', function() { save_options(editor); });

}

document.addEventListener('DOMContentLoaded', init);
