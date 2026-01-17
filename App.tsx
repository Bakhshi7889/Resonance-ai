
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ImageGenerator } from './components/ImageGenerator';
import { History } from './components/History';
import { Preferences } from './components/Preferences';
import { CreatePreset } from './components/CreatePreset';
import { StyleLibrary } from './components/StyleLibrary';
import { AppSettings, AppRoute, HistoryItem } from './types';

const STORAGE_KEY_SETTINGS = 'resonance_settings';
const STORAGE_KEY_HISTORY = 'resonance_history';
const MAX_HISTORY_ITEMS = 1000;

const DEFAULT_SETTINGS: AppSettings = {
  model: 'zimage',
  width: 1024,
  height: 1024,
  enhance: false, // Default Off
  guidance: 7.5,
  privateMode: true,
  negativePrompt: '',
  imageCount: 1,
  activeStyle: 'z-real',
  apiKey: '',
  safe: true, // Default On
  transparent: false, // Default Off
  quality: 'medium', // Default Medium
  upscale: false, // Default Normal Resolution
  isUnlocked: false, // Default Locked
  infiniteMode: false // Default Off
};

const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.GENERATOR);
  const [remixItem, setRemixItem] = useState<HistoryItem | null>(null);

  // Initialize State from LocalStorage
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        
        // Force private mode to true on load
        parsedSettings.privateMode = true;
        
        // Merge with defaults to ensure new keys exist
        return { ...DEFAULT_SETTINGS, ...parsedSettings };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load history", e);
      return [];
    }
  });

  // Session State (Lifted from ImageGenerator)
  // Initialize as empty for a clean slate on every launch, regardless of history
  const [sessionPrompt, setSessionPrompt] = useState('');
  // CHANGED: Use HistoryItem[] to store metadata (prompt, style) with current images
  const [sessionImages, setSessionImages] = useState<HistoryItem[]>([]);

  // Persist settings
  useEffect(() => {
    try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
        console.error("Failed to save settings", e);
    }
  }, [settings]);

  // Persist history
  useEffect(() => {
    try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch (e) {
        console.error("Failed to save history", e);
    }
  }, [history]);

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleAddToHistory = (item: HistoryItem) => {
    setHistory(prev => {
        const newHistory = [item, ...prev];
        // Enforce limit to prevent localStorage quota issues
        return newHistory.slice(0, MAX_HISTORY_ITEMS);
    });
  };

  const handleDeleteHistory = (ids: string[]) => {
    setHistory(prev => prev.filter(item => !ids.includes(item.id)));
  };

  const handleRemix = (item: HistoryItem) => {
    setRemixItem(item);
    setCurrentRoute(AppRoute.GENERATOR);
  };

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
            remixItem={remixItem}
            onClearRemix={() => setRemixItem(null)}
            sessionPrompt={sessionPrompt}
            setSessionPrompt={setSessionPrompt}
            sessionImages={sessionImages}
            setSessionImages={setSessionImages}
          />
        );
      case AppRoute.HISTORY:
        return (
          <History 
            key="history"
            history={history} 
            onNavigate={setCurrentRoute}
            onRemix={handleRemix}
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
          />
        );
      case AppRoute.CREATE_PRESET:
        return (
          <CreatePreset 
            key="create-preset"
            onNavigate={setCurrentRoute}
          />
        );
      case AppRoute.STYLE_LIBRARY:
        return (
          <StyleLibrary 
            key="style-library"
            onNavigate={setCurrentRoute}
            settings={settings}
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
