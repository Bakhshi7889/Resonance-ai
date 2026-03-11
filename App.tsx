import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import ImageGenerator from './components/ImageGenerator';
import { History } from './components/History';
import { Preferences } from './components/Preferences';
import { StyleLibrary } from './components/StyleLibrary';
import { CreateStyle } from './components/CreateStyle';
import { CreatePreset } from './components/CreatePreset';
import { CommunityFeed } from './components/CommunityFeed';
import { Leaderboard } from './components/Leaderboard';
import { AppSettings, AppRoute, HistoryItem, MODEL_STYLES } from './types';
import { supabase } from './services/supabase';
import { storage } from './services/storage';

const STORAGE_KEY_SETTINGS = 'resonance_v4_settings';
const STORAGE_KEY_HISTORY = 'resonance_v4_history';
const STORAGE_KEY_SESSION_PROMPT = 'resonance_v4_session_prompt';
const STORAGE_KEY_SESSION_IMAGES = 'resonance_v4_session_images';

const DEFAULT_SETTINGS: AppSettings = {
  model: 'flux',
  width: 1536,
  height: 1536,
  enhance: true,
  privateMode: true,
  negativePrompt: '',
  imageCount: 1,
  activeStyles: ['none'],
  hiddenStyleIds: [],
  favoriteStyleIds: [],
  styleOrder: MODEL_STYLES.map(s => s.id), // Initialize with default order
  customStyles: [], 
  apiKey: 'sk_fH3vuxg5ULiDIzbVK7y6ejUg4eK1f0VF',
  quality: 'hd',
  infiniteMode: false,
  seed: 0,
  visualSafety: true
};

const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.GENERATOR);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [sessionPrompt, setSessionPrompt] = useState('');
  const [sessionImages, setSessionImages] = useState<HistoryItem[]>([]);

  // Load from IndexedDB (with localStorage migration)
  useEffect(() => {
    const loadStorage = async () => {
      try {
        // 1. Try IndexedDB first
        let storedSettings = await storage.get<AppSettings>(STORAGE_KEY_SETTINGS);
        let storedHistory = await storage.get<HistoryItem[]>(STORAGE_KEY_HISTORY);
        let storedPrompt = await storage.get<string>(STORAGE_KEY_SESSION_PROMPT);
        let storedImages = await storage.get<HistoryItem[]>(STORAGE_KEY_SESSION_IMAGES);

        // 2. Migration from localStorage if IndexedDB is empty
        if (!storedSettings) {
          const legacySettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
          if (legacySettings) {
            try {
              storedSettings = JSON.parse(legacySettings);
              await storage.set(STORAGE_KEY_SETTINGS, storedSettings);
            } catch (e) {}
          }
        }
        if (!storedHistory) {
          const legacyHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
          if (legacyHistory) {
            try {
              storedHistory = JSON.parse(legacyHistory);
              await storage.set(STORAGE_KEY_HISTORY, storedHistory);
            } catch (e) {}
          }
        }
        if (!storedPrompt) {
          const legacyPrompt = localStorage.getItem(STORAGE_KEY_SESSION_PROMPT);
          if (legacyPrompt) {
            storedPrompt = legacyPrompt;
            await storage.set(STORAGE_KEY_SESSION_PROMPT, storedPrompt);
          }
        }
        if (!storedImages) {
          const legacyImages = localStorage.getItem(STORAGE_KEY_SESSION_IMAGES);
          if (legacyImages) {
            try {
              storedImages = JSON.parse(legacyImages);
              await storage.set(STORAGE_KEY_SESSION_IMAGES, storedImages);
            } catch (e) {}
          }
        }

        // 3. Apply settings with defaults/migrations
        if (storedSettings) {
          if (!storedSettings.styleOrder || storedSettings.styleOrder.length === 0) {
            storedSettings.styleOrder = MODEL_STYLES.map(s => s.id);
          }
          if (!storedSettings.apiKey || storedSettings.apiKey.trim() === '') {
            storedSettings.apiKey = 'sk_fH3vuxg5ULiDIzbVK7y6ejUg4eK1f0VF';
          }
          // Migration: Switch from zimage to flux as default
          if (storedSettings.model === 'zimage') {
            storedSettings.model = 'flux';
          }
          setSettings({ ...DEFAULT_SETTINGS, ...storedSettings });
        }

        if (storedHistory) setHistory(storedHistory);
        if (storedPrompt) setSessionPrompt(storedPrompt);
        if (storedImages) setSessionImages(storedImages);

      } catch (e) {
        console.error('Storage Load Error:', e);
      } finally {
        setIsStorageLoaded(true);
      }
    };

    loadStorage();
  }, []);

  // Supabase Auth Listener
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  // Cross-tab synchronization and BYOP handle
  useEffect(() => {
    // Handle BYOP redirect key in hash
    if (window.location.hash.includes('api_key=')) {
        const params = new URLSearchParams(window.location.hash.slice(1));
        const key = params.get('api_key');
        if (key) {
            handleUpdateSettings({ apiKey: key });
            // Clear hash without reloading
            window.history.replaceState(null, '', window.location.pathname);
        }
    }

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
      storage.set(STORAGE_KEY_SETTINGS, updated);
      return updated;
    });
  }, []);

  const handleSetSessionPrompt = useCallback((prompt: string) => {
    setSessionPrompt(prompt);
    storage.set(STORAGE_KEY_SESSION_PROMPT, prompt);
  }, []);

  const handleAddToHistory = useCallback(async (item: HistoryItem) => {
    setHistory(prev => {
      const updated = [item, ...prev].slice(0, 500);
      storage.set(STORAGE_KEY_HISTORY, updated);
      return updated;
    });

    // Save to Supabase if user is logged in
    if (supabase && user) {
      try {
        const { error } = await supabase
          .from('generations')
          .insert([{
            user_id: user.id,
            prompt: item.prompt,
            url: item.url,
            model: item.model,
            width: item.width,
            height: item.height,
            seed: item.seed,
            style_suffix: item.styleSuffix,
            is_public: !settings.privateMode // Use privateMode setting to determine visibility
          }]);
        
        if (error) console.error('Resonance: Supabase Save Error', error);
      } catch (err) {
        console.error('Resonance: Supabase Save Exception', err);
      }
    }
  }, [user, settings.privateMode]);

  const handleDeleteHistory = useCallback((ids: string[]) => {
    setHistory(prev => {
      const updated = prev.filter(item => !ids.includes(item.id));
      storage.set(STORAGE_KEY_HISTORY, updated);
      return updated;
    });
  }, []);

  const handleSetSessionImages = useCallback((update: React.SetStateAction<HistoryItem[]>) => {
    setSessionImages(prev => {
      const next = typeof update === 'function' ? update(prev) : update;
      storage.set(STORAGE_KEY_SESSION_IMAGES, next);
      return next;
    });
  }, []);

  if (!isStorageLoaded) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="size-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

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
                handleUpdateSettings({ seed: item.seed });
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
      case AppRoute.CREATE_PRESET:
        return (
            <CreatePreset 
                key="create-preset"
                onNavigate={setCurrentRoute}
            />
        );
      case AppRoute.COMMUNITY:
        return (
            <CommunityFeed 
                key="community"
                onNavigate={setCurrentRoute}
                user={user}
            />
        );
      case AppRoute.LEADERBOARD:
        return (
            <Leaderboard 
                key="leaderboard"
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