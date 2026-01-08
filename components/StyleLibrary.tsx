
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppRoute, MODEL_STYLES, AppSettings } from '../types';
import { Header } from './Header';
import { DEFAULT_KEY } from '../services/pollinations';

interface StyleLibraryProps {
  onNavigate: (route: AppRoute) => void;
  settings: AppSettings;
}

export const StyleLibrary: React.FC<StyleLibraryProps> = ({ onNavigate, settings }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  // Staggered loading logic
  useEffect(() => {
    // Only run if user has started generation
    if (!isGenerating) return;

    // If all loaded, stop
    if (visibleCount >= MODEL_STYLES.length) {
        setIsGenerating(false);
        return;
    }

    // Logic: 2s delay normally, 10s delay after every 5 images
    const isBatchBreak = visibleCount > 0 && visibleCount % 5 === 0;
    
    // Initial delay for the very first item is short
    const delay = isBatchBreak ? 10 : 2;

    setSecondsLeft(delay);
    
    const timer = setInterval(() => {
        setSecondsLeft((prev) => {
            if (prev <= 1) {
                setVisibleCount((v) => v + 1);
                return 0; // Reset
            }
            return prev - 1;
        });
    }, 1000);

    return () => clearInterval(timer);
  }, [visibleCount, isGenerating]);

  const getOptimizedUrl = (url: string) => {
      let finalUrl = url;
      
      // Explicitly disable expensive operations
      finalUrl += "&enhance=false&safe=false";

      // Use User Key or Fallback to Default Key
      const keyToUse = (settings.apiKey && settings.apiKey.trim().length > 0) 
        ? settings.apiKey.trim() 
        : DEFAULT_KEY;

      finalUrl += `&key=${keyToUse}`;
      return finalUrl;
  };

  const handleCopyJson = () => {
    const exportData = MODEL_STYLES.map(style => ({
        id: style.id,
        model: style.model,
        label: style.label,
        image: style.image, // Base URL
        suffix: style.suffix
    }));

    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    setCopiedId('ALL');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopySingle = (url: string, id: string) => {
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
  };

  const currentKey = (settings.apiKey && settings.apiKey.trim().length > 0) ? settings.apiKey : DEFAULT_KEY;
  const isCustomKey = settings.apiKey && settings.apiKey.trim().length > 0;

  return (
    <motion.div 
      className="flex flex-col h-full bg-background-dark w-full"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      <div className="w-full max-w-4xl mx-auto flex flex-col h-full">
        <Header 
            leftIcon="arrow_back"
            onLeftClick={() => onNavigate(AppRoute.PREFERENCES)}
            title="Style Library"
        />

        <div className="p-6 flex-1 overflow-y-auto no-scrollbar">
            <div className="mb-8 bg-surface-dark border border-white/10 rounded-2xl p-6 shadow-glass">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">Asset Generator</h2>
                        <div className="flex items-center gap-2">
                            <span className={`size-2 rounded-full shadow-[0_0_8px] ${isCustomKey ? 'bg-purple-500 shadow-purple-500/60' : 'bg-blue-500 shadow-blue-500/60'}`}></span>
                            <span className="text-xs font-mono text-white/60">
                                {isCustomKey ? 'Using Personal Key' : 'Using System Pro Key'}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                         <span className="text-xs font-bold text-white/40 uppercase tracking-widest block">Progress</span>
                         <span className="text-xl font-mono text-white">{visibleCount} / {MODEL_STYLES.length}</span>
                    </div>
                </div>
                
                <div className="w-full bg-white/5 rounded-full h-1.5 mb-6 overflow-hidden">
                    <div 
                        className="h-full bg-primary transition-all duration-500 ease-out" 
                        style={{ width: `${Math.min((visibleCount / MODEL_STYLES.length) * 100, 100)}%` }}
                    />
                </div>

                <div className="flex flex-col gap-3">
                     <button 
                        onClick={() => setIsGenerating(!isGenerating)}
                        className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${isGenerating ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' : 'bg-primary text-white hover:bg-primary/90'}`}
                    >
                        <span className="material-symbols-outlined">{isGenerating ? 'pause' : 'play_arrow'}</span>
                        {isGenerating ? `Running... (Cooldown in ${secondsLeft}s)` : (visibleCount > 0 ? 'Resume Generation' : 'Start Generation')}
                    </button>

                    <button 
                        onClick={handleCopyJson}
                        className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 font-medium transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">data_object</span>
                        {copiedId === 'ALL' ? 'Copied JSON!' : 'Copy Style Data'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-12">
                {MODEL_STYLES.map((style, index) => {
                    const isVisible = index < visibleCount;
                    const isNext = index === visibleCount && isGenerating;

                    return (
                        <div key={style.id} className="bg-surface-dark rounded-2xl border border-white/5 overflow-hidden group relative transition-all duration-300">
                            <div className="aspect-[2/3] relative bg-black/20">
                                {isVisible ? (
                                    <img 
                                        src={getOptimizedUrl(style.image)} 
                                        alt={style.label} 
                                        className="w-full h-full object-cover animate-in fade-in duration-700"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                        {isNext ? (
                                            <>
                                                <div className="size-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
                                                <span className="text-xs font-bold text-primary tabular-nums">Generating {secondsLeft}s</span>
                                            </>
                                        ) : (
                                            <span className="text-xs text-white/20 font-bold">Waiting</span>
                                        )}
                                    </div>
                                )}
                                
                                {isVisible && (
                                    <>
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button 
                                                onClick={() => handleCopySingle(style.image, style.id)}
                                                className="px-4 py-2 bg-white text-black rounded-full text-xs font-bold hover:scale-105 transition-transform"
                                            >
                                                {copiedId === style.id ? 'Copied' : 'Copy URL'}
                                            </button>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                            <span className="text-white text-sm font-bold block">{style.label}</span>
                                            <span className="text-white/50 text-[10px] uppercase font-bold tracking-wider">{style.model}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    </motion.div>
  );
};
