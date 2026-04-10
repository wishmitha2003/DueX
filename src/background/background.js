// Background service worker for DueX

const STORAGE_KEY = 'duex_deadlines';
const SYNC_URL_KEY = 'duex_sync_url';
const ALARM_NAME = 'duex_check_deadlines';

// Initialize alarms when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  setupCheckAlarm();
  syncAndCheckDeadlines();
});

// Refresh alarms when requested by the frontend
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'DEADLINES_UPDATED') {
    checkDeadlines();
    sendResponse({ success: true });
  } else if (message.type === 'TRIGGER_SYNC') {
    syncAndCheckDeadlines().then(() => sendResponse({ success: true }));
    return true; // Keep message channel open for async response
  } else if (message.type === 'AUTO_SCRAPED_DEADLINES') {
    handleScrapedDeadlines(message.deadlines);
    // Don't need sendResponse here
  }
});

async function handleScrapedDeadlines(scrapedDeadlines) {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    let existingDeadlines = result[STORAGE_KEY] || [];
    let updated = false;

    for (const event of scrapedDeadlines) {
      // Find matching by title within last 3 or next 30 days
      const existingIdx = existingDeadlines.findIndex(d => d.title === event.title);
      
      if (existingIdx >= 0) {
        if (existingDeadlines[existingIdx].date !== event.date) {
           existingDeadlines[existingIdx] = { ...existingDeadlines[existingIdx], ...event };
           updated = true;
        }
      } else {
        existingDeadlines.push(event);
        updated = true;
      }
    }

    if (updated) {
      existingDeadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      await chrome.storage.local.set({ [STORAGE_KEY]: existingDeadlines });
    }
  } catch (err) {
    console.error('Error saving scraped deadlines:', err);
  }
}

// Setup alarm to run every hour
function setupCheckAlarm() {
  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: 60
  });
}

// Listen for alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    syncAndCheckDeadlines();
  }
});

async function syncAndCheckDeadlines() {
  await fetchICS();
  await checkDeadlines();
}

async function fetchICS() {
  try {
    const result = await chrome.storage.local.get([SYNC_URL_KEY, STORAGE_KEY]);
    const url = result[SYNC_URL_KEY];
    if (!url) return;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch ICS');
    const icsData = await response.text();

    const parsedEvents = parseICS(icsData);
    let existingDeadlines = result[STORAGE_KEY] || [];
    
    let updated = false;
    for (const event of parsedEvents) {
      // Avoid duplicates: update existing if id matches, else add
      const existingIdx = existingDeadlines.findIndex(d => d.id === event.id);
      if (existingIdx >= 0) {
        if (existingDeadlines[existingIdx].date !== event.date || existingDeadlines[existingIdx].title !== event.title) {
           existingDeadlines[existingIdx] = { ...existingDeadlines[existingIdx], ...event };
           updated = true;
        }
      } else {
        existingDeadlines.push(event);
        updated = true;
      }
    }

    if (updated) {
      // Sort by date approaching
      existingDeadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      await chrome.storage.local.set({ [STORAGE_KEY]: existingDeadlines });
    }
  } catch (error) {
    console.error('Error syncing ICS:', error);
  }
}

function parseICS(icsData) {
  const events = [];
  const lines = icsData.split(/\r?\n/);
  let currentEvent = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('BEGIN:VEVENT')) {
      currentEvent = { createdAt: new Date().toISOString() };
    } else if (line.startsWith('END:VEVENT')) {
      if (currentEvent && currentEvent.title && currentEvent.date) {
        // Ensure it has an id
        if (!currentEvent.id) {
           currentEvent.id = 'ics_' + Math.random().toString(36).substring(2, 9);
        }
        events.push(currentEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      if (line.startsWith('SUMMARY:')) {
        currentEvent.title = line.substring(8);
      } else if (line.startsWith('UID:')) {
        currentEvent.id = line.substring(4);
      } else if (line.startsWith('DTSTART:') || line.startsWith('DTEND:')) {
        // Simple ICS date parser for YYYYMMDDTHHMMSSZ
        const parts = line.split(':');
        if (parts.length > 1) {
          const dateStr = parts[1];
          if (dateStr.length >= 15) {
            const year = dateStr.slice(0, 4);
            const month = dateStr.slice(4, 6);
            const day = dateStr.slice(6, 8);
            const hour = dateStr.slice(9, 11);
            const minute = dateStr.slice(11, 13);
            const second = dateStr.slice(13, 15);
            // Convert to local time string format "YYYY-MM-DDTHH:mm:00" for our UI input compatibility
            const d = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
            const localDate = d.getFullYear() + '-' +
                              String(d.getMonth() + 1).padStart(2, '0') + '-' +
                              String(d.getDate()).padStart(2, '0') + 'T' +
                              String(d.getHours()).padStart(2, '0') + ':' +
                              String(d.getMinutes()).padStart(2, '0') + ':00';
            currentEvent.date = localDate;
          }
        }
      }
    }
  }
  return events;
}

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
