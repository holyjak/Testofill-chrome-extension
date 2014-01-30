Autofill forms Chrome extension
================================

This chrome extension fills out forms automatically.

As you know, Chrome implements autofill function.
But this function doesn't work on some website.

You set a query and a value, then this extension fills out a value by the query


<http://akkunchoi.github.io/Autofill-chrome-extension>


Usage
----------------

Open "Options" of this extension,
And click "New Query",
Then three text field will appear.

- Url as regular expression
- Query as [jQuery Selectors](http://api.jquery.com/category/selectors/)
- Value as string you want to input

Installation
---------------

Open the Extensions page in Chrome, check "Developer mode"
and click "Load unpacked extension...", navigate to the `src``
directory. (You can then also click "Pack extension...".)

ChangeLog
----------------
- 2014-01 v1.1 release
    - browser action, work on frames
- 2012-09-26 v1.0 release


Todo
----------------
- Find contents inside frames
- Notification
- Import/Export
