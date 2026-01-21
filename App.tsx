import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import ImageGenerator from './components/ImageGenerator';
import { History } from './components/History';
import { Preferences } from './components/Preferences';
import { AppSettings, AppRoute, HistoryItem } from './types';

const STORAGE_KEY_SETTINGS = 'resonance_v4_settings';
const STORAGE_KEY_HISTORY = 'resonance_v4_history';
const STORAGE_KEY_SESSION_PROMPT = 'resonance_v4_session_prompt';
const STORAGE_KEY_SESSION_IMAGES = 'resonance_v4_session_images';

const DEFAULT_SETTINGS: AppSettings = {
  model: 'zimage',
  width: 1024,
  height: 1024,
  enhance: true,
  privateMode: true,
  negativePrompt: '',
  imageCount: 1,
  activeStyles: ['none'],
  apiKey: '',
  quality: 'hd',
  infiniteMode: false,
  seed: 0,
  visualSafety: true
};

const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.GENERATOR);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  });

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const [sessionPrompt, setSessionPrompt] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_SESSION_PROMPT) || '';
  });

  const [sessionImages, setSessionImages] = useState<HistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SESSION_IMAGES);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  // PWA Install Logic
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    }
  };

  // Cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.newValue) return;
      try {
        if (e.key === STORAGE_KEY_SETTINGS) setSettings(JSON.parse(e.newValue));
        if (e.key === STORAGE_KEY_HISTORY) setHistory(JSON.parse(e.newValue));
        if (e.key === STORAGE_KEY_SESSION_PROMPT) setSessionPrompt(e.newValue);
        if (e.key === STORAGE_KEY_SESSION_IMAGES) setSessionImages(JSON.parse(e.newValue));
      } catch (err) {
        console.error("Resonance: Sync Error", err);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleUpdateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleSetSessionPrompt = useCallback((prompt: string) => {
    setSessionPrompt(prompt);
    localStorage.setItem(STORAGE_KEY_SESSION_PROMPT, prompt);
  }, []);

  const handleAddToHistory = useCallback((item: HistoryItem) => {
    setHistory(prev => {
      const updated = [item, ...prev].slice(0, 500);
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleDeleteHistory = useCallback((ids: string[]) => {
    setHistory(prev => {
      const updated = prev.filter(item => !ids.includes(item.id));
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleSetSessionImages = useCallback((update: React.SetStateAction<HistoryItem[]>) => {
    setSessionImages(prev => {
      const next = typeof update === 'function' ? update(prev) : update;
      localStorage.setItem(STORAGE_KEY_SESSION_IMAGES, JSON.stringify(next));
      return next;
    });
  }, []);

  const renderScreen = () => {
    switch (currentRoute) {
      case AppRoute.GENERATOR:
        return (
          <ImageGenerator 
            settings={settings} 
            updateSettings={handleUpdateSettings}
            onNavigate={setCurrentRoute}
            onAddToHistory={handleAddToHistory}
            sessionPrompt={sessionPrompt}
            setSessionPrompt={handleSetSessionPrompt}
            sessionImages={sessionImages}
            setSessionImages={handleSetSessionImages}
          />
        );
      case AppRoute.HISTORY:
        return (
          <History 
            history={history} 
            onNavigate={setCurrentRoute}
            onRemix={(item) => {
                handleSetSessionPrompt(item.prompt);
                setCurrentRoute(AppRoute.GENERATOR);
            }}
            onDelete={handleDeleteHistory}
          />
        );
      case AppRoute.PREFERENCES:
        return (
          <Preferences 
            settings={settings} 
            updateSettings={handleUpdateSettings} 
            onNavigate={setCurrentRoute}
            installAvailable={!!deferredPrompt}
            onInstall={handleInstallApp}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      {renderScreen()}
    </Layout>
  );
};

export default App;