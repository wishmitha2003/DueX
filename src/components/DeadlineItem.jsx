import React, { useState } from 'react';
import { Pencil, Trash2, Calendar, AlertCircle } from 'lucide-react';
import CountdownTimer from './CountdownTimer.jsx';
import DeadlineForm from './DeadlineForm.jsx';
import { isImminent } from '../utils/dateUtils.js';

const DeadlineItem = ({ deadline, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const imminent = isImminent(deadline.date);
  
  if (isEditing) {
    return (
      <DeadlineForm
        initialData={deadline}
        onSubmit={(data) => {
          onEdit(deadline.id, data);
          setIsEditing(false);
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  const dateObj = new Date(deadline.date);
  const formattedDate = dateObj.toLocaleDateString(undefined, { 
    month: 'short', day: 'numeric', year: 'numeric' 
  });
  const formattedTime = dateObj.toLocaleTimeString(undefined, { 
    hour: '2-digit', minute: '2-digit' 
  });

  return (
    <div className={`deadline-item glass ${imminent ? 'imminent' : ''}`}>
      <div className="item-header">
        <h4 className="item-title">{deadline.title}</h4>
        <div className="item-actions">
          <button onClick={() => setIsEditing(true)} className="action-btn edit-btn" aria-label="Edit">
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(deadline.id)} className="action-btn delete-btn" aria-label="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      
      <div className="item-meta">
        <span className="date-badge">
          <Calendar size={12} className="meta-icon" />
          {formattedDate} at {formattedTime}
        </span>
        {imminent && (
          <span className="warning-badge" title="Due in less than 24 hours">
            <AlertCircle size={12} className="meta-icon" />
            Soon
          </span>
        )}
      </div>

      <div className="item-footer">
        <CountdownTimer targetDate={deadline.date} />
      </div>

      <style>{`
        .deadline-item {
          padding: 1rem;
          border-radius: var(--radius-md);
          position: relative;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .deadline-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px -2px rgba(0, 0, 0, 0.3);
        }
        .deadline-item.imminent::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 3px;
          height: 100%;
          background: var(--warning);
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }
        .item-title {
          font-weight: 600;
          font-size: 1rem;
          color: var(--text-primary);
          line-height: 1.4;
          word-break: break-word;
          padding-right: 1rem;
        }
        .item-actions {
          display: flex;
          gap: 0.25rem;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .deadline-item:hover .item-actions {
          opacity: 1;
        }
        .action-btn {
          width: 24px;
          height: 24px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          background: transparent;
        }
        .edit-btn:hover {
          background: rgba(59, 130, 246, 0.1);
          color: var(--accent-primary);
        }
        .delete-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger);
        }
        .item-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .date-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
          background: rgba(15, 23, 42, 0.5);
          padding: 0.25rem 0.5rem;
          border-radius: 1rem;
        }
        .warning-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: var(--warning);
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.2);
          padding: 0.25rem 0.5rem;
          border-radius: 1rem;
          font-weight: 500;
        }
        .meta-icon {
          opacity: 0.8;
        }
        .item-footer {
          border-top: 1px solid var(--border-color);
          padding-top: 0.75rem;
        }
      `}</style>
    </div>
  );
};

export default DeadlineItem;
