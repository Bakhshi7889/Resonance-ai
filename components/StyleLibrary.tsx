
import React, { useState, useEffect, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppRoute, MODEL_STYLES, AppSettings } from '../types';
import { Header } from './Header';
// Fix: Removed non-existent DEFAULT_KEY and imported getEffectiveKey
import { getRandomSeed, getEffectiveKey as getServiceKey } from '../services/pollinations';

interface StyleLibraryProps {
  onNavigate: (route: AppRoute) => void;
  settings: AppSettings;
}

const STORAGE_KEY_STYLE_GEN = 'resonance_style_generations';

// Memoized Style Card Component for Performance
const StyleCard = memo(({ 
    style, 
    state, 
    onGenerate, 
    onReset, 
    onCopyUrl, 
    onCopyImage,
    copiedId 
}: {
    style: typeof MODEL_STYLES[0],
    state: { url?: string, isLoading?: boolean, seed?: number } | undefined,
    onGenerate: (id: string, img: string) => void,
    onReset: (id: string) => void,
    onCopyUrl: (url: string, id: string) => void,
    onCopyImage: (url: string, id: string) => void,
    copiedId: string | null
}) => {
    const [isImgLoaded, setIsImgLoaded] = useState(false);
    const currentUrl = state?.url || style.image;
    const isLoading = state?.isLoading || false;
    const hasGenerated = !!state?.url;

    useEffect(() => {
        // Reset local load state when URL changes to trigger animation
        setIsImgLoaded(false); 
    }, [currentUrl]);

    return (
        <div className="bg-surface-dark rounded-3xl border border-white/5 overflow-hidden group relative transition-all duration-300 flex flex-col hover:border-white/20 hover:shadow-2xl hover:-translate-y-1 will-change-transform">
            {/* Image Container */}
            <div className="aspect-[2/3] relative bg-surface-highlight/30 overflow-hidden">
                
                {/* Fallback Pulse (behind) */}
                <div 
                    className={`absolute inset-0 bg-white/5 animate-pulse z-0`} 
                />

                {/* The Image with Blur Reveal */}
                <img 
                    src={currentUrl} 
                    alt={style.label} 
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out z-0 ${isImgLoaded && !isLoading ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-xl scale-105'}`}
                    loading="lazy"
                    onLoad={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src === currentUrl) {
                            setIsImgLoaded(true);
                        }
                    }}
                />
                
                {/* Loading Spinner for Generation Process (Overlay) */}
                <AnimatePresence>
                    {isLoading && (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center z-10 bg-black/40 backdrop-blur-sm"
                        >
                             <div className="size-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 p-4 z-20">
                     <div className="flex items-center gap-3">
                        <button 
                            onClick={() => onGenerate(style.id, style.image)}
                            className="size-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-primary hover:border-primary transition-all shadow-lg active:scale-90"
                            title={hasGenerated ? "Regenerate (New Seed)" : "Generate"}
                        >
                            <span className="material-symbols-outlined text-[24px]">{hasGenerated ? 'refresh' : 'play_arrow'}</span>
                        </button>
                        
                        {hasGenerated && (
                            <button 
                                onClick={() => onReset(style.id)}
                                className="size-10 rounded-full bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-90"
                                title="Reset to Default"
                            >
                                <span className="material-symbols-outlined text-[20px]">undo</span>
                            </button>
                        )}
                     </div>
                    
                    <div className="flex gap-2 w-full mt-2">
                         <button 
                            onClick={() => onCopyUrl(currentUrl, style.id)}
                            className="flex-1 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold hover:bg-white hover:text-black transition-all flex items-center justify-center gap-1 active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[14px]">link</span>
                            {copiedId === style.id ? 'Copied' : 'Link'}
                        </button>
                        <button 
                            onClick={() => onCopyImage(currentUrl, style.id)}
                            className="flex-1 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold hover:bg-white hover:text-black transition-all flex items-center justify-center gap-1 active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[14px]">image</span>
                            {copiedId === `${style.id}-img` ? 'Copied' : 'Img'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-white text-sm font-bold truncate">{style.label}</span>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-white/30 px-1.5 py-0.5 rounded bg-white/5 border border-white/5">{style.category}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-white/40 truncate max-w-[100px]">
                        {state?.seed || 'Default'}
                    </span>
                    {!hasGenerated && (
                        <button 
                            onClick={() => onGenerate(style.id, style.image)}
                            className="text-[10px] font-bold text-primary hover:text-primary/80 uppercase tracking-wide flex items-center gap-1"
                        >
                            Generate
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});

export const StyleLibrary: React.FC<StyleLibraryProps> = ({ onNavigate, settings }) => {
  // Initialize state from local storage if available
  const [generationStates, setGenerationStates] = useState<Record<string, { url: string, isLoading: boolean, seed: number }>>(() => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_STYLE_GEN);
        return stored ? JSON.parse(stored) : {};
    } catch (e) {
        return {};
    }
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Persist state changes
  useEffect(() => {
    try {
        localStorage.setItem(STORAGE_KEY_STYLE_GEN, JSON.stringify(generationStates));
    } catch (e) {
        console.error("Failed to persist style states", e);
    }
  }, [generationStates]);

  // Fix: Use imported getServiceKey instead of non-existent DEFAULT_KEY
  const getEffectiveKey = () => {
      return (settings.apiKey && settings.apiKey.trim().length > 0) ? settings.apiKey.trim() : getServiceKey();
  };

  const generateStyle = useCallback((styleId: string, originalUrl: string) => {
    const seed = getRandomSeed();
    setGenerationStates(prev => ({
        ...prev,
        [styleId]: { ...prev[styleId], isLoading: true, seed }
    }));

    try {
        const urlObj = new URL(originalUrl);
        // Update params for a fresh generation
        urlObj.searchParams.set('seed', seed.toString());
        urlObj.searchParams.set('key', getEffectiveKey());
        urlObj.searchParams.set('nologo', 'true');
        // Ensure consistent quality and size for previews
        urlObj.searchParams.set('enhance', 'true'); 
        urlObj.searchParams.set('width', '256');
        urlObj.searchParams.set('height', '384');
        
        const newUrl = urlObj.toString();

        // Image preloading to ensure loading state is accurate
        const img = new Image();
        img.src = newUrl;
        img.onload = () => {
             setGenerationStates(prev => ({
                ...prev,
                [styleId]: { url: newUrl, isLoading: false, seed }
            }));
        };
        img.onerror = () => {
             // On error, revert to default or keep previous, but stop loading
             console.error("Failed to load generated image");
             setGenerationStates(prev => {
                 const newState = { ...prev };
                 // Keep previous URL if it existed, otherwise remove entry to show default
                 if (newState[styleId]?.url && newState[styleId].url !== originalUrl) {
                     newState[styleId].isLoading = false;
                 } else {
                     delete newState[styleId];
                 }
                 return newState;
             });
        };

    } catch (e) {
        console.error("Error generating url", e);
        setGenerationStates(prev => {
            const newState = { ...prev };
            delete newState[styleId];
            return newState;
        });
    }
  }, [settings.apiKey]);

  const resetStyle = useCallback((styleId: string) => {
      setGenerationStates(prev => {
          const newState = { ...prev };
          delete newState[styleId];
          return newState;
      });
  }, []);

  const handleCopyUrl = useCallback((url: string, id: string) => {
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleCopyImage = useCallback(async (url: string, id: string) => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        
        // Convert to PNG via Canvas to bypass Clipboard API restriction on JPEG
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = URL.createObjectURL(blob);
        
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Canvas failure");
        ctx.drawImage(img, 0, 0);
        
        const pngBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(b => b ? resolve(b) : reject("PNG conversion failed"), 'image/png');
        });

        const item = new ClipboardItem({ [pngBlob.type]: pngBlob });
        await navigator.clipboard.write([item]);
        URL.revokeObjectURL(img.src);
        
        setCopiedId(`${id}-img`);
        setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
        console.error("Copy failed", e);
        // Fallback to URL copy
        handleCopyUrl(url, id);
    }
  }, [handleCopyUrl]);

  const handleCopyJson = useCallback(() => {
    // Export the data with the CURRENTLY generated images (if any)
    const exportData = MODEL_STYLES.map(style => {
        const state = generationStates[style.id];
        return {
            id: style.id,
            category: style.category,
            label: style.label,
            image: state?.url || style.image, // Use new URL if generated
            suffix: style.suffix
        };
    });

    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    setCopiedId('ALL');
    setTimeout(() => setCopiedId(null), 2000);
  }, [generationStates]);

  const isCustomKey = settings.apiKey && settings.apiKey.trim().length > 0;

  return (
    <motion.div 
      className="flex flex-col h-full bg-background-dark w-full"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      <div className="w-full max-w-6xl mx-auto flex flex-col h-full">
        <Header 
            leftIcon="arrow_back"
            onLeftClick={() => onNavigate(AppRoute.PREFERENCES)}
            title="Style Studio"
        />

        <div className="p-6 flex-1 overflow-y-auto no-scrollbar">
            
            {/* Control Bar */}
            <div className="mb-8 bg-surface-dark/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-glass flex flex-col md:flex-row items-center justify-between gap-6 sticky top-0 z-20">
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold text-white tracking-tight">Asset Generator</h2>
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-2 py-0.5 rounded-full border ${isCustomKey ? 'bg-purple-500/10 border-purple-500/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
                            <span className={`size-1.5 rounded-full ${isCustomKey ? 'bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.5)]' : 'bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]'}`}></span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isCustomKey ? 'text-purple-400' : 'text-blue-400'}`}>
                                {isCustomKey ? 'Premium API' : 'Shared API'}
                            </span>
                        </div>
                        <span className="text-xs text-white/40 font-medium hidden md:inline-block">
                             {Object.keys(generationStates).length} Custom Assets
                        </span>
                    </div>
                </div>
                
                <button 
                    onClick={handleCopyJson}
                    className="w-full md:w-auto px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium transition-all flex items-center justify-center gap-2 active:scale-95 group"
                >
                    <span className="material-symbols-outlined text-[20px] group-hover:text-primary transition-colors">data_object</span>
                    {copiedId === 'ALL' ? 'Copied to Clipboard!' : 'Export All JSON'}
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-24">
                {MODEL_STYLES.map((style) => (
                    <StyleCard
                        key={style.id}
                        style={style}
                        state={generationStates[style.id]}
                        onGenerate={generateStyle}
                        onReset={resetStyle}
                        onCopyUrl={handleCopyUrl}
                        onCopyImage={handleCopyImage}
                        copiedId={copiedId}
                    />
                ))}
            </div>
        </div>
      </div>
    </motion.div>
  );
};
