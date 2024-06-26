![icon](src/extension/autofill_16x16-light.png) Testofill, the Form Filler for Testers Chrome Extension
=======================================================================================

[Install Testofill from Chrome Web Store](https://chrome.google.com/webstore/detail/testofill-form-filler-for/pkgdgajoinhkfldibdaledjikboognnl?hl=en-US)

Goal: Enable testers to fill forms automatically/on-demand with predefined and/or generated values.
It is possible to define and choose from multiple sets of values for a given form.

Fields are found using CSS3 selectors (via [Sizzle](https://github.com/jquery/sizzle/wiki/Sizzle-Documentation#wiki-selectors)). The configuration of the plugin is a JSON object.
Forms are filled either automatically or when you click the plugin icon / context menu.

Based on [work by Akkunchoi](http://akkunchoi.github.io/Autofill-chrome-extension).

Description from Chrome Web Shop
--------------------------------

Testofill allows you to define one or more sets of rules for filling forms on a particular page and to fill them in automatically or on demand with hardcoded or random values. It targets people that can write little CSS (such as "[name='myfield']"), are comfortable with JSON, and that need to be able to choose from sets of values to fill in. A typical example is a tester that needs to repeatedly fill in different search criteria to test her app and thus wants to define rule sets such as "Simple book search" and "Advanced book search".

The main advantages are being able to have multiple sets of values for a single form, having full access to and control over these values, and ability to generate random values. It is also possible to create rules automatically from a filled form and adjust them later.

See a short demo here: https://youtu.be/iDkSwpKd3NQ

Tip: You need to enable the extension in Incognito mode on the Extensions page if you want to be able to use it when Incognito.

Change log:
  * 2.0.1 - switch to a more sensible version number; make the icon more unique,
           and add a dark mode one; add 128px icon
  * 0.16 - make permissions optional, assignable by domain
  * 0.15 - Update to the Extension Manifest v3, as required by Chrome
  * 0.14 - Fix to really ignore iframes, which broke "save forms"
  * 0.13 - Improve React support (focus elements before changing them - works better with some components)
  * 0.12 - Save forms ignores iframes instead of being confused by them
  * 0.11 - Save forms accepts fields that have only id and no name
  * 0.10 - Full support for React forms (v16)
  * 0.9 - Fix autofill
  * 0.8.0
    - partial support for forms using React.js (text input)
  * 0.7.2
    - experimental support for creating random values using Chance.js
    - fixed repeated save form confirmation popup
    - added save form logging
  * 0.6.0
    - increase limit on config size frm 4kB to 5MB (and drop sync across browsers)

More info at the project page (https://github.com/holyjak/Testofill-chrome-extension/).

Icon by Designmodo (https://www.iconfinder.com/icons/115700/edit_pen_pencil_write_icon).

Screenshots
-----------

1) Testofill has found one rule set for the current page:

![One match found](docs/TestofillOneMatch.jpg)

2) Testofill configuration for that one match (also shows what the icon looks like when
there are no rule sets matching the current page):

![Testofill options](docs/TestofillOptions.jpg)

3) Icon and popup when testofill has found multiple matches for the current page:

![Testofill options](docs/TestofillMultipleMatches.jpg)

4) Sometimes Testofill gets confused and you need to close and reopen the page if you
want testofill to fill in forms on the page (notice there is neither a number nor "N/A" on the icon):

![Confused](docs/Confused.jpg)

5) Context menu (when clicking on a page outside of input elements, links, and media):

![Context menu](docs/TestofillContextMenu.jpg)

Configuration
-------------

(Extensions - Testofill - Options)

The easiest thing is perhaps to go to a webpage with a form (forms), fill it in, right-click somewhere
on the page (outside of links and other special objects) and select "Save form(s)" from the
Testofill context menu.

You can also write the configuration manually - it is a simple JSON object where each page has its
URL mapped to a list of "rule sets" defined for it, each one consisting of a name and field rules.
Field rules is a list of simple objects having a Sizzle query for locating the input element and
the value to fill in.

The editor provides a graphical tree view and raw JSON with syntax highlighting and validation.

### Example configuration

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

Either [install Testofill from Chrome Web Store](https://chrome.google.com/webstore/detail/testofill-form-filler-for/pkgdgajoinhkfldibdaledjikboognnl?hl=en-US)
or follow the manual installation instructions below.

First, clone/download this repository.

Next, open the Extensions page in Chrome, check "Developer mode"
and click "Load unpacked extension...", navigate to the `src/extension/`
directory of this repo. (You can then also click "Pack extension...".)

You likely also want to check "Allow in incognito mode" for the extension if you use incognito windows for testing.

After the installation, open the extension's options and modify at will.

Tips and tricks
---------------

### Using Testofill with Primefaces

Primefaces use a combination of a hidden select (`<id>_input`) and a text label (`<id>_label`) to draw a custom select element. If you only set the select it will work but you will not see the value filled in so you should also
manually set the label, using the `textContent` attribute. Ex.:

```json
{
  "query": "[id$=':preferedDrinkSelect_input']",
  "value": "Lassi"
},
{
  "query": "[id$=':preferedDrinkSelect_label']",
  "textContent": "Lassi"
}
```

ChangeLog (&lt; v0.16), detailed
----------------

**Newer changes - see above in the Web Store info part.**

- over v0.16 see above
- 2024-06-18 v0.16 
  - update for Chrome manifest v3
  - make permissions optional, request them for the current site when an
    action triggered 
- 2019-02-21 v0.13 - Improve React support (focus elements before changing them - works better with some components)
- 2019-02-20 v0.12 - Save forms ignores iframes instead of being confused by them
- 2019-02-19 v0.11 Save forms accepts fields that have only id and no name
- 2019-02-19
  - v0.10 Full support for React forms (v16); see [react-trigger-change](https://github.com/vitalyq/react-trigger-change/blob/master/lib/change.js#L107)
- 2019-02-18 v0.9 Fix autofill
- 2016-11 v0.8 partial support for React forms (text inputs, text areas)
- 2014-3 v0.7
  - experimental support for generating random values via Chance.js
  - added some simple mocha tests, jshint (failing so far)
- 2014-3 v0.6
  - build with grunt, 1 file with deps for content
  - use local instead of sync storage - 5MB inst. of 4kb
- 2014-3 v0.5.1 release
  - do not save forms with no non-empty fields
- 2014-3 v0.5 release
  - save form ignores empty/unchecked/irrelevant fields
  - better reporting of options storage success/failure
- 2014-3 v0.4 pre-release
  - Added context menu to save form(s) on the current page
- 2014-3 v0.3 pre-release
  - Added jsoneditor for better json editting
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
- Some JavaScript-activated forms are not filled automatically and you need to click
  the extension icon to fill them in

Todo
----------------

- Add debug option and debug statements
- Docs: Improve
- Currently the browserAction icon is reset when opening a cached URL - fix this
- FORM:
  - find by label?
- Config
  - add option for turning autocomplete on/off
  - save options on C-S / M-S
  - ? make allFrames configurable
- Random values
  - generated values (using predefined generators such as randomNumber, ability to add new generators, or a custom function)
- handle/test error cases - no sets, no set selected, ...

Development
-----------

Form filling is implemented in the content script
[`testofill-run.js`](src/extension/content/testofill-run.js). See especially `fillForms` that finds fields matched by rules in a rule set and fills them via `fillField`, which applies a rule (its value, textContent etc.) to a field.

[`service-worker.js`](src/extension/service-worker.js) contains the crucial `findMatchingRules`, which gets rule sets from options, finds those matching the current URL, and calls the provided callback for them. Behavior of the context menu and badge icon are defined here as well.

[`popup.js`](src/extension/popup.js) defines the selection popup that opens when multiple rule sets match the current URL and that triggers form filling when one is selected.

### Initial setup

Run `npm install`, then `npm run bundle-deps`.

### Note on permissions and libs

We don't want to ask for access to all sites, rather opting for the user to manually enable the plugin for each site of interest. This is done by the module `webext-permission-toggle`, which adds to the extension's menu, next to Options, a toggle to enable it for a particular domain. Then, the inclusion of `webext-dynamic-content-scripts` will automatically register our content script (from the manifest) with that domain.

Both are installed as npm modules and need to be bundled with the extension via `npm run bundle-deps`.

### Manual testing

1. Run `cd test/; python -m SimpleHTTPServer 1111`
2. Enable the plugin (in Extensions dev mode, do Load unpacked from src/extension/)
3. Copy and paste the ruleset from the web page into the plugin options (switch from Tree to Code view)
4. Access http://localhost:1111/test.html#one - testofill should autofill the form, press [Reset] and compare, invoke Testofill manually
5. Access http://localhost:1111/test.html#two - here we have two rulesets so invoking Testofill should show a popup with their names
6. Similarly for http://localhost:1111/test-react.html

### Permission check

In Chrome, at `chrome://extensions/`, click [Pack extension], select `./src/extension` and the stored `extension.pem`. Then drag and drop the created .crx to that page to install it and see what permission warnings it would display. (The ext. will be unusable - use [Load unpacked] for that)

### Publication

1. Run `npm run bundle-deps` to refresh `src/extension/lib/bundled-npm-deps.js` if necessary
2. [Zip the extension](https://developer.chrome.com/docs/webstore/prepare) `./src/extension` (so that the archive will contain ./manifest.json etc).
3. Go to [Chrome Dev Dashboard](https://chrome.google.com/webstore/developer/edit/pkgdgajoinhkfldibdaledjikboognnl) for the extension and upload the generated `.zip`.
