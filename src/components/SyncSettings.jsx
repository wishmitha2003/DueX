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
    <div className="glass custom-form sync-settings">
      <div className="form-header">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={16} /> Courseweb Sync
        </h3>
      </div>
      
      <p className="sync-description">
        Paste your Moodle/Courseweb <strong>Calendar Export URL (ICS)</strong> below to automatically sync deadlines. This keeps updating even when you are offline!
      </p>

      <form onSubmit={handleSaveAndSync}>
        <div className="form-group">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://courseweb.../export.moodle"
            style={{ width: '100%', marginBottom: '8px' }}
          />
        </div>
        
        <button 
          type="submit" 
          className="submit-btn" 
          disabled={isSyncing}
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
        >
          {isSyncing ? (
            <RefreshCw size={16} className="spin" />
          ) : saved ? (
            <Check size={16} />
          ) : (
            <RefreshCw size={16} />
          )}
          {isSyncing ? 'Syncing...' : saved ? 'Saved!' : 'Save & Sync'}
        </button>
      </form>
      
      <style>{`
        .sync-settings {
          margin-bottom: 1rem;
        }
        .sync-description {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
          line-height: 1.4;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SyncSettings;
