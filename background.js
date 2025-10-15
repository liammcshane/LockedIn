chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ deactivatedUntil: 0 });
  console.log('You are now LockedIn');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'deactivate') {
    const deactivatedUntil = Date.now() + 3600 * 1000; // 60 mins
    chrome.storage.local.set({ deactivatedUntil }, () => {
      console.log(`LockedIn has been deactivated for 60 minutes. ${new Date(deactivatedUntil)}`);
      // Create an alarm to re-enable the extension
      chrome.alarms.create('reEnableAlarm', { when: deactivatedUntil });
      sendResponse({ success: true });
    });
    return true;
  } else if (request.action === 'reactivate') {
    chrome.storage.local.set({ deactivatedUntil: 0 }, () => {
      console.log('You are now LockedIn');
      chrome.alarms.clear('reEnableAlarm');
      sendResponse({ success: true });
    });
    return true;
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'reEnableAlarm') {
    chrome.storage.local.set({ deactivatedUntil: 0 }, () => {
      console.log('You are now LockedIn');
    });
  }
});
