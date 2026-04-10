import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock } from 'lucide-react';

const DeadlineForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [date, setDate] = useState(initialData?.date.split('T')[0] || '');
  const [time, setTime] = useState(
    initialData?.date.split('T')[1]?.substring(0, 5) || '23:59'
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !date) return;
    
    const dateTimeString = `${date}T${time}:00`;
    onSubmit({
      title,
      date: dateTimeString,
      createdAt: initialData?.createdAt || new Date().toISOString()
    });
  };

  return (
    <form className="deadline-form-card glass" onSubmit={handleSubmit}>
      <div className="form-header">
        <div className="icon-badge secondary">
          {initialData ? <Plus size={18} style={{ transform: 'rotate(45deg)' }} /> : <Plus size={18} />}
        </div>
        <div className="header-text">
          <h3>{initialData ? 'Edit Milestone' : 'New Milestone'}</h3>
          <p>{initialData ? 'Update existing deadline' : 'Create a new manual entry'}</p>
        </div>
        <button type="button" onClick={onCancel} className="close-btn" aria-label="Cancel">
          <X size={18} />
        </button>
      </div>

      <div className="form-body">
        <div className="form-group">
          <label htmlFor="title">Task Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Software Engineering Assignment"
            className="styled-input"
            autoFocus
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group flex-1">
            <label htmlFor="date">
              <CalendarIcon size={14} /> Due Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="styled-input"
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div className="form-group flex-1">
            <label htmlFor="time">
              <Clock size={14} /> Time
            </label>
            <input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="styled-input"
              required
            />
          </div>
        </div>

        <button type="submit" className="submit-btn secondary">
          {initialData ? 'Update Deadline' : 'Register Deadline'}
        </button>
      </div>

      <style>{`
        .deadline-form-card {
          border-radius: var(--radius-lg);
          overflow: hidden;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95));
        }
        .icon-badge.secondary {
          background: linear-gradient(135deg, var(--accent-secondary), #d946ef);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }
        .form-body {
          padding: 1.25rem;
        }
        .close-btn {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          transition: all 0.2s;
        }
        .close-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger);
        }
        .submit-btn.secondary {
           background: linear-gradient(to right, var(--accent-secondary), #7c3aed);
           box-shadow: 0 4px 15px rgba(139, 92, 246, 0.2);
        }
        .submit-btn.secondary:hover {
           box-shadow: 0 6px 20px rgba(139, 92, 246, 0.3);
        }
        ::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 0.5;
          cursor: pointer;
        }
      `}</style>
    </form>
  );
};

export default DeadlineForm;
