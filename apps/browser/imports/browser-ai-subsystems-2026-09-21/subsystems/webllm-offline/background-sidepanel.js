// Background script to handle side panel
chrome.action.onClicked.addListener((tab) => {
  // Open side panel when extension icon is clicked
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Keep service worker alive
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated - Side panel enabled');
});
