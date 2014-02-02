Testofill, the Form Filler for Testers Chrome Extension
=======================================================

Goal: Enable testers to fill forms automatically/on-demand with predefined and/or generated values.
It is possible to define and choose from multiple sets of values for a given form.

State: Automatic/on-demand form filling with predefined values; no value generation or multiple sets yet.

Fields are found using CSS3 selectors (via [Sizzle]()). The configuration of the plugin is a JavaScript object.
Forms are filled either automatically or when you click the plugin icon.

Based on [work by Akkunchoi](http://akkunchoi.github.io/Autofill-chrome-extension).


Example of configuration
------------------------

(Extensions - Testofill - Options)
```json
{
  "forms": {
    "me:1111/test.html.*#one": [
      {
        "fields": [
          {
            "query": "[name='q']",
            "value": "Single rule set rulez"
          }
        ],
        "name": "Form with one ruleSet"
      }
    ],
    "me:1111/test.html.*#two": [
      {
        "doc": "Set 1 of 2",
        "fields": [
          {
            "query": "[name='q']",
            "value": "Testofill rocks!"
          }
        ],
        "name": "Set Testofill rocks"
      },
      {
        "fields": [
          {
            "query": "[name='q']",
            "value": "Value from another ruleSet"
          }
        ],
        "name": "Set Another"
      }
    ]
  }
}
```

Installation
---------------

Open the Extensions page in Chrome, check "Developer mode"
and click "Load unpacked extension...", navigate to the `src``
directory. (You can then also click "Pack extension...".)

ChangeLog
----------------

- 2014-01 v1.2 release
  - JSON config using chrome.storage, move from jQuery to the smaller Sizzle,
    event page inst.of background, manifestv v 2
  - support multiple sets of values for the same form & selection from them
- 2014-01 v1.1 release
  - browser action, work on frames
- 2012-09-26 v1.0 release

Shortcomings
------------

- URL is matched against the page URL, not iframe URL even if the form is in an iframe
- Currently only works for fields that have the value attribute, i.e. not for radio/checkbox/select

Todo
----------------

- FORM:
  - find by label?
  - (better) support for radio/check boxes/select list
- Config
  - add option for turning autocomplete on/off
  - syntax highlighting and on-the-fly validation of JSON
  - app-specific validation of the config against schema
  - save options on C-S / M-S
  - ? make allFrames configurable
- Random values
  - generated values (using predefined generators such as randomNumber, ability to add new generators, or a custom function)
- handle/test error cases - no sets, no set selected, ...
