
import React, { useState, useEffect, useRef, memo, useMemo, useLayoutEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { generateImageUrl, getRandomSeed, getAccountDetails, getEstimatedImagesLeft } from '../services/pollinations';
import { AppRoute, AppSettings, HistoryItem, AVAILABLE_MODELS, MODEL_STYLES, NSFW_STYLES, ASPECT_RATIOS, AccountState } from '../types';

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
  sessionImages: HistoryItem[];
  setSessionImages: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
}

// Optimized Sub-component for individual images with Blur Reveal
const ImageItem = memo(({ item, index, onClick, total, style, isGrid }: { item: HistoryItem, index: number, onClick: () => void, total: number, style?: React.CSSProperties, isGrid?: boolean }) => {
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
        className={`relative shrink-0 overflow-hidden bg-surface-dark border border-white/10 shadow-2xl ring-1 ring-white/5 flex items-center justify-center transition-all duration-500 cursor-pointer active:scale-[0.99] ${isGrid ? 'w-full mb-3 rounded-xl' : 'w-[85%] snap-center md:w-auto md:h-[60vh] first:ml-[7.5%] last:mr-[7.5%] md:first:ml-[25%] md:last:mr-[25%] rounded-[2rem]'}`}
        style={style} 
    >
        {/* Blur Reveal Effect */}
        <img 
            ref={imgRef}
            src={item.url} 
            alt={`Generated Content ${index + 1}`} 
            className={`w-full h-full object-cover min-h-[150px] transition-all duration-1000 ease-out ${isLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-xl scale-105'}`}
            onLoad={() => setIsLoaded(true)}
            loading="eager"
            draggable={false}
        />
        
        {/* Placeholder Gradient while loading (behind image) */}
        {!isLoaded && (
             <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 animate-pulse z-0" />
        )}

        {/* Style Badge Overlay */}
        {isLoaded && item.styleLabel && (
             <div className="absolute bottom-2 left-2 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                 <div className="glass-panel px-2 py-1 rounded-md flex items-center gap-1">
                     <span className="text-[9px] font-bold text-white/90">{item.styleLabel}</span>
                 </div>
             </div>
        )}
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
        <div className="px-5 py-4 flex flex-col gap-6">
            <div className="flex gap-3">
                {/* Image Count - Disable if Infinite Mode is on */}
                <div className={`flex-1 ${localSettings.infiniteMode ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
                    <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mb-2 pl-1">Count</p>
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                        {[1, 2, 3, 4].map((count) => (
                            <button
                                key={count}
                                onClick={() => updateLocalSetting('imageCount', count)}
                                className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${
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
                 <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mb-2 pl-1">Magic</p>
                 <div className="flex gap-2">
                    {/* Enhance - Prompt Magic */}
                    <button 
                        onClick={() => updateLocalSetting('enhance', !localSettings.enhance)}
                        className={`flex-1 py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${localSettings.enhance ? 'bg-primary/20 border-primary text-white' : 'bg-white/5 border-white/5 text-white/40'}`}
                    >
                        <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                        <span className="text-[10px] font-bold">Enhance</span>
                    </button>

                    {/* Quality - HD Mode */}
                    <button 
                        onClick={() => updateLocalSetting('quality', localSettings.quality === 'hd' ? 'medium' : 'hd')}
                        className={`flex-1 py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${localSettings.quality === 'hd' ? 'bg-primary/20 border-primary text-white' : 'bg-white/5 border-white/5 text-white/40'}`}
                    >
                        <span className="material-symbols-outlined text-[20px]">hd</span>
                        <span className="text-[10px] font-bold">Quality</span>
                    </button>

                    {/* Upscale - High Resolution */}
                    <button 
                        onClick={() => updateLocalSetting('upscale', !localSettings.upscale)}
                        className={`flex-1 py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${localSettings.upscale ? 'bg-primary/20 border-primary text-white' : 'bg-white/5 border-white/5 text-white/40'}`}
                    >
                        <span className="material-symbols-outlined text-[20px]">open_in_full</span>
                        <span className="text-[10px] font-bold">Upscale</span>
                    </button>
                </div>
            </div>

            {/* Aspect Ratio Selector - Static Grid */}
            <div>
                    <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mb-2 pl-1">Ratio</p>
                    <div className="grid grid-cols-5 gap-2">
                    {ASPECT_RATIOS.map((ratio) => {
                        const isSelected = localSettings.width === ratio.width && localSettings.height === ratio.height;
                        const w = ratio.width / (Math.max(ratio.width, ratio.height));
                        const h = ratio.height / (Math.max(ratio.width, ratio.height));
                        return (
                            <button
                                key={ratio.label}
                                onClick={() => setAspectRatio(ratio.width, ratio.height)}
                                className={`flex flex-col items-center justify-center gap-1.5 aspect-square rounded-xl transition-all ${
                                    isSelected 
                                    ? 'bg-surface-highlight text-white shadow-sm ring-1 ring-white/10' 
                                    : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <div className="flex items-center justify-center size-5">
                                    <div 
                                        className={`border-[1.5px] transition-all rounded-[1px] ${isSelected ? 'border-white bg-white/20' : 'border-white/40'}`}
                                        style={{ 
                                            width: `${w * 16}px`, 
                                            height: `${h * 16}px`
                                        }}
                                    />
                                </div>
                                <span className="text-[9px] font-bold">{ratio.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* SECRET SPICE Styles (Only if Unlocked) */}
            {!isSafeModeLocked && (
                 <div>
                    <p className="text-[9px] text-purple-400 font-bold uppercase tracking-widest mb-2 pl-1 flex items-center gap-1">
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
                                className={`relative shrink-0 w-20 h-24 rounded-xl overflow-hidden border transition-all ${localSettings.activeStyle === style.id ? 'border-purple-500 ring-2 ring-purple-500/50' : 'border-white/10 opacity-60 hover:opacity-100'}`}
                            >
                                <img src={style.image} alt={style.label} className="w-full h-full object-cover" loading="lazy" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                                <div className="absolute bottom-0 left-0 right-0 p-1.5">
                                    <span className={`text-[9px] font-bold block text-center truncate ${localSettings.activeStyle === style.id ? 'text-purple-400' : 'text-white'}`}>{style.label}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Standard Visual Style Selector - NOW AVAILABLE IN INFINITE MODE SETTINGS TOO */}
            {availableStyles.length > 0 && (
                <div>
                    <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mb-2 pl-1">Style</p>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            <button 
                            onClick={() => updateLocalSetting('activeStyle', '')}
                            className={`relative shrink-0 w-20 h-24 rounded-xl overflow-hidden border transition-all ${localSettings.activeStyle === '' ? 'border-primary ring-2 ring-primary/50' : 'border-white/10 opacity-50 hover:opacity-100'}`}
                        >
                            <div className="absolute inset-0 bg-white/5 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white/40 text-[24px]">block</span>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                                <span className={`text-[9px] font-bold block text-center ${localSettings.activeStyle === '' ? 'text-primary' : 'text-white/60'}`}>None</span>
                            </div>
                        </button>

                        {availableStyles.map((style) => (
                            <button 
                                key={style.id}
                                onClick={() => updateLocalSetting('activeStyle', style.id)}
                                className={`relative shrink-0 w-20 h-24 rounded-xl overflow-hidden border transition-all ${localSettings.activeStyle === style.id ? 'border-primary ring-2 ring-primary/50' : 'border-white/10 opacity-50 hover:opacity-100'}`}
                            >
                                <img src={style.image} alt={style.label} className="w-full h-full object-cover" loading="lazy" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                                <div className="absolute bottom-0 left-0 right-0 p-1.5">
                                    <span className={`text-[9px] font-bold block text-center truncate text-white`}>{style.label}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Models Config */}
            <div>
                    <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mb-2 pl-1">Configuration</p>
                    <div className="flex flex-col gap-3">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                            {AVAILABLE_MODELS.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => {
                                        updateLocalSetting('model', m.id);
                                        updateLocalSetting('activeStyle', '');
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all shrink-0 ${localSettings.model === m.id ? 'bg-primary/20 border-primary text-white' : 'bg-white/5 border-transparent text-white/60 hover:bg-white/10'}`}
                                >
                                    <span className="text-[11px] font-medium">{m.name}</span>
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
                            className={`flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 transition-colors ${!isSafeModeLocked ? 'cursor-pointer active:bg-white/10' : 'cursor-not-allowed opacity-70'}`}
                        >
                            <div className="flex flex-col">
                                <span className="text-[11px] font-medium text-white">Safe Mode Filter</span>
                                {isSafeModeLocked && <span className="text-[9px] text-white/40">Locked by default</span>}
                            </div>
                            <div className={`w-8 h-4 rounded-full relative transition-colors ${localSettings.safe || isSafeModeLocked ? 'bg-primary' : 'bg-white/10'}`}>
                                <div className={`absolute top-0.5 left-0.5 size-3 bg-white rounded-full transition-transform ${localSettings.safe || isSafeModeLocked ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                        </div>

                        {/* Infinite Feed Toggle - Moved from Preferences */}
                         <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[18px]">vertical_split</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-medium text-white">Infinite Feed</span>
                                </div>
                            </div>
                            <div 
                                onClick={() => updateLocalSetting('infiniteMode', !localSettings.infiniteMode)}
                                className={`w-8 h-4 rounded-full relative transition-colors cursor-pointer ${localSettings.infiniteMode ? 'bg-purple-500' : 'bg-white/10'}`}
                            >
                                <div className={`absolute top-0.5 left-0.5 size-3 bg-white rounded-full transition-transform ${localSettings.infiniteMode ? 'translate-x-4' : 'translate-x-0'}`} />
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
                                className={`w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-white/20 ${isSafeModeLocked ? 'text-white/40 cursor-not-allowed italic' : ''}`}
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
  const [isLoadingMore, setIsLoadingMore] = useState(false); // For infinite scroll
  const [localSettings, setLocalSettings] = useState(globalSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState(0);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Abort Controller for "Stop" functionality
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Ref for infinite scroll trigger
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Account state for balance and image estimation
  const [accountState, setAccountState] = useState<AccountState>({
      profile: null,
      balance: null,
      isLoading: false,
      error: null
  });

  const fetchAccount = useCallback(async () => {
      const data = await getAccountDetails(globalSettings.apiKey);
      setAccountState(data);
  }, [globalSettings.apiKey]);

  // Fetch account details on mount and whenever apiKey changes
  useEffect(() => {
      fetchAccount();
      // Optional: Polling every 30s to keep balance fresh
      const interval = setInterval(fetchAccount, 30000);
      return () => clearInterval(interval);
  }, [fetchAccount]);

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
             textareaRef.current.style.height = `${Math.max(newHeight, 24)}px`;
        }
    }
  }, [prompt, isPromptExpanded]);

  const showToast = (message: string) => {
      setToastMessage(message);
      setTimeout(() => setToastMessage(null), 2000);
  };

  const generateImagesBatch = async (count: number, isAppending: boolean = false): Promise<HistoryItem[]> => {
        const newItems: HistoryItem[] = [];
        const batchId = crypto.randomUUID(); 

        // Unified Style Lookup (Standard + NSFW)
        const allStyles = [...MODEL_STYLES, ...NSFW_STYLES];
        const activeStyle = allStyles.find(s => s.id === localSettings.activeStyle);
        
        // Logic: Standard styles require strict model match. NSFW styles (model='any') are universal.
        let promptWithStyle = prompt;
        let suffix = "";
        
        if (activeStyle) {
             const isCompatible = activeStyle.model === 'any' || activeStyle.model === localSettings.model;
             if (isCompatible) {
                 suffix = activeStyle.suffix;
                 promptWithStyle = `${prompt}${suffix}`;
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
            // Check abort signal inside loop
            if (abortControllerRef.current?.signal.aborted) break;

            // Added delay to allow "Stop" button to function and preventing instant-loop race conditions
            await new Promise(resolve => setTimeout(resolve, 400));
            if (abortControllerRef.current?.signal.aborted) break;

            const newSeed = getRandomSeed() + i + (isAppending ? currentImages.length : 0); 
            
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
                guidance: localSettings.guidance || 7.5,
                styleId: activeStyle?.id,
                styleLabel: activeStyle?.label,
                styleSuffix: suffix
            };

            const url = generateImageUrl(params);
            
            const item: HistoryItem = {
                ...params,
                id: Date.now().toString() + i + (isAppending ? currentImages.length : 0),
                batchId, 
                timestamp: Date.now(),
                url,
                prompt: prompt // Store original user prompt separately from modified prompt if needed, but for now promptWithStyle is the source of truth for generation
            };
            
            newItems.push(item);
            onAddToHistory(item);

            // In Infinite mode, we can progressively append to give feedback (optional, but looks nice)
            // But strict requirement was just fixing bugs. 
        }
        return newItems;
  };

  const handleStop = () => {
      if (abortControllerRef.current) {
          abortControllerRef.current.abort();
      }
      // Forcefully stop loading UI
      setIsLoading(false);
      setIsLoadingMore(false);
      showToast("Generation Stopped");
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsPromptExpanded(false); 
    setIsLoading(true);
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Slight delay to allow UI to update close state
    setTimeout(async () => {
        if (signal.aborted) return;

        // In infinite mode, start with 6. Otherwise use setting.
        const count = localSettings.infiniteMode ? 6 : (localSettings.imageCount || 1);
        
        const newItems = await generateImagesBatch(count, false);
        
        if (signal.aborted) return;

        setCurrentImages(newItems);
        setIsLoading(false); 

        // Refresh account balance slightly after generation start to reflect changes
        setTimeout(fetchAccount, 3000);
    }, 100); 
  };

  // Infinite Scroll Load More
  const handleLoadMore = useCallback(async () => {
      if (isLoading || isLoadingMore || !localSettings.infiniteMode || currentImages.length === 0) return;
      
      setIsLoadingMore(true);
      // Generate 4 more
      const moreItems = await generateImagesBatch(4, true);
      
      if (moreItems.length > 0) {
          setCurrentImages(prev => [...prev, ...moreItems]);
      }
      setIsLoadingMore(false);
      setTimeout(fetchAccount, 3000);

  }, [isLoading, isLoadingMore, localSettings.infiniteMode, currentImages.length, prompt, localSettings]);

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    if (!localSettings.infiniteMode) return;

    const observer = new IntersectionObserver(
        (entries) => {
            if (entries[0].isIntersecting) {
                handleLoadMore();
            }
        },
        { threshold: 0.1, rootMargin: '200px' }
    );

    if (loadMoreRef.current) {
        observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [handleLoadMore, localSettings.infiniteMode, currentImages]);


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
          navigator.clipboard.writeText(currentImages[fullscreenIndex].url);
          showToast("Link Copied");
      }
  };

  const handleCopyImage = async () => {
    if (fullscreenIndex !== null && currentImages[fullscreenIndex]) {
        try {
            const response = await fetch(currentImages[fullscreenIndex].url);
            const blob = await response.blob();
            const item = new ClipboardItem({ [blob.type]: blob });
            await navigator.clipboard.write([item]);
            showToast("Image Copied");
        } catch (err) {
            navigator.clipboard.writeText(currentImages[fullscreenIndex].url);
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
  
  // Memoize style object for ImageItem to prevent lag when changing non-visual settings
  const imageStyle = useMemo(() => ({ 
      aspectRatio: localSettings.width / localSettings.height 
  }), [localSettings.width, localSettings.height]);

  // Robust Masonry Layout Calculation using Flex Columns (Prevents shuffling)
  const columns2 = useMemo(() => {
    const cols: HistoryItem[][] = [[], []];
    currentImages.forEach((item, i) => {
        cols[i % 2].push(item);
    });
    return cols;
  }, [currentImages]);

  const columns3 = useMemo(() => {
    const cols: HistoryItem[][] = [[], [], []];
    currentImages.forEach((item, i) => {
        cols[i % 3].push(item);
    });
    return cols;
  }, [currentImages]);

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
                className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[150] px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center gap-2 pointer-events-none"
            >
                <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
                <span className="text-sm font-bold text-white tracking-wide">{toastMessage}</span>
            </motion.div>
        )}
      </AnimatePresence>
      
      {/* Settings Backdrop Overlay - Allows closing settings by clicking outside */}
      <AnimatePresence>
        {showSettings && (
             <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] cursor-pointer"
                onClick={() => setShowSettings(false)}
            />
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
          
          {/* Central Logo / Status Indicator */}
          <div className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg backdrop-blur-xl bg-black/20" onClick={fetchAccount}>
            <span className="text-xs font-bold tracking-widest uppercase text-white/90">Resonance</span>
            {accountState.balance !== null && (
                <>
                    <div className="w-px h-3 bg-white/10" />
                    <span className="text-[10px] text-purple-300 font-mono flex items-center gap-1">
                         {getEstimatedImagesLeft(accountState.balance)} 
                         <span className="material-symbols-outlined text-[10px]">photo_library</span>
                    </span>
                </>
            )}
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
        <div className={`min-h-full flex flex-col items-center pt-20 w-full max-w-7xl mx-auto px-4 gap-6 ${localSettings.infiniteMode ? 'pb-32' : 'pb-10 justify-center'}`}>
            
            {/* Main Image Display Area */}
            <div className={`w-full relative group z-0 flex items-center justify-center ${showResults ? 'min-h-[300px]' : 'flex-1'}`}>
            
            {/* Conditional Background Blur */}
            <div className={`absolute -inset-1 bg-gradient-to-b from-primary/40 to-purple-600/40 rounded-[2.5rem] blur-2xl transition-all duration-1000 will-change-transform ${showResults && !localSettings.infiniteMode ? 'opacity-50' : 'opacity-0'}`}></div>
            
            <AnimatePresence mode="wait">
                {(!showResults) && !localSettings.infiniteMode && (
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
                        <div className="flex flex-col items-center gap-1">
                            <p className="text-sm text-white/50 max-w-[220px] mx-auto leading-relaxed font-medium">
                                Ignite your imagination.
                            </p>
                        </div>
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
                    {localSettings.infiniteMode ? (
                        // INFINITE MODE: Robust Masonry using Flex Columns
                        <div className="w-full">
                            {/* Mobile Layout (2 Cols) */}
                            <div className="md:hidden flex gap-3 w-full">
                                {columns2.map((col, colIdx) => (
                                    <div key={colIdx} className="flex-1 flex flex-col gap-3">
                                        <AnimatePresence>
                                            {col.map((item) => (
                                                <motion.div
                                                    key={item.id}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                                >
                                                    <ImageItem 
                                                        item={item}
                                                        index={currentImages.findIndex(i => i.id === item.id)}
                                                        total={currentImages.length}
                                                        onClick={() => { setFullscreenIndex(currentImages.findIndex(i => i.id === item.id)); setShowInfoPanel(false); }}
                                                        isGrid={true}
                                                    />
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Layout (3 Cols) */}
                            <div className="hidden md:flex gap-3 w-full">
                                {columns3.map((col, colIdx) => (
                                    <div key={colIdx} className="flex-1 flex flex-col gap-3">
                                        <AnimatePresence>
                                            {col.map((item) => (
                                                <motion.div
                                                    key={item.id}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                                >
                                                    <ImageItem 
                                                        item={item}
                                                        index={currentImages.findIndex(i => i.id === item.id)}
                                                        total={currentImages.length}
                                                        onClick={() => { setFullscreenIndex(currentImages.findIndex(i => i.id === item.id)); setShowInfoPanel(false); }}
                                                        isGrid={true}
                                                    />
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>

                            {isLoadingMore && (
                                <div className="w-full flex items-center justify-center py-6">
                                    <div className="size-6 border-2 border-white/20 border-t-primary rounded-full animate-spin"></div>
                                </div>
                            )}

                            {/* Trigger for infinite scroll */}
                            <div ref={loadMoreRef} className="h-20 w-full" />
                        </div>
                    ) : (
                        // CLASSIC MODE: Horizontal Carousel
                        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory w-full pb-4 no-scrollbar items-center">
                            {currentImages.map((item, idx) => (
                                <ImageItem 
                                    key={item.id} 
                                    item={item}
                                    index={idx}
                                    total={currentImages.length}
                                    onClick={() => { setFullscreenIndex(idx); setShowInfoPanel(false); }}
                                    style={imageStyle}
                                />
                            ))}
                        </div>
                    )}
                </motion.div>
            )}
            </div>

            {/* Prompt Bar and Controls - Floating at bottom */}
            <div className={`w-full flex flex-col items-center gap-2 z-40 ${localSettings.infiniteMode ? 'fixed bottom-6 left-0 right-0 px-4 pointer-events-none' : ''}`}>
                
                {/* Style Chips (Visible only in Standard Mode, Settings Closed, Prompt Not Expanded) */}
                {availableStyles.length > 0 && !showSettings && !isPromptExpanded && !localSettings.infiniteMode && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`w-full md:max-w-2xl mx-auto overflow-x-auto no-scrollbar pb-1 pointer-events-auto`}
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

                {/* Unified Pill Control Bar */}
                <motion.div 
                    layout
                    initial={{ borderRadius: "2rem" }}
                    animate={{ 
                        borderRadius: showSettings || isPromptExpanded ? "2rem" : "9999px",
                        width: isPromptExpanded ? "100%" : "100%",
                        maxWidth: isPromptExpanded ? "100%" : "42rem" 
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={`mx-auto w-full bg-[#192233]/90 backdrop-blur-xl shadow-liquid border border-white/10 ring-1 ring-white/5 overflow-hidden relative z-50 pointer-events-auto transition-all`}
                >
                    {/* Input Row */}
                    <div className="relative w-full flex items-end gap-2 p-2">
                        
                        {/* Settings Toggle (Left) */}
                        <button 
                            onClick={() => setShowSettings(!showSettings)}
                            className={`size-10 shrink-0 rounded-full flex items-center justify-center transition-colors ${showSettings ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/50 hover:text-white'}`}
                        >
                            <span className={`material-symbols-outlined text-[20px] transition-transform duration-300 ${showSettings ? 'rotate-180' : ''}`}>
                                {showSettings ? 'keyboard_arrow_down' : 'tune'}
                            </span>
                        </button>

                        {/* Prompt Input (Center) */}
                        <div className="flex-1 py-2 min-h-[40px] flex items-center">
                            <textarea 
                                ref={textareaRef}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onClick={() => setShowSettings(false)}
                                onKeyDown={stopProp} 
                                onTouchStart={stopProp}
                                className="w-full bg-transparent border-none text-white text-base placeholder:text-white/30 focus:ring-0 resize-none p-0 leading-relaxed font-medium max-h-[150px] overflow-y-auto" 
                                placeholder="Describe your dream..." 
                                rows={1}
                                style={{ minHeight: '24px' }}
                            />
                        </div>

                        {/* Actions (Right) */}
                        <div className="flex items-center gap-2 pb-1">
                            
                            {/* Clear/Expand Actions */}
                            {prompt.length > 20 && !isLoading && (
                                 <button 
                                    onClick={() => setPrompt('')}
                                    className="size-8 rounded-full hover:bg-white/10 text-white/30 hover:text-white transition-colors flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            )}

                            {/* Stop Button */}
                            {(isLoading || isLoadingMore) && (
                                <button 
                                    onClick={handleStop}
                                    className="size-10 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center animate-pulse"
                                >
                                    <span className="material-symbols-outlined text-[24px]">stop</span>
                                </button>
                            )}

                            {/* Generate Button */}
                            {!isLoading && !isLoadingMore && (
                                <button 
                                    onClick={handleGenerate}
                                    disabled={!prompt}
                                    className={`size-10 rounded-full flex items-center justify-center transition-all shadow-glow ${
                                        !prompt 
                                        ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                                        : 'bg-primary text-white hover:scale-105 active:scale-95'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[24px]">
                                        {localSettings.infiniteMode ? 'vertical_split' : 'arrow_upward'}
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Settings Panel (Expandable) */}
                    <AnimatePresence>
                        {showSettings && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="border-t border-white/5 bg-black/20 overflow-y-auto no-scrollbar max-h-[60vh]"
                            >
                                <GeneratorSettings 
                                    localSettings={localSettings}
                                    updateLocalSetting={updateLocalSetting}
                                    setAspectRatio={setAspectRatio}
                                    availableStyles={availableStyles}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
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
                {/* ... (Existing Fullscreen Overlay Code remains unchanged) ... */}
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
                                src={currentImages[fullscreenIndex].url}
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
                        onClick={() => handleDownload(currentImages[fullscreenIndex].url)}
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
                                        {decodeURIComponent(currentImages[fullscreenIndex].prompt)}
                                    </div>
                                </div>

                                {currentImages[fullscreenIndex].styleSuffix && (
                                    <div>
                                        <h4 className="text-xs font-bold text-purple-400/60 uppercase tracking-widest mb-2">Spice (Added)</h4>
                                        <div className="text-xs text-white/80 leading-relaxed font-mono bg-purple-500/10 p-3 rounded-xl border border-purple-500/20 select-text">
                                            {currentImages[fullscreenIndex].styleSuffix}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Direct Link</h4>
                                    <div className="flex items-center gap-2 bg-black/20 p-2 rounded-xl border border-white/5">
                                        <span className="text-xs text-white/60 truncate flex-1 font-mono">
                                            {currentImages[fullscreenIndex].url}
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
                                    <div>
                                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Model</h4>
                                        <span className="px-2 py-0.5 rounded bg-white/10 text-xs font-bold text-white uppercase">{currentImages[fullscreenIndex].model}</span>
                                    </div>
                                    {currentImages[fullscreenIndex].styleLabel && (
                                         <div>
                                            <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Style</h4>
                                            <span className="px-2 py-0.5 rounded bg-primary/20 text-xs font-bold text-primary border border-primary/20">{currentImages[fullscreenIndex].styleLabel}</span>
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Seed</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-white font-mono">{currentImages[fullscreenIndex].seed}</span>
                                            <button onClick={() => { navigator.clipboard.writeText(currentImages[fullscreenIndex].seed.toString()); showToast("Seed Copied"); }} className="text-white/30 hover:text-white">
                                                <span className="material-symbols-outlined text-[14px]">content_copy</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Size</h4>
                                        <span className="text-sm text-white">{currentImages[fullscreenIndex].width} x {currentImages[fullscreenIndex].height}</span>
                                    </div>
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
