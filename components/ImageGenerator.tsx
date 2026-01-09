
import React, { useState, useEffect, useRef, memo, useMemo, useLayoutEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { generateImageUrl, getRandomSeed } from '../services/pollinations';
import { AppRoute, AppSettings, HistoryItem, AVAILABLE_MODELS, MODEL_STYLES, NSFW_STYLES, ASPECT_RATIOS } from '../types';

const swipeVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
    scale: 0.8
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
    scale: 0.8
  })
};

// Comprehensive NSFW list that is silently sent when locked
const LOCKED_NEGATIVE_PROMPT = "nsfw, nude, naked, porn, ugly, deformed, text, watermark, logo, low quality, bad anatomy, bad proportions, blurry, cropped, worst quality, genitals, nipples, topless, explicit, gore, violence";

interface ImageGeneratorProps {
  settings: AppSettings;
  onNavigate: (route: AppRoute) => void;
  onAddToHistory: (item: HistoryItem) => void;
  updateSettings?: (s: Partial<AppSettings>) => void;
  remixItem?: HistoryItem | null;
  onClearRemix?: () => void;
  sessionPrompt: string;
  setSessionPrompt: (prompt: string) => void;
  sessionImages: string[];
  setSessionImages: React.Dispatch<React.SetStateAction<string[]>>;
}

// Optimized Sub-component for individual images with Blur Reveal
const ImageItem = memo(({ src, index, onClick, total, style }: { src: string, index: number, onClick: () => void, total: number, style?: React.CSSProperties }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Check if image is already cached on mount
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setIsLoaded(true);
    }
  }, []);

  return (
    <div 
        onClick={onClick}
        className="relative shrink-0 w-[85%] md:w-auto md:h-[60vh] snap-center overflow-hidden rounded-[2rem] bg-surface-dark border border-white/10 shadow-2xl ring-1 ring-white/5 flex items-center justify-center transition-all duration-500 first:ml-[7.5%] last:mr-[7.5%] md:first:ml-[25%] md:last:mr-[25%] cursor-pointer active:scale-[0.99]"
        style={style} 
    >
        {/* Blur Reveal Effect */}
        <img 
            ref={imgRef}
            src={src} 
            alt={`Generated Content ${index + 1}`} 
            className={`w-full h-full object-cover min-h-[200px] transition-all duration-1000 ease-out ${isLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-xl scale-105'}`}
            onLoad={() => setIsLoaded(true)}
            loading="eager"
            draggable={false}
        />
        
        {/* Placeholder Gradient while loading (behind image) */}
        {!isLoaded && (
             <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 animate-pulse z-0" />
        )}

        <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <div className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <span className="text-xs font-bold text-white/90">#{total - index}</span>
            </div>
        </div>
    </div>
  );
});

