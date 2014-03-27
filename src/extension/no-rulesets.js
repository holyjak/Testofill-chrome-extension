document.addEventListener('DOMContentLoaded', function() {
  var paramStr = document.location.search;
  var idx = paramStr.indexOf('url=');
  if (idx >= 0) {
    var url = paramStr.substring(idx + 4);
    document.getElementById('url').textContent = ' ' + url;
  }
});
