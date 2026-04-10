// Content script to scrape deadlines from SLIIT Courseweb / Moodle

function extractDeadlines() {
  const deadlines = [];
  const now = new Date();

  // Helper to safely parse Moodle date strings like "Tuesday, 14 April, 11:59 PM"
  function parseMoodleDate(dateStr) {
    if (!dateStr) return null;
    try {
      // Very basic parsing attempt. Moodle dates vary greatly.
      // E.g., "14 April, 11:59 PM" or "Tomorrow, 11:59 PM"
      const currentYear = now.getFullYear();
      let cleanStr = dateStr.replace(/Monday,|Tuesday,|Wednesday,|Thursday,|Friday,|Saturday,|Sunday,/gi, '').trim();
      
      // Handle "Today" and "Tomorrow"
      let baseDate = new Date();
      if (cleanStr.toLowerCase().includes('today')) {
         cleanStr = cleanStr.replace(/today/i, '').trim();
      } else if (cleanStr.toLowerCase().includes('tomorrow')) {
         baseDate.setDate(baseDate.getDate() + 1);
         cleanStr = cleanStr.replace(/tomorrow/i, '').trim();
      } else {
         // Try to parse '14 April 11:59 PM'
         // Add year if missing
         if (!cleanStr.includes(currentYear.toString())) {
             // Let's just append current year
             cleanStr = cleanStr.replace(/,/g, '') + ' ' + currentYear;
         }
      }
      
      const parsed = new Date(cleanStr);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
      
      // Fallback: If we couldn't parse the time, just set it to end of day today as a default to at least capture the task.
      return null;
    } catch (e) {
      return null;
    }
  }

  // Strategy 1: Upcoming Events Block
  const upcomingEvents = document.querySelectorAll('.block_calendar_upcoming .event');
  upcomingEvents.forEach(evt => {
    const link = evt.querySelector('a');
    const dateEl = evt.querySelector('.date');
    if (link && dateEl) {
      const parsedDate = parseMoodleDate(dateEl.innerText);
      if (parsedDate) {
        deadlines.push({
          id: link.href || 'evt_' + Math.random().toString(36).substr(2),
          title: link.innerText.trim(),
          date: parsedDate.substring(0, 16), // YYYY-MM-DDTHH:mm
          createdAt: now.toISOString()
        });
      }
    }
  });

  // Strategy 2: Timeline Block (Modern Moodle dashboard)
  const timelineItems = document.querySelectorAll('[data-region="event-list-item"]');
  timelineItems.forEach(item => {
    const titleEl = item.querySelector('.text-truncate, .event-name');
    const dateEl = item.querySelector('.text-muted, .text-right');
    const linkEl = item.querySelector('a');
    if (titleEl && dateEl) {
      const parsedDate = parseMoodleDate(dateEl.innerText);
      if (parsedDate) {
        deadlines.push({
          id: (linkEl ? linkEl.href : '') || 'evt_' + Math.random().toString(36).substr(2),
          title: titleEl.innerText.trim(),
          date: parsedDate.substring(0, 16),
          createdAt: now.toISOString()
        });
      }
    }
  });

  // Strategy 3: Calendar Month view (.day cells)
  const calendarDays = document.querySelectorAll('td.day');
  calendarDays.forEach(dayCell => {
     const timestamp = dayCell.getAttribute('data-day-timestamp');
     if (timestamp) {
        const dateObj = new Date(parseInt(timestamp) * 1000);
        // By default set to 23:59 for calendar days
        dateObj.setHours(23, 59, 0); 
        
        const events = dayCell.querySelectorAll('.calendar_event_assignment, .calendar_event_submission, .eventname, ul li');
        events.forEach(evt => {
           let title = evt.innerText.trim();
           if (title) {
             const link = evt.querySelector('a');
             if (link) title = link.getAttribute('title') || title;
             deadlines.push({
                id: (link ? link.href : '') || 'evt_' + Math.random().toString(36).substr(2),
                title: title,
                date: dateObj.toISOString().substring(0, 16),
                createdAt: now.toISOString()
             });
           }
        });
     }
  });

  return deadlines;
}

function syncDeadlinesToExtension() {
  const extracted = extractDeadlines();
  if (extracted.length > 0) {
    try {
      chrome.runtime.sendMessage({
        type: 'AUTO_SCRAPED_DEADLINES',
        deadlines: extracted
      });
      // Optional: show a small toast on the moodle page
      console.log('DueX: Synced ' + extracted.length + ' deadlines.');
    } catch (e) {
      console.error('DueX Sync error:', e);
    }
  }
}

// Run on load
window.addEventListener('load', () => {
  // Little delay to let Vue/React Moodle components render
  setTimeout(syncDeadlinesToExtension, 2000);
});
