import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import ImageGenerator from './components/ImageGenerator';
import { History } from './components/History';
import { Preferences } from './components/Preferences';
import { StyleLibrary } from './components/StyleLibrary';
import { CreateStyle } from './components/CreateStyle';
import { AppSettings, AppRoute, HistoryItem, MODEL_STYLES } from './types';

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
  hiddenStyleIds: [],
  favoriteStyleIds: [],
  styleOrder: MODEL_STYLES.map(s => s.id), // Initialize with default order
  customStyles: [], 
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
      if (stored) {
          const parsed = JSON.parse(stored);
          // Ensure styleOrder exists for legacy data migration
          if (!parsed.styleOrder || parsed.styleOrder.length === 0) {
              parsed.styleOrder = MODEL_STYLES.map(s => s.id);
          }
          return { ...DEFAULT_SETTINGS, ...parsed };
      }
      return DEFAULT_SETTINGS;
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

  // PWA Install Prompt Logic
  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      console.log('Resonance: Install prompt deferred');
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Resonance: Install prompt outcome: ${outcome}`);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

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
            key="generator"
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
            key="history"
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
            key="preferences"
            settings={settings} 
            updateSettings={handleUpdateSettings} 
            onNavigate={setCurrentRoute}
            canInstall={!!deferredPrompt}
            onInstallApp={handleInstallApp}
          />
        );
      case AppRoute.STYLE_LIBRARY:
        return (
          <StyleLibrary
            key="style-library"
            settings={settings}
            updateSettings={handleUpdateSettings}
            onNavigate={setCurrentRoute}
          />
        );
      case AppRoute.CREATE_STYLE:
        return (
            <CreateStyle 
                key="create-style"
                settings={settings}
                updateSettings={handleUpdateSettings}
                onNavigate={setCurrentRoute}
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