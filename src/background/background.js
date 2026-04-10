// Background service worker for DueX

const STORAGE_KEY = 'duex_deadlines';
const ALARM_NAME = 'duex_check_deadlines';

// Initialize alarms when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  setupCheckAlarm();
});

// Refresh alarms when requested by the frontend
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'DEADLINES_UPDATED') {
    checkDeadlines();
    sendResponse({ success: true });
  }
});

// Setup alarm to run every hour
function setupCheckAlarm() {
  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: 60
  });
}

// Listen for alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    checkDeadlines();
  }
});

// Check deadlines and show notifications for those within 24 hours
async function checkDeadlines() {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    const deadlines = result[STORAGE_KEY] || [];
    
    // Check if we have already notified about these
    const notifiedResult = await chrome.storage.local.get(['duex_notified']);
    const alreadyNotified = notifiedResult.duex_notified || [];
    const newlyNotified = [...alreadyNotified];
    
    const now = new Date().getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    
    for (const deadline of deadlines) {
      const targetTime = new Date(deadline.date).getTime();
      const timeLeft = targetTime - now;
      
      // If deadline is within 24h, not expired, and not already notified
      if (timeLeft > 0 && timeLeft <= oneDay && !alreadyNotified.includes(deadline.id)) {
        // Show notification
        chrome.notifications.create(`deadline-${deadline.id}`, {
          type: 'basic',
          iconUrl: '/icons/icon128.png',
          title: 'Deadline Approaching!',
          message: `"${deadline.title}" is due in less than 24 hours.`,
          priority: 2
        });
        
        newlyNotified.push(deadline.id);
      }
    }
    
    // Save notified IDs
    if (newlyNotified.length !== alreadyNotified.length) {
      await chrome.storage.local.set({ duex_notified: newlyNotified });
    }
    
    // Clean up expired notifications
    cleanupNotifiedList(deadlines, newlyNotified);
    
  } catch (error) {
    console.error('Error checking deadlines:', error);
  }
}

// Remove notified IDs if the deadline no longer exists
async function cleanupNotifiedList(currentDeadlines, notifiedList) {
  const currentIds = currentDeadlines.map(d => d.id);
  const cleanList = notifiedList.filter(id => currentIds.includes(id));
  
  if (cleanList.length !== notifiedList.length) {
    await chrome.storage.local.set({ duex_notified: cleanList });
  }
}
