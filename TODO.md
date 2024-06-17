# TODO

## WIP: Fewer permissions

* DONE
  * Added webext perm. toggle and dyn. content script injection libs,
    removed the * host permissions. - see https://github.com/fregante/webext-dynamic-content-scripts/blob/main/how-to-add-github-enterprise-support-to-web-extensions.md
* TBD
  * Better info when user tries to use the addon but domain not allowed
  * Has to trigger action twice, even when perms granted - b/c granting
    async triggers the content script injection, which we must wait for
  * See if we can make the `tabs` permission (=> "all browsing hist.") optional

## Permissions [OUTDATED]

Using the `activeTab` permission does not pop up warning to users when installing about access to all possible; only grants access after the user invokes the extension and until closed/navigated away.

Applying a content script to `*` (or having `host_permissions: ..*..`) shows a warning about being able to  _access all data on all pages_.

(The `tabs` gives a warning about having access to the browsing history.)

=>

Replace the statically injected content script with one injected on demand, after the user
triggers the extension

* Consider making `tabs` optional =>
  * being able to update browser action icon when accessing a url - but it does not work well anyway
  * not being able to auto-fill until the ext. has been manually invoked at least once in the tab - 
    could add a shortcut such as Alt+F to fill in, then it would be auto - see https://developer.chrome.com/docs/extensions/reference/api/commands
    Check https://github.com/GoogleChrome/chrome-extensions-samples/blob/main/functional-samples/sample.optional_permissions/newtab.js for
    checking, requesting permissions

activeTab gives you:

* Call runtime.executeScript or runtime.insertCSS on that tab.
* Get the URL, title, and favicon for that tab via an API that returns a tabs.Tab object (essentially, activeTab grants the tabs permission temporarily).

## Generative

* Use $ to prefix fns
* Import chance fns w/o 'chance.' prefix, add identity and concat
* Integrate generative into options and -run scripts
* Make parse return a fn that will be called by -run when filling in the form inst. of a value
* Brief docs
* Options: add 'Powered by' chance, sizzle, _, jsoneditor, Ace

## Other

* Make browser action icon more reliable
* Better logging of save form when not matches
* Make it work with forms using React - trigger events it listens to; experiment with http://jsfiddle.net/zcz1p35n/4/ 

## Fixme

* fill called twice (duckgo and simple q fill w/ generate)
