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
    <form className="glass custom-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h3>{initialData ? 'Edit Deadline' : 'New Deadline'}</h3>
        <button type="button" onClick={onCancel} className="close-btn" aria-label="Cancel">
          <X size={16} />
        </button>
      </div>

      <div className="form-group">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. History Essay"
          autoFocus
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group flex-1">
          <label htmlFor="date">
            <CalendarIcon size={14} className="label-icon"/> Date
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        
        <div className="form-group flex-1">
          <label htmlFor="time">
            <Clock size={14} className="label-icon"/> Time
          </label>
          <input
            id="time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
      </div>

      <button type="submit" className="submit-btn">
        {initialData ? 'Save Changes' : 'Add Deadline'}
      </button>

      <style>{`
        .custom-form {
          padding: 1.25rem;
          border-radius: var(--radius-lg);
          margin-bottom: 0.5rem;
        }
        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }
        .form-header h3 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .close-btn {
          color: var(--text-secondary);
        }
        .close-btn:hover {
          color: var(--danger);
        }
        .form-group {
          margin-bottom: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .form-row {
          display: flex;
          gap: 0.75rem;
        }
        .flex-1 {
          flex: 1;
        }
        label {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }
        .label-icon {
          opacity: 0.7;
        }
        input {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 0.625rem;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s;
        }
        input:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
        input::placeholder {
          color: var(--text-secondary);
          opacity: 0.5;
        }
        ::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 0.6;
          cursor: pointer;
        }
        ::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }
        .submit-btn {
          width: 100%;
          background: var(--accent-primary);
          color: white;
          padding: 0.75rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }
        .submit-btn:hover {
          background: var(--accent-hover);
        }
      `}</style>
    </form>
  );
};

export default DeadlineForm;
