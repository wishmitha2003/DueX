import { useState, useEffect } from 'react';
import { storage } from '../utils/storage.js';

const STORAGE_KEY = 'duex_deadlines';

export const useDeadlines = () => {
  const [deadlines, setDeadlines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDeadlines = async () => {
      const stored = await storage.get(STORAGE_KEY, []);
      const sorted = stored.sort((a, b) => new Date(a.date) - new Date(b.date));
      setDeadlines(sorted);
      setIsLoading(false);
    };
    
    loadDeadlines();
  }, []);

  const syncAndSave = async (newDeadlines) => {
    const sorted = newDeadlines.sort((a, b) => new Date(a.date) - new Date(b.date));
    setDeadlines(sorted);
    await storage.set(STORAGE_KEY, sorted);
    
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'DEADLINES_UPDATED' }).catch(() => {});
    }
  };

  const addDeadline = async (deadline) => {
    const newDeadline = {
      ...deadline,
      id: crypto.randomUUID() || Date.now().toString()
    };
    await syncAndSave([...deadlines, newDeadline]);
  };

  const updateDeadline = async (id, updates) => {
    const updated = deadlines.map(d => d.id === id ? { ...d, ...updates } : d);
    await syncAndSave(updated);
  };

  const deleteDeadline = async (id) => {
    const filtered = deadlines.filter(d => d.id !== id);
    await syncAndSave(filtered);
  };

  return { deadlines, addDeadline, updateDeadline, deleteDeadline, isLoading };
};
