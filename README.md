Testofill, the Form Filler for Testers Chrome Extension
=======================================================

Goal: Enable testers to fill forms automatically/on-demand with predefined and/or generated values.
It is possible to define and choose from multiple sets of values for a given form.

State: Automatic/on-demand form filling with predefined values; no value generation or multiple sets yet.

Fields are found using CSS3 selectors (via [Sizzle](https://github.com/jquery/sizzle/wiki/Sizzle-Documentation#wiki-selectors)). The configuration of the plugin is a JavaScript object.
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

- 2014-02+03 v0.2 pre-release
  - Added context menu for windows w/o toolbar
  - Support for setting `textContent`
- 2014-02-03 v0.1 pre-release
  - JSON config using chrome.storage, move from jQuery to the smaller Sizzle,
    event page inst.of background, manifestv v 2
  - support multiple sets of values for the same form & selection from them
  - the icon's badge shows the number of ruleSets matching the URL
  - support radio, checkbox, select (single, multi)
- 2014-01 v0.0 release
  - Based on Autofill 1.0 (2012-09-26) + browser action, work on frames

Shortcomings
------------

- URL is matched against the page URL, not iframe URL even if the form is in an iframe
- Currently only works for fields that have the value attribute, i.e. not for radio/checkbox/select
- Some JavaScript-ctivated forms are not filled automatically and you need to click
  the extension icon to fill them in

Todo
----------------

- Add debug option and debug statements
- Docs: Add screenshots, more info
- clear the 'Options saves' status after a while
- Get it working with PrimeFaces
- Currently the browserAction icon is reset when opening a cached URL - fix this

- Make findMatchingRules  run also if no matches
- Run setBadgeAndIconAction/autofill also when same url reloaded (diff evt?)
- FORM:
  - find by label?
- Config
  - add option for turning autocomplete on/off
  - syntax highlighting and on-the-fly validation of JSON
  - app-specific validation of the config against schema
  - save options on C-S / M-S
  - ? make allFrames configurable
- Random values
  - generated values (using predefined generators such as randomNumber, ability to add new generators, or a custom function)
- handle/test error cases - no sets, no set selected, ...
