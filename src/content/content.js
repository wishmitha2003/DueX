// Content script to scrape deadlines from SLIIT Courseweb / Moodle

function extractDeadlines() {
  const deadlines = [];
  const now = new Date();

  // Parse Moodle date strings like "Saturday, 11 April 2026, 12:00 AM" or "10 Apr, 11:59 PM"
  // Returns a local Date object (no UTC conversion)
  function parseMoodleDate(dateStr) {
    if (!dateStr) return null;
    try {
      const str = dateStr.trim();
      const currentYear = new Date().getFullYear();

      // Better regex: supports optional year and optional comma after month
      // Group 1: Day, Group 2: Month, Group 3: Optional Year, Group 4: Hour, Group 5: Minute, Group 6: AM/PM
      const match = str.match(/(\d{1,2})\s+([a-zA-Z]+)(?:\s*,?\s*(\d{4}))?[,\s]+(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      
      if (match) {
        const day      = parseInt(match[1]);
        const monthStr = match[2].toLowerCase();
        const year     = match[3] ? parseInt(match[3]) : currentYear;
        let hours      = parseInt(match[4]);
        const minutes  = parseInt(match[5]);
        const ampm     = match[6] ? match[6].toUpperCase() : null;

        const months = {
          jan:0, january:0, feb:1, february:1, mar:2, march:2, apr:3, april:3,
          may:4, jun:5, june:5, jul:6, july:6, aug:7, august:7, sep:8, september:8,
          oct:9, october:9, nov:10, november:10, dec:11, december:11
        };
        
        const month = months[monthStr];
        if (month === undefined) return null;

        if (ampm === 'AM' && hours === 12) hours = 0;
        if (ampm === 'PM' && hours !== 12) hours += 12;

        const d = new Date();
        d.setFullYear(year, month, day);
        d.setHours(hours, minutes, 0, 0);
        return d;
      }

      // Relative keywords: Today / Tomorrow
      const lower = str.toLowerCase();
      if (lower.includes('today') || lower.includes('tomorrow')) {
        const base = new Date();
        if (lower.includes('tomorrow')) base.setDate(base.getDate() + 1);
        const timeMatch = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (timeMatch) {
          let h = parseInt(timeMatch[1]);
          const m = parseInt(timeMatch[2]);
          const ap = timeMatch[3] ? timeMatch[3].toUpperCase() : null;
          if (ap === 'AM' && h === 12) h = 0;
          if (ap === 'PM' && h !== 12) h += 12;
          base.setHours(h, m, 0, 0);
        } else {
          base.setHours(23, 59, 0, 0);
        }
        return base;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // Helper to filter out holidays
  function isValidEvent(title) {
    if (!title) return false;
    const t = title.toLowerCase();
    
    // Explicitly reject words related to holidays
    const isHoliday = t.includes('holiday') || 
                      t.includes('poya') || 
                      t.includes('vacation') || 
                      t.includes('day off') || 
                      t.includes('new year') ||
                      t.includes('festival');
                      
    if (isHoliday) return false;

    // Optional: We can also explicitly ENFORCE it must have these words, 
    // but blocking holidays is usually enough. Let's enforce academic words to be super safe 
    // since the user exclusively asked for lab, assignments, submissions.
    const isAcademic = t.includes('lab') || 
                       t.includes('assign') || 
                       t.includes('submi') || 
                       t.includes('quiz') || 
                       t.includes('exam') || 
                       t.includes('test') ||
                       t.includes('project') ||
                       t.includes('presentation') ||
                       t.includes('report') ||
                       t.includes('mid');

    return isAcademic;
  }

  function getLocalTimeStr(dateObj) {
    if (!dateObj || isNaN(dateObj.getTime())) return null;
    return dateObj.getFullYear() + '-' +
      String(dateObj.getMonth() + 1).padStart(2, '0') + '-' +
      String(dateObj.getDate()).padStart(2, '0') + 'T' +
      String(dateObj.getHours()).padStart(2, '0') + ':' +
      String(dateObj.getMinutes()).padStart(2, '0');
  }

  // Strategy 1: Upcoming Events Block
  const upcomingEvents = document.querySelectorAll('.block_calendar_upcoming .event');
  upcomingEvents.forEach(evt => {
    // Try to find a link that goes directly to the assignment mod
    let link = evt.querySelector('a[href*="mod/assign"]');
    if (!link) link = evt.querySelector('a'); // Fallback to event link

    const dateEl = evt.querySelector('.date');
    if (link && dateEl) {
      const title = link.innerText.trim();
      const parsedDate = parseMoodleDate(dateEl.innerText);
      if (parsedDate && isValidEvent(title)) {
        deadlines.push({
          id: link.href || 'evt_' + Math.random().toString(36).substr(2),
          title: title,
          date: getLocalTimeStr(parsedDate), 
          createdAt: now.toISOString(),
          isExactTime: true
        });
      }
    }
  });

  // Strategy 2: Timeline Block (Modern Moodle dashboard)
  const timelineItems = document.querySelectorAll('[data-region="event-list-item"]');
  timelineItems.forEach(item => {
    const titleEl = item.querySelector('.text-truncate, .event-name');
    const dateEl = item.querySelector('.text-muted, .text-right');
    // Prioritize direct assignment link
    let linkEl = item.querySelector('a[href*="mod/assign"]');
    if (!linkEl) linkEl = item.querySelector('a'); // Fallback

    if (titleEl && dateEl) {
      const title = titleEl.innerText.trim();
      const parsedDate = parseMoodleDate(dateEl.innerText);
      if (parsedDate && isValidEvent(title)) {
        deadlines.push({
          id: (linkEl ? linkEl.href : '') || 'evt_' + Math.random().toString(36).substr(2),
          title: title,
          date: getLocalTimeStr(parsedDate),
          createdAt: now.toISOString(),
          isExactTime: true
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
             
             if (isValidEvent(title)) {
               deadlines.push({
                  id: (link ? link.href : '') || 'evt_' + Math.random().toString(36).substr(2),
                  title: title,
                  date: getLocalTimeStr(dateObj),
                  createdAt: now.toISOString(),
                  isExactTime: false
               });
             }
           }
        });
     }
  });

  // Strategy 4: Assignment specific page (/mod/assign/view.php)
  if (window.location.href.includes('assign/view.php') || document.querySelector('.generaltable')) {
    const titleEl = document.querySelector('h2');
    let title = titleEl ? titleEl.innerText.trim() : document.title;
    
    // Some Moodle setups have the title as "Assignment: Sprint Review 03 - Submission"
    title = title.replace(/^Assignment\:\s*/i, '');
    
    let dueDateStr = null;
    const tableCells = document.querySelectorAll('td, th');
    for (let i = 0; i < tableCells.length; i++) {
        const text = tableCells[i].innerText.trim().toLowerCase();
        if (text === 'due date' || text === 'due:') {
            if (tableCells[i].nextElementSibling) {
                dueDateStr = tableCells[i].nextElementSibling.innerText;
                break;
            }
        }
    }
    
    if (!dueDateStr) {
      const allTextDivs = document.querySelectorAll('div, p');
      for (const div of allTextDivs) {
          const text = div.innerText;
          if (text && text.includes('Due:') && text.length < 100) {
              dueDateStr = text.split('Due:')[1].trim();
              break;
          }
      }
    }

    if (dueDateStr) {
        const parsedDate = parseMoodleDate(dueDateStr);
        if (parsedDate && isValidEvent(title)) {
           deadlines.push({
              id: window.location.href,
              title: title,
              date: getLocalTimeStr(parsedDate),
              createdAt: now.toISOString(),
              isExactTime: true
           });
        }
    }
  }

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
