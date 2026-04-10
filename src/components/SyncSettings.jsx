import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, Check } from 'lucide-react';
import { storage } from '../utils/storage';

const SYNC_URL_KEY = 'duex_sync_url';

const SyncSettings = ({ onSyncComplete }) => {
  const [url, setUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    storage.get(SYNC_URL_KEY, '').then(setUrl);
  }, []);

  const handleSaveAndSync = async (e) => {
    e.preventDefault();
    setIsSyncing(true);
    
    // Save URL
    await storage.set(SYNC_URL_KEY, url);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    // Trigger background sync if in extension context
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'TRIGGER_SYNC' }, (response) => {
        setIsSyncing(false);
        if (onSyncComplete) onSyncComplete();
      });
    } else {
      // Local dev fallback
      setTimeout(() => {
        setIsSyncing(false);
        if (onSyncComplete) onSyncComplete();
      }, 1000);
    }
  };

  return (
    <div className="sync-settings-card glass">
      <div className="card-header">
        <div className="icon-badge">
          <Settings size={18} />
        </div>
        <div className="header-text">
          <h3>Courseweb Sync</h3>
          <p>Sync deadlines automatically</p>
        </div>
      </div>
      
      <div className="card-body">
        <p className="instruction-text">
          Enter your <strong>Moodle Calendar Export URL</strong> to track assignments in real-time.
        </p>

        <form onSubmit={handleSaveAndSync} className="sync-form">
          <div className="input-wrapper">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://courseweb.sliit.lk/..."
              className="styled-input"
            />
          </div>
          
          <button 
            type="submit" 
            className={`sync-btn ${saved ? 'saved' : ''}`} 
            disabled={isSyncing}
          >
            {isSyncing ? (
              <RefreshCw size={18} className="spin" />
            ) : saved ? (
              <Check size={18} />
            ) : (
              <RefreshCw size={18} />
            )}
            <span>{isSyncing ? 'Synchronizing...' : saved ? 'Successfully Saved' : 'Save & Sync Now'}</span>
          </button>
        </form>
      </div>
      
      <style>{`
        .sync-settings-card {
          margin-bottom: 1.5rem;
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9));
        }
        .card-header {
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          border-bottom: 1px solid var(--border-color);
          background: rgba(59, 130, 246, 0.05);
        }
        .icon-badge {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--accent-primary), #6366f1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        .header-text h3 {
          font-size: 1rem;
          font-weight: 700;
          color: white;
          margin: 0;
        }
        .header-text p {
          font-size: 0.7rem;
          color: var(--text-secondary);
          margin: 0;
        }
        .card-body {
          padding: 1.25rem;
        }
        .instruction-text {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 1.15rem;
          line-height: 1.5;
        }
        .sync-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .styled-input {
          width: 100%;
          background: rgba(15, 23, 42, 0.7) !important;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 0.8rem 1rem;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          outline: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .styled-input:focus {
          border-color: var(--accent-primary);
          background: rgba(15, 23, 42, 0.9) !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }
        .sync-btn {
          width: 100%;
          background: linear-gradient(to right, var(--accent-primary), var(--accent-hover));
          color: white;
          padding: 0.85rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          box-shadow: 0 4px 15px rgba(37, 99, 235, 0.2);
        }
        .sync-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.3);
        }
        .sync-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .sync-btn.saved {
          background: var(--success);
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
        }
        .spin {
          animation: spin 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SyncSettings;
