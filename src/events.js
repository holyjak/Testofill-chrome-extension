// Note: Access to URL requires tabs permission
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
  if (changeInfo.url) {
    console.log("New tab or URL changed: " + changeInfo.url + ", status: " + changeInfo.status); // TODO does log work here?!; add popup if >1
  }
});
