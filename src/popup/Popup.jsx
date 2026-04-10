import React, { useState } from 'react';
import { CalendarClock, Plus, Settings } from 'lucide-react';
import DeadlineList from '../components/DeadlineList.jsx';
import DeadlineForm from '../components/DeadlineForm.jsx';
import SyncSettings from '../components/SyncSettings.jsx';
import { useDeadlines } from '../hooks/useDeadlines.js';
import './Popup.css';

const Popup = () => {
  const { deadlines, addDeadline, updateDeadline, deleteDeadline, isLoading } = useDeadlines();
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'passed'
  const [selectedModule, setSelectedModule] = useState('All');

  if (isLoading) {
    return <div className="loading-state">Loading...</div>;
  }

  // Filter logic
  const now = new Date();
  const filteredDeadlines = deadlines.filter(d => {
    const isPassed = new Date(d.date) < now;
    const matchesTab = activeTab === 'upcoming' ? !isPassed : isPassed;
    
    // Get the module string from either d.module or regex on title
    let mod = d.module;
    if (!mod) {
        const match = d.title.match(/\[([A-Z0-9]+)\]|([A-Z]{2,}\d{4})/i);
        mod = match ? (match[1] || match[2]).toUpperCase() : 'General';
    }

    if (selectedModule === 'All') return matchesTab;
    return matchesTab && mod === selectedModule;
  }).sort((a, b) => {
    // Sort upcoming by soonest first, passed by most recent first
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return activeTab === 'upcoming' ? dateA - dateB : dateB - dateA;
  });

  // Extract unique modules for the filter
  const modules = ['All', ...new Set(deadlines.map(d => {
    let mod = d.module;
    if (!mod) {
        // Look for patterns like [IT1010] or IT1010
        const match = d.title.match(/\[([A-Z0-9]+)\]|([A-Z]{2,}\d{4})/i);
        mod = match ? (match[1] || match[2]).toUpperCase() : 'General';
    }
    return mod;
  }).filter(Boolean))];

  return (
    <div className="popup-container">
      <header className="popup-header">
        <div className="header-title">
          <CalendarClock className="header-icon" size={24} />
          <h1>DueX</h1>
        </div>
        <div className="header-actions">
          <button 
            className={`icon-btn ${showSettings ? 'active' : ''}`} 
            onClick={() => { setShowSettings(!showSettings); setShowForm(false); }}
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>
          <button 
            className="add-btn" 
            onClick={() => { setShowForm(!showForm); setShowSettings(false); }}
            aria-label="Add deadline"
          >
            <Plus size={20} className={`plus-icon ${showForm ? 'rotate-45' : ''}`} />
          </button>
        </div>
      </header>

      {/* Navigation Tabs & Filters */}
      {!showForm && !showSettings && (
        <div className="filter-bar glass">
          <div className="tabs">
            <button 
              className={`tab-item ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming
            </button>
            <button 
              className={`tab-item ${activeTab === 'passed' ? 'active' : ''}`}
              onClick={() => setActiveTab('passed')}
            >
              History
            </button>
          </div>
          <div className="module-filter">
             <select 
               className="module-select" 
               value={selectedModule} 
               onChange={(e) => setSelectedModule(e.target.value)}
             >
               {modules.map(m => <option key={m} value={m}>{m}</option>)}
             </select>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="form-wrapper">
          <SyncSettings onSyncComplete={() => {
            setTimeout(() => window.location.reload(), 500);
          }} />
        </div>
      )}

      {showForm && !showSettings && (
        <div className="form-wrapper">
          <DeadlineForm 
            onSubmit={(data) => {
              addDeadline(data);
              setShowForm(false);
            }} 
            onCancel={() => setShowForm(false)} 
          />
        </div>
      )}

      <main className="popup-content">
        {filteredDeadlines.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-wrap glass">
              <CalendarClock size={32} className="empty-icon" />
            </div>
            <p className="empty-title">
              {activeTab === 'upcoming' ? 'No Deadlines' : 'No History'}
            </p>
            <span className="empty-subtitle">
              {selectedModule !== 'All' 
                ? `Nothing found for ${selectedModule}`
                : 'Your schedule is currently clear.'}
            </span>
          </div>
        ) : (
          <DeadlineList 
            deadlines={filteredDeadlines} 
            onEdit={updateDeadline} 
            onDelete={deleteDeadline} 
          />
        )}
      </main>
    </div>
  );
};

export default Popup;