// Separated Settings Component
const GeneratorSettings = memo(({ localSettings, updateLocalSetting, setAspectRatio, availableStyles }: { 
    localSettings: AppSettings, 
    updateLocalSetting: (k: keyof AppSettings, v: any) => void,
    setAspectRatio: (w: number, h: number) => void,
    availableStyles: typeof MODEL_STYLES
}) => {
    // If not unlocked, safe mode is FORCED ON and cannot be changed
    const isSafeModeLocked = !localSettings.isUnlocked;

    return (
        <div className="px-3 py-3 flex flex-col gap-4">
            <div className="flex gap-3">
                {/* Image Count */}
                <div className="flex-1">
                    <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mb-1 pl-1">Count</p>
                    <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/5">
                        {[1, 2, 3, 4].map((count) => (
                            <button
                                key={count}
                                onClick={() => updateLocalSetting('imageCount', count)}
                                className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                                    localSettings.imageCount === count 
                                    ? 'bg-surface-highlight text-white shadow-sm ring-1 ring-white/10' 
                                    : 'text-white/40 hover:text-white'
                                }`}
                            >
                                {count}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Adjustments: Enhance, Quality, Upscale */}
            <div>
                 <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mb-1 pl-1">Magic</p>
                 <div className="flex gap-2">
                    {/* Enhance - Prompt Magic */}
                    <button 
                        onClick={() => updateLocalSetting('enhance', !localSettings.enhance)}
                        className={`flex-1 py-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${localSettings.enhance ? 'bg-primary/20 border-primary text-white' : 'bg-white/5 border-white/5 text-white/40'}`}
                    >
                        <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                        <span className="text-[9px] font-bold">Enhance</span>
                    </button>

                    {/* Quality - HD Mode */}
                    <button 
                        onClick={() => updateLocalSetting('quality', localSettings.quality === 'hd' ? 'medium' : 'hd')}
                        className={`flex-1 py-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${localSettings.quality === 'hd' ? 'bg-primary/20 border-primary text-white' : 'bg-white/5 border-white/5 text-white/40'}`}
                    >
                        <span className="material-symbols-outlined text-[18px]">hd</span>
                        <span className="text-[9px] font-bold">Quality</span>
                    </button>

                    {/* Upscale - High Resolution */}
                    <button 
                        onClick={() => updateLocalSetting('upscale', !localSettings.upscale)}
                        className={`flex-1 py-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${localSettings.upscale ? 'bg-primary/20 border-primary text-white' : 'bg-white/5 border-white/5 text-white/40'}`}
                    >
                        <span className="material-symbols-outlined text-[18px]">open_in_full</span>
                        <span className="text-[9px] font-bold">Upscale</span>
                    </button>
                </div>
            </div>

            {/* Aspect Ratio Selector - Static Grid */}
            <div>
                    <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mb-1 pl-1">Ratio</p>
                    <div className="grid grid-cols-5 gap-1.5">
                    {ASPECT_RATIOS.map((ratio) => {
                        const isSelected = localSettings.width === ratio.width && localSettings.height === ratio.height;
                        const w = ratio.width / (Math.max(ratio.width, ratio.height));
                        const h = ratio.height / (Math.max(ratio.width, ratio.height));
                        return (
                            <button
                                key={ratio.label}
                                onClick={() => setAspectRatio(ratio.width, ratio.height)}
                                className={`flex flex-col items-center justify-center gap-1 aspect-square rounded-lg transition-all ${
                                    isSelected 
                                    ? 'bg-surface-highlight text-white shadow-sm ring-1 ring-white/10' 
                                    : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <div className="flex items-center justify-center size-4">
                                    <div 
                                        className={`border-[1.5px] transition-all rounded-[1px] ${isSelected ? 'border-white bg-white/20' : 'border-white/40'}`}
                                        style={{ 
                                            width: `${w * 12}px`, 
                                            height: `${h * 12}px`
                                        }}
                                    />
                                </div>
                                <span className="text-[8px] font-bold">{ratio.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* SECRET SPICE Styles (Only if Unlocked) */}
            {!isSafeModeLocked && (
                 <div>
                    <p className="text-[9px] text-purple-400 font-bold uppercase tracking-widest mb-1 pl-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">local_fire_department</span>
                        Spice
                    </p>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                         {NSFW_STYLES.map((style) => (
                            <button 
                                key={style.id}
                                onClick={() => {
                                    // Toggle logic
                                    const newStyle = localSettings.activeStyle === style.id ? '' : style.id;
                                    updateLocalSetting('activeStyle', newStyle);
                                }}
                                className={`relative shrink-0 w-16 h-20 rounded-lg overflow-hidden border transition-all ${localSettings.activeStyle === style.id ? 'border-purple-500 ring-2 ring-purple-500/50' : 'border-white/10 opacity-60 hover:opacity-100'}`}
                            >
                                <img src={style.image} alt={style.label} className="w-full h-full object-cover" loading="lazy" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                                <div className="absolute bottom-0 left-0 right-0 p-1">
                                    <span className={`text-[8px] font-bold block text-center truncate ${localSettings.activeStyle === style.id ? 'text-purple-400' : 'text-white'}`}>{style.label}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Standard Visual Style Selector */}
            {availableStyles.length > 0 && (
                <div>
                    <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mb-1 pl-1">Style</p>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            <button 
                            onClick={() => updateLocalSetting('activeStyle', '')}
                            className={`relative shrink-0 w-16 h-20 rounded-lg overflow-hidden border transition-all ${localSettings.activeStyle === '' ? 'border-primary ring-2 ring-primary/50' : 'border-white/10 opacity-50 hover:opacity-100'}`}
                        >
                            <div className="absolute inset-0 bg-white/5 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white/40 text-[20px]">block</span>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/80 to-transparent">
                                <span className={`text-[8px] font-bold block text-center ${localSettings.activeStyle === '' ? 'text-primary' : 'text-white/60'}`}>None</span>
                            </div>
                        </button>

                        {availableStyles.map((style) => (
                            <button 
                                key={style.id}
                                onClick={() => updateLocalSetting('activeStyle', style.id)}
                                className={`relative shrink-0 w-16 h-20 rounded-lg overflow-hidden border transition-all ${localSettings.activeStyle === style.id ? 'border-primary ring-2 ring-primary/50' : 'border-white/10 opacity-50 hover:opacity-100'}`}
                            >
                                <img src={style.image} alt={style.label} className="w-full h-full object-cover" loading="lazy" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                                <div className="absolute bottom-0 left-0 right-0 p-1">
                                    <span className={`text-[8px] font-bold block text-center truncate text-white`}>{style.label}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Models Config */}
            <div>
                    <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mb-1 pl-1">Configuration</p>
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                            {AVAILABLE_MODELS.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => {
                                        updateLocalSetting('model', m.id);
                                        updateLocalSetting('activeStyle', '');
                                    }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all shrink-0 ${localSettings.model === m.id ? 'bg-primary/20 border-primary text-white' : 'bg-white/5 border-transparent text-white/60 hover:bg-white/10'}`}
                                >
                                    <span className="text-[10px] font-medium">{m.name}</span>
                                </button>
                            ))}
                        </div>
                        
                        {/* Safe Mode Toggle (Locked logic) */}
                        <div 
                            onClick={() => {
                                if (!isSafeModeLocked) {
                                    updateLocalSetting('safe', !localSettings.safe);
                                }
                            }}
                            className={`flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 transition-colors ${!isSafeModeLocked ? 'cursor-pointer active:bg-white/10' : 'cursor-not-allowed opacity-70'}`}
                        >
                            <div className="flex flex-col">
                                <span className="text-[10px] font-medium text-white">Safe Mode Filter</span>
                                {isSafeModeLocked && <span className="text-[8px] text-white/40">Locked by default</span>}
                            </div>
                            <div className={`w-6 h-3 rounded-full relative transition-colors ${localSettings.safe || isSafeModeLocked ? 'bg-primary' : 'bg-white/10'}`}>
                                <div className={`absolute top-0.5 left-0.5 size-2 bg-white rounded-full transition-transform ${localSettings.safe || isSafeModeLocked ? 'translate-x-3' : 'translate-x-0'}`} />
                            </div>
                        </div>

                        {/* Negative Prompt - Silent Injection if locked */}
                        <div className="space-y-1 pt-1">
                             <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest pl-1">Negative Prompt</span>
                             <input 
                                type="text"
                                value={isSafeModeLocked ? "Safe Mode Active" : localSettings.negativePrompt}
                                onChange={(e) => updateLocalSetting('negativePrompt', e.target.value)}
                                disabled={isSafeModeLocked}
                                placeholder="What to avoid..."
                                className={`w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-white/20 ${isSafeModeLocked ? 'text-white/40 cursor-not-allowed italic' : ''}`}
                             />
                        </div>
                    </div>
            </div>
        </div>
    );
});

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ 
    settings: globalSettings, 
    onNavigate, 
    onAddToHistory, 
    updateSettings,
    remixItem,
    onClearRemix,
    sessionPrompt,
    setSessionPrompt,
    sessionImages,
    setSessionImages
}) => {
  const prompt = sessionPrompt;
  const setPrompt = setSessionPrompt;
  const currentImages = sessionImages;
  const setCurrentImages = setSessionImages;

  const [isLoading, setIsLoading] = useState(false);
  const [localSettings, setLocalSettings] = useState(globalSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState(0);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync global settings
  useEffect(() => {
    setLocalSettings(globalSettings);
  }, [globalSettings]);

  // Handle Remix
  useEffect(() => {
    if (remixItem) {
        setPrompt(remixItem.prompt);
        updateLocalSetting('activeStyle', ''); 
        if (updateSettings) {
            updateSettings({
                model: remixItem.model,
                width: remixItem.width,
                height: remixItem.height,
                enhance: remixItem.enhance,
                negativePrompt: remixItem.negativePrompt || '',
                activeStyle: '',
                safe: remixItem.safe ?? true,
                transparent: remixItem.transparent ?? false,
                privateMode: true,
                quality: remixItem.quality || 'medium',
                upscale: remixItem.upscale || false,
                guidance: remixItem.guidance || 7.5
            });
        }
        if (onClearRemix) onClearRemix();
    }
  }, [remixItem]);

  // Correct text area resizing using LayoutEffect to prevent visual jumps
  useLayoutEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; // Reset
        if (isPromptExpanded) {
             textareaRef.current.style.height = '16rem'; 
        } else {
             // Calculate accurate height based on scrollHeight
             const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
             // Ensure it's at least a minimum height (e.g. 50px for single line)
             textareaRef.current.style.height = `${Math.max(newHeight, 48)}px`;
        }
    }
  }, [prompt, isPromptExpanded]);

  const showToast = (message: string) => {
      setToastMessage(message);
      setTimeout(() => setToastMessage(null), 2000);
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsPromptExpanded(false); 
    setIsLoading(true);
    
    // Slight delay to allow UI to update close state
    setTimeout(() => {
        const count = localSettings.imageCount || 1;
        const newImages: string[] = [];
        const batchId = crypto.randomUUID(); 

        // Unified Style Lookup (Standard + NSFW)
        const allStyles = [...MODEL_STYLES, ...NSFW_STYLES];
        const activeStyle = allStyles.find(s => s.id === localSettings.activeStyle);
        
        // Logic: Standard styles require strict model match. NSFW styles (model='any') are universal.
        let promptWithStyle = prompt;
        if (activeStyle) {
             const isCompatible = activeStyle.model === 'any' || activeStyle.model === localSettings.model;
             if (isCompatible) {
                 promptWithStyle = `${prompt}${activeStyle.suffix}`;
             }
        }
        
        const multiplier = localSettings.upscale ? 2 : 1;
        const genWidth = localSettings.width * multiplier;
        const genHeight = localSettings.height * multiplier;

        const effectiveSafe = !localSettings.isUnlocked ? true : localSettings.safe;
        
        const effectiveNegative = !localSettings.isUnlocked 
            ? LOCKED_NEGATIVE_PROMPT 
            : localSettings.negativePrompt;

        for (let i = 0; i < count; i++) {
            const newSeed = getRandomSeed() + i; 
            
            const params = {
                prompt: promptWithStyle,
                model: localSettings.model,
                width: genWidth,
                height: genHeight,
                seed: newSeed,
                enhance: localSettings.enhance, 
                nologo: true,
                negativePrompt: effectiveNegative, 
                apiKey: localSettings.apiKey,
                safe: effectiveSafe,
                private: true,
                transparent: localSettings.transparent,
                quality: localSettings.quality || 'medium',
                upscale: localSettings.upscale,
                guidance: localSettings.guidance || 7.5
            };

            const url = generateImageUrl(params);
            newImages.push(url);
            
            onAddToHistory({
                ...params,
                id: Date.now().toString() + i,
                batchId, 
                timestamp: Date.now(),
                url
            });
        }

        // Add images immediately to show the "blur reveal" animation
        setCurrentImages(prev => [...newImages, ...prev]);
        setIsLoading(false); 
    }, 100); 
  };

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const filename = `resonance-${Date.now()}.jpg`; 
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      showToast("Saved to Photos");
    } catch (error) {
      window.open(url, '_blank');
      showToast("Download Started");
    }
  };

  const handleCopyLink = () => {
      if (fullscreenIndex !== null && currentImages[fullscreenIndex]) {
          navigator.clipboard.writeText(currentImages[fullscreenIndex]);
          showToast("Link Copied");
      }
  };

  const handleCopyImage = async () => {
    if (fullscreenIndex !== null && currentImages[fullscreenIndex]) {
        try {
            const response = await fetch(currentImages[fullscreenIndex]);
            const blob = await response.blob();
            const item = new ClipboardItem({ [blob.type]: blob });
            await navigator.clipboard.write([item]);
            showToast("Image Copied");
        } catch (err) {
            navigator.clipboard.writeText(currentImages[fullscreenIndex]);
            showToast("Link Copied (Image Copy Failed)");
        }
    }
  };

  const updateLocalSetting = useCallback((key: keyof AppSettings, value: any) => {
      setLocalSettings(prev => ({ ...prev, [key]: value }));
      if (updateSettings) updateSettings({ [key]: value });
  }, [updateSettings]);

  const setAspectRatio = useCallback((width: number, height: number) => {
      setLocalSettings(prev => ({ ...prev, width, height }));
      if (updateSettings) updateSettings({ width, height });
  }, [updateSettings]);

  const handleFullscreenDragEnd = (e: any, { offset, velocity }: PanInfo) => {
    const swipeThreshold = 50;
    const velocityThreshold = 400;

    if (offset.y > 100 || (velocity.y > 500 && offset.y > 20)) {
        setFullscreenIndex(null);
        return;
    }
    
    if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > velocityThreshold) {
        if (Math.abs(offset.x) > Math.abs(offset.y)) {
            if (offset.x < 0) {
                 if (fullscreenIndex !== null && fullscreenIndex < currentImages.length - 1) {
                    setSlideDirection(1);
                    setFullscreenIndex(fullscreenIndex + 1);
                    setShowInfoPanel(false);
                }
            } else {
                 if (fullscreenIndex !== null && fullscreenIndex > 0) {
                    setSlideDirection(-1);
                    setFullscreenIndex(fullscreenIndex - 1);
                    setShowInfoPanel(false);
                }
            }
        }
    }
  };

  const availableStyles = useMemo(() => 
    MODEL_STYLES.filter(s => s.model === localSettings.model),
  [localSettings.model]);
  
  const getInfoFromUrl = (url: string) => {
      try {
          const urlObj = new URL(url);
          const params = new URLSearchParams(urlObj.search);
          return {
              seed: params.get('seed') || 'Random',
              model: params.get('model') || 'Unknown',
              width: params.get('width'),
              height: params.get('height')
          };
      } catch (e) {
          return { seed: '?', model: '?', width: '?', height: '?' };
      }
  };

  // Memoize style object for ImageItem to prevent lag when changing non-visual settings
  const imageStyle = useMemo(() => ({ 
      aspectRatio: localSettings.width / localSettings.height 
  }), [localSettings.width, localSettings.height]);

  const showResults = currentImages.length > 0 || isLoading;

  const stopProp = (e: React.UIEvent) => {
      e.stopPropagation();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full relative"
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[150] px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center gap-2"
            >
                <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
                <span className="text-sm font-bold text-white tracking-wide">{toastMessage}</span>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="absolute top-6 left-0 right-0 z-50 flex justify-between px-6 pointer-events-none max-w-7xl mx-auto w-full">
          <button 
            onClick={() => onNavigate(AppRoute.PREFERENCES)}
            className="pointer-events-auto flex size-10 items-center justify-center rounded-full glass-panel text-white hover:bg-white/10 transition-colors relative shadow-lg active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
          
          <div className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-xl bg-black/20">
            <span className="text-xs font-bold tracking-widest uppercase text-white/90">Resonance</span>
          </div>

          <button 
            onClick={() => onNavigate(AppRoute.HISTORY)}
            className="pointer-events-auto flex size-10 items-center justify-center rounded-full glass-panel text-white hover:bg-white/10 transition-colors relative shadow-lg active:scale-95"
          >
            <span className="material-symbols-outlined">history</span>
            <span className="absolute top-2 right-2 size-2 bg-primary rounded-full shadow-[0_0_8px_rgba(43,108,238,0.8)]"></span>
          </button>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative w-full h-full">
        <div className="min-h-full flex flex-col items-center justify-center pt-20 pb-10 w-full max-w-7xl mx-auto px-4 gap-6">
            
            {/* Main Image Display Area */}
            <div className={`w-full relative group z-0 flex items-center justify-center ${showResults ? 'min-h-[300px]' : 'flex-1'}`}>
            
            <div className={`absolute -inset-1 bg-gradient-to-b from-primary/40 to-purple-600/40 rounded-[2.5rem] blur-2xl transition-all duration-1000 will-change-transform ${showResults ? 'opacity-50' : 'opacity-20'}`}></div>
            
            <AnimatePresence mode="wait">
                {(!showResults) && (
                <motion.div 
                    key="orb-container"
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                    className={`flex flex-col items-center justify-center text-center py-20 pointer-events-none will-change-transform`}
                >
                    <div className="relative">
                        <motion.div
                            className="relative size-24 rounded-[2rem] bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shadow-glass backdrop-blur-md z-10 will-change-transform"
                        >
                            <span className={`material-symbols-outlined text-5xl text-white/90 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all duration-500`}>
                                auto_awesome
                            </span>
                        </motion.div>
                    </div>
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 space-y-2 relative z-10"
                    >
                        <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-lg">
                            Ready to Dream
                        </h2>
                        <p className="text-sm text-white/50 max-w-[220px] mx-auto leading-relaxed font-medium">
                            Ignite your imagination. Describe a scene below.
                        </p>
                    </motion.div>
                </motion.div>
                )}
                </AnimatePresence>

            {/* Result Container */}
            {showResults && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full relative z-10"
                >
                    <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory w-full pb-4 no-scrollbar items-center">
                        {/* We removed the dedicated 'DREAMING...' card here to show images immediately */}
                        
                        {currentImages.map((imgUrl, idx) => (
                            <ImageItem 
                                key={imgUrl} 
                                src={imgUrl}
                                index={idx}
                                total={currentImages.length}
                                onClick={() => { setFullscreenIndex(idx); setShowInfoPanel(false); }}
                                style={imageStyle}
                            />
                        ))}
                    </div>
                </motion.div>
            )}
            </div>

            {/* Prompt Bar and Controls - Now in document flow */}
            <div className="w-full flex flex-col items-center gap-2 z-40">
                {/* Style Chips (Visible when settings are closed) */}
                {availableStyles.length > 0 && !showSettings && !isPromptExpanded && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full md:max-w-2xl mx-auto overflow-x-auto no-scrollbar pb-1"
                    >
                        <div className="flex gap-2 px-1 min-w-max mx-auto">
                            {availableStyles.map((style) => (
                            <button 
                                key={style.id}
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    const newStyle = localSettings.activeStyle === style.id ? '' : style.id;
                                    updateLocalSetting('activeStyle', newStyle);
                                }}
                                className={`group flex items-center justify-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border transition-all active:scale-95 shadow-sm ${localSettings.activeStyle === style.id ? 'bg-primary/90 border-primary text-white shadow-glow' : 'bg-black/40 border-white/10 text-white/70 hover:bg-black/60 hover:text-white'}`}
                            >
                                <span className="text-xs font-bold tracking-wide">{style.label}</span>
                            </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                <div className={`mx-auto w-full md:max-w-2xl bg-[#192233]/90 backdrop-blur-md rounded-[2rem] shadow-liquid border border-white/10 ring-1 ring-white/5 transition-all duration-300 overflow-hidden relative z-50 ${isPromptExpanded ? 'max-w-full rounded-[2rem] h-[50vh] md:h-auto' : 'max-w-md'}`}>
                    {/* Prompt Input Section */}
                    <div className="relative w-full flex flex-col gap-2 p-2">
                        <div className="flex items-start gap-3 w-full px-2">
                        <span className="material-symbols-outlined text-primary mt-3 select-none text-[24px]">edit_note</span>
                        <textarea 
                            ref={textareaRef}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onClick={() => setShowSettings(false)}
                            onKeyDown={stopProp} 
                            onTouchStart={stopProp}
                            className="w-full bg-transparent border-none text-white text-base placeholder:text-white/30 focus:ring-0 resize-none p-2 leading-relaxed font-medium transition-all select-text cursor-text" 
                            placeholder="Describe your dream..." 
                            rows={1}
                            style={{ minHeight: '3rem' }}
                        />
                        <button 
                            onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                            className={`mt-2 p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors ${isPromptExpanded ? 'text-primary' : ''}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {isPromptExpanded ? 'close_fullscreen' : 'open_in_full'}
                            </span>
                        </button>
                        </div>
                        
                        <div className="flex items-center justify-between gap-3 px-2 pb-1">
                        <div 
                            onClick={() => setShowSettings(!showSettings)}
                            className="flex-1 flex items-center gap-2 overflow-hidden cursor-pointer group"
                        >
                            <div className={`size-8 rounded-full flex items-center justify-center border transition-colors ${showSettings ? 'bg-primary text-white border-primary' : 'bg-white/5 border-white/10 text-white/60 group-hover:bg-white/10 group-hover:text-white'}`}>
                                    <span className="material-symbols-outlined text-[18px] transition-transform duration-300" style={{ transform: showSettings ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                        {showSettings ? 'keyboard_arrow_down' : 'tune'}
                                    </span>
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Settings</span>
                                <span className="text-xs text-white truncate font-medium">
                                    {localSettings.width === localSettings.height ? 'Square' : 'Custom'} • {AVAILABLE_MODELS.find(m => m.id === localSettings.model)?.name.split(' ')[0]}
                                </span>
                            </div>
                        </div>

                        <button 
                            onClick={handleGenerate}
                            disabled={!prompt}
                            className="relative overflow-hidden h-12 px-6 rounded-full bg-gradient-to-r from-primary to-blue-600 flex items-center gap-2 shadow-glow hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                        >
                            <span className="text-sm font-bold text-white tracking-wide">{isLoading ? 'QUEUED' : 'GENERATE'}</span>
                            {isLoading && (
                                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            )}
                            {localSettings.imageCount > 1 && !isLoading && (
                                <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{localSettings.imageCount}</span>
                            )}
                        </button>
                        </div>
                    </div>

                    {/* Expandable Settings Section - Expands Downwards inside the scroll view */}
                    <AnimatePresence>
                        {showSettings && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="border-t border-white/5 bg-black/20 overflow-hidden"
                            >
                                {/* Optimized Settings Component */}
                                <GeneratorSettings 
                                    localSettings={localSettings}
                                    updateLocalSetting={updateLocalSetting}
                                    setAspectRatio={setAspectRatio}
                                    availableStyles={availableStyles}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
      </div>

      {/* Fullscreen Overlay with Info Panel */}
      <AnimatePresence>
        {fullscreenIndex !== null && currentImages[fullscreenIndex] && (
             <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black flex flex-col"
                onClick={() => setFullscreenIndex(null)}
            >
                {/* Top Overlay UI */}
                <div className="absolute top-0 left-0 right-0 p-6 pt-10 flex justify-between items-start z-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                     <div className="flex flex-col pointer-events-auto max-w-[80%]">
                         <div className="flex items-center gap-2">
                            <span className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-white/80 border border-white/10">
                                {fullscreenIndex + 1} / {currentImages.length}
                            </span>
                         </div>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setFullscreenIndex(null); }}
                        className="size-10 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-md pointer-events-auto hover:bg-white/20"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Main Swipe Area */}
                <div className="flex-1 flex items-center justify-center relative w-full h-full overflow-hidden">
                    <AnimatePresence initial={false} custom={slideDirection}>
                        <motion.div
                            key={fullscreenIndex}
                            custom={slideDirection}
                            variants={swipeVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 }
                            }}
                            className="absolute inset-0 flex items-center justify-center touch-none"
                            onClick={(e) => e.stopPropagation()} 
                            drag
                            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                            dragElastic={{ top: 0.5, bottom: 0.5, left: 1, right: 1 }}
                            onDragEnd={handleFullscreenDragEnd}
                        >
                            <img 
                                src={currentImages[fullscreenIndex]}
                                className="max-w-full max-h-full object-contain shadow-2xl"
                                alt="Fullscreen"
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Bottom Actions */}
                <div 
                    className="absolute bottom-0 left-0 right-0 p-6 pb-12 flex justify-center gap-6 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent" 
                    onClick={(e) => e.stopPropagation()}
                >
                     <button 
                        onClick={() => handleDownload(currentImages[fullscreenIndex])}
                        className="flex flex-col items-center gap-1 min-w-[60px] text-white/80 hover:text-white transition-colors"
                    >
                        <div className="size-12 rounded-full bg-white/10 flex items-center justify-center mb-1 backdrop-blur-md border border-white/5 active:bg-white/20">
                             <span className="material-symbols-outlined text-[20px]">download</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wide font-bold">Save</span>
                    </button>
                    
                    <button 
                        onClick={handleCopyLink}
                        className="flex flex-col items-center gap-1 min-w-[60px] text-white/80 hover:text-white transition-colors"
                    >
                        <div className="size-12 rounded-full bg-white/10 flex items-center justify-center mb-1 backdrop-blur-md border border-white/5 active:bg-white/20">
                             <span className="material-symbols-outlined text-[20px]">link</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wide font-bold">Link</span>
                    </button>

                    <button 
                        onClick={handleCopyImage}
                        className="flex flex-col items-center gap-1 min-w-[60px] text-white/80 hover:text-white transition-colors"
                    >
                        <div className="size-12 rounded-full bg-white/10 flex items-center justify-center mb-1 backdrop-blur-md border border-white/5 active:bg-white/20">
                             <span className="material-symbols-outlined text-[20px]">image</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wide font-bold">Copy</span>
                    </button>

                    <button 
                        onClick={() => {
                           setShowInfoPanel(!showInfoPanel);
                        }}
                        className={`flex flex-col items-center gap-1 min-w-[60px] transition-colors ${showInfoPanel ? 'text-primary' : 'text-white/80 hover:text-white'}`}
                    >
                        <div className={`size-12 rounded-full flex items-center justify-center mb-1 backdrop-blur-md transition-colors ${showInfoPanel ? 'bg-primary/20 border border-primary/30' : 'bg-white/10 border border-white/5'}`}>
                             <span className="material-symbols-outlined text-[20px]">info</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wide font-bold">Info</span>
                    </button>
                </div>

                {/* Info Panel Overlay */}
                <AnimatePresence>
                    {showInfoPanel && (
                        <motion.div 
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            className="absolute bottom-0 left-0 right-0 bg-[#192233] border-t border-white/10 rounded-t-[2rem] p-6 pb-12 z-30 shadow-2xl max-h-[70vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-1 bg-white/20 rounded-full" />
                                <button 
                                    onClick={() => setShowInfoPanel(false)}
                                    className="size-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            </div>
                            
                            <div className="space-y-6 overflow-y-auto">
                                <div>
                                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Prompt</h4>
                                    <div className="text-sm text-white leading-relaxed font-medium bg-black/20 p-3 rounded-xl border border-white/5 select-text">
                                        {decodeURIComponent(currentImages[fullscreenIndex].split('/prompt/')[1]?.split('?')[0] || prompt)}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Direct Link</h4>
                                    <div className="flex items-center gap-2 bg-black/20 p-2 rounded-xl border border-white/5">
                                        <span className="text-xs text-white/60 truncate flex-1 font-mono">
                                            {currentImages[fullscreenIndex]}
                                        </span>
                                        <button 
                                            onClick={handleCopyLink}
                                            className="size-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                     {(() => {
                                         const info = getInfoFromUrl(currentImages[fullscreenIndex]);
                                         return (
                                            <>
                                                <div>
                                                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Seed</h4>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-white font-mono">{info.seed}</span>
                                                        <button onClick={() => { navigator.clipboard.writeText(info.seed as string); showToast("Seed Copied"); }} className="text-white/30 hover:text-white">
                                                            <span className="material-symbols-outlined text-[14px]">content_copy</span>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Model</h4>
                                                    <span className="px-2 py-0.5 rounded bg-white/10 text-xs font-bold text-white uppercase">{info.model}</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Size</h4>
                                                    <span className="text-sm text-white">{info.width} x {info.height}</span>
                                                </div>
                                            </>
                                         )
                                     })()}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
