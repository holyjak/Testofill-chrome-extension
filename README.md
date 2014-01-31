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

{
  forms: {
    "mysite.com/.*/myform": [ // (partial) regular expression or a substring of the form's URL
      {
        name: "Bob the Test Manager",  // (optional) to distinguish multiple sets of values for the same form
        doc: "Register as the test manager Bob", // (optional) displayed next to the name in a popup
        fields: [
          {query: "[name='fname']", value: "Bob"},
          {query: "[name='sname']", value: "Testofill"},
          {query: "[id$='phone']", code: function(){return "+471234567" + Random.nextInt();}}
        ]
      }
    ]
  }
}

Installation
---------------

Open the Extensions page in Chrome, check "Developer mode"
and click "Load unpacked extension...", navigate to the `src``
directory. (You can then also click "Pack extension...".)

ChangeLog
----------------

- 2014-01 v1.2 release
  - JSON config using chrome.storage
- 2014-01 v1.1 release
  - browser action, work on frames
- 2012-09-26 v1.0 release


Todo
----------------

- NOW: move to Sizzle, event page inst.of background
- support multiple sets of values for the same form & selection from them
- find by label?
- (better) support for radio/check boxes
- generated values (using predefined generators such as randomNumber, ability to add new generators, or a custom function)
- add option for turning autocomplete on/off
- ? make allFrames configurable
- rename run.js to testofill[-run].js to show nicely in Console logs
- syntax highlight for the rules textarea using json; real-time validation?

Questions etc.

- When options changed, do we need to inform the content script?
