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

  if (isLoading) {
    return <div className="loading-state">Loading...</div>;
  }

  return (
    <div className="popup-container">
      <header className="popup-header">
        <div className="header-title">
          <CalendarClock className="header-icon" size={24} />
          <h1>DueX</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="icon-btn" 
            onClick={() => setShowSettings(!showSettings)}
            aria-label={showSettings ? "Close settings" : "Open settings"}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
          >
            <Settings size={20} />
          </button>
          <button 
            className="add-btn" 
            onClick={() => { setShowForm(!showForm); setShowSettings(false); }}
            aria-label={showForm ? "Close form" : "Add deadline"}
          >
            <Plus size={20} className={`plus-icon ${showForm ? 'rotate-45' : ''}`} />
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="form-wrapper slide-down">
          <SyncSettings onSyncComplete={() => {
            // Give time for storage to update via background worker, then reload window
            setTimeout(() => window.location.reload(), 500);
          }} />
        </div>
      )}

      {showForm && !showSettings && (
        <div className="form-wrapper slide-down">
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
        {deadlines.length === 0 && !showForm && !showSettings ? (
          <div className="empty-state">
            <div className="empty-icon-wrap glass">
              <CalendarClock size={40} className="empty-icon" />
            </div>
            <p className="empty-title">No upcoming deadlines</p>
            <span className="empty-subtitle">Click the + button to add one or the ⚙️ icon to Auto Sync</span>
          </div>
        ) : (!showSettings && (
          <DeadlineList 
            deadlines={deadlines} 
            onEdit={updateDeadline} 
            onDelete={deleteDeadline} 
          />
        ))}
      </main>
    </div>
  );
};

export default Popup;
