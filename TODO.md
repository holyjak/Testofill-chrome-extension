# TODO

## Permissions

Using the `activeTab` permission does not pop up warning to users when installing about access to all possible; only grants access after the user invokes the extension and until closed/navigated away - contrary to `tabs`.

See https://developer.chrome.com/extensions/activeTab .

=>

* Consider making `tabs` optional (=> not being able to update browser action icon - but it does not work well anyway)

activeTab gives you:

* Call tabs.executeScript or tabs.insertCSS on that tab.
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
