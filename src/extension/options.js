// Options storage

function showStatus(message, type) {
  var statusElm = document.getElementById("status");

  var color = "blue";
  if (type === "error") {
    message = 'ERROR: ' + message;
    color = "red";
  } else if (type === "info") {
    color = "cadetblue";
  }

  statusElm.innerHTML = '<span style="color:' + color + '" class="status-msg">' + message + '</span>';

  // TODO fix this timeout reset, does not work:
  setTimeout(function () {
    statusElm.innerHTML = "";
  }, 750);
}

function showError(message) {
  showStatus(message, "error");
}

function saveToStorage(json) { // see also events.js: mergeIntoOptions()
  chrome.runtime.sendMessage({ id: 'saveRulesToStorage', payload: json }) // FIXME DIY
    .then((error) => {
      if (typeof error === 'undefined') {
        showStatus("Options Saved.");
      } else {
        showError("Saving failed: " + error);
      }
    });
}

function save_options(editor) {
  var rules = editor.get();
  saveToStorage(rules);
}

function restore_options(editor) {
  var exampleJson = {
    "forms": {
      "duckduckgo.com": [
        {
          "name": "(optional) Search for testofill",
          "doc": "(optional) This is an example rule set; it is not saved so click [Save] if you want to use it",
          "fields": [
            { "query": "[name='q']", "value": "Testofill rocks!" }
          ]
        }
      ]
    }
  };

  chrome.storage.local.get('testofill.rules', function (items) {
    if (typeof chrome.runtime.lastError === "undefined") {
      var rules = items['testofill.rules'];
      console.log("Rules restored: ", rules);

      if (typeof rules !== "undefined") { // TODO verify behaves OK if there are no saved rules
        editor.set(rules);
      } else {
        editor.set(exampleJson);
        showStatus("This is only an example, not really saved - save it if you want", "info");
      }
      editor.expandAll();

    } else {
      showError("Restoring the rules failed: " + chrome.runtime.lastError);
      console.log("ERROR restoring rules", chrome.runtime.lastError);
    }
  });
}

function init() {
  var container = document.getElementById("jsoneditor");
  var options = {
    change: function () { showStatus("Configuration changed, don't forget to save it", "info"); },
    mode: 'tree',
    modes: ['tree', 'code'], // allowed modes
    error: function (err) {
      console.log("JSONEditor error:", err);
    }
  };
  var editor = new jsoneditor.JSONEditor(container, options);

  restore_options(editor);

  document.querySelector('.save').addEventListener('click', function () { save_options(editor); });
  document.querySelector('.reset').addEventListener('click', function () {
    restore_options(editor);
    showStatus("Configuration reset to the saved one", "info");
  });

}

document.addEventListener('DOMContentLoaded', init);
