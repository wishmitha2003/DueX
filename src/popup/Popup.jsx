import React, { useState } from 'react';
import { CalendarClock, Plus } from 'lucide-react';
import DeadlineList from '../components/DeadlineList.jsx';
import DeadlineForm from '../components/DeadlineForm.jsx';
import { useDeadlines } from '../hooks/useDeadlines.js';
import './Popup.css';

const Popup = () => {
  const { deadlines, addDeadline, updateDeadline, deleteDeadline, isLoading } = useDeadlines();
  const [showForm, setShowForm] = useState(false);

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
        <button 
          className="add-btn" 
          onClick={() => setShowForm(!showForm)}
          aria-label={showForm ? "Close form" : "Add deadline"}
        >
          <Plus size={20} className={`plus-icon ${showForm ? 'rotate-45' : ''}`} />
        </button>
      </header>

      {showForm && (
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
        {deadlines.length === 0 && !showForm ? (
          <div className="empty-state">
            <div className="empty-icon-wrap glass">
              <CalendarClock size={40} className="empty-icon" />
            </div>
            <p className="empty-title">No upcoming deadlines</p>
            <span className="empty-subtitle">Click the + button to add one</span>
          </div>
        ) : (
          <DeadlineList 
            deadlines={deadlines} 
            onEdit={updateDeadline} 
            onDelete={deleteDeadline} 
          />
        )}
      </main>
    </div>
  );
};

export default Popup;
