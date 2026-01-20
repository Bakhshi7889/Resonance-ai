import React, { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { generateImageUrl, getRandomSeed, getAccountDetails, getEstimatedImagesLeft } from '../services/pollinations';
import { AppRoute, AppSettings, HistoryItem, MODEL_STYLES, ASPECT_RATIOS, AccountState } from '../types';

const ZIMAGE_COST_PER_IMG = 0.0002;
const SILENT_NEGATIVE = "nsfw, naked, nude, porn, sex, explicit, genitals, nipples, topless, breasts, bad anatomy, deformed, ugly, watermark, logo";

const NEGATIVE_SUGGESTIONS = [
    "Distorted", "Blurry", "Text", "Lowres", "Watermark", "Malformed", "Extra Limbs", 
    "Grainy", "Signature", "Logo", "Low Quality", "Mutilated", "Out of frame", "Username", 
    "Poorly drawn", "Cropped", "Bad proportions", "Double face", "Cloned"
];

// Pure JS Skin Tone Density Auditor
const performVisualAudit = async (imageUrl: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(false);
      
      // Sample a 100x100 grid for efficient heuristic processing
      const w = 100;
      const h = 100;
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      
      const data = ctx.getImageData(0, 0, w, h).data;
      let flaggedPixels = 0;
      const totalPixels = w * h;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Peer-reviewed skin detection heuristic range
        const isFlagged = (r > 95 && g > 40 && b > 20 && 
                       (Math.max(r, g, b) - Math.min(r, g, b) > 15) && 
                       Math.abs(r - g) > 15 && r > g && r > b);
        
        if (isFlagged) flaggedPixels++;
      }
      
      const density = flaggedPixels / totalPixels;
      // 45% skin density is highly likely to be explicit or tight portraits
      resolve(density > 0.45);
    };
    img.onerror = () => resolve(false);
  });
};

const formatPollen = (balance: number | null) => {
    if (balance === null || balance === undefined) return '$0.000';
    const formatted = balance.toLocaleString(undefined, { 
        minimumFractionDigits: 3, 
        maximumFractionDigits: 4 
    });
    return `$${formatted}`;
};

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

const GenerationCard = memo(({ item, index, visualSafety }: { item: HistoryItem, index: number, visualSafety: boolean }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [visualRisk, setVisualRisk] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  
  // Risk is now strictly based on visual audit results, no more prompt-based detection
  const needsBlur = visualRisk;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-100, 100], [5, -5]), { stiffness: 200, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-100, 100], [-5, 5]), { stiffness: 200, damping: 30 });

  const handleImageLoad = async () => {
      if (visualSafety) {
          setIsAuditing(true);
          const result = await performVisualAudit(item.url);
          setVisualRisk(result);
          setIsAuditing(false);
      }
      setIsLoaded(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  return (
    <motion.div 
      layout
      onPointerMove={handlePointerMove}
      onPointerLeave={() => { x.set(0); y.set(0); }}
      initial={{ opacity: 0, scale: 0.95, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.02, type: "spring", stiffness: 400, damping: 35 }}
      className="relative shrink-0 overflow-hidden bg-white/[0.02] border-[0.5px] border-white/10 shadow-2xl rounded-[2.5rem] group/card flex items-center justify-center"
      style={{ 
        rotateX, rotateY, transformStyle: 'preserve-3d',
        aspectRatio: `${item.width}/${item.height}`,
        width: '100%',
        maxWidth: 'min(calc(100vw - 48px), 600px)',
        height: 'auto'
      }}
    >
      <img 
        src={item.url} 
        alt="vision"
        className={`w-full h-full object-cover transition-all duration-1000 ease-out ${isLoaded && !isAuditing ? 'opacity-100 scale-100' : 'opacity-0 scale-110'} ${(needsBlur && !revealed) ? 'blur-[80px] saturate-50 brightness-50' : 'blur-0'}`}
        onLoad={handleImageLoad}
        draggable={false}
      />
      {(!isLoaded || isAuditing) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 gap-3">
          <div className="size-10 rounded-full border-2 border-white/5 border-t-primary/60 animate-spin" />
          {isAuditing && <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30">Calibrating...</span>}
        </div>
      )}
      {needsBlur && !revealed && isLoaded && !isAuditing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-20 bg-black/60 backdrop-blur-3xl">
          <span className="material-symbols-outlined text-white/40 text-4xl mb-4 !font-light">visibility_off</span>
          <p className="text-[10px] text-white/60 font-black uppercase tracking-[0.3em] mb-6">Sensitive Content Detected</p>
          <button onClick={(e) => { e.stopPropagation(); setRevealed(true); }} className="px-8 py-3 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Reveal</button>
        </div>
      )}
      <div className="absolute inset-0 rounded-[2.5rem] border-[0.5px] border-white/20 pointer-events-none group-hover/card:border-white/40 transition-colors" />
    </motion.div>
  );
});

const SettingsPill = memo(({ localSettings, updateLocalSetting, setAspectRatio }: { 
    localSettings: AppSettings, 
    updateLocalSetting: (k: keyof AppSettings, v: any) => void,
    setAspectRatio: (w: number, h: number) => void
}) => {
    const sortedStyles = useMemo(() => {
        const categories = ['Basic', 'Realistic', 'Artistic', 'Thematic'];
        return [...MODEL_STYLES].sort((a, b) => categories.indexOf(a.category) - categories.indexOf(b.category));
    }, []);

    const negativeTags = useMemo(() => {
        return (localSettings.negativePrompt || "")
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0);
    }, [localSettings.negativePrompt]);

    const addNegativeTag = (tag: string) => {
        if (!negativeTags.some(t => t.toLowerCase() === tag.toLowerCase())) {
            const newPrompt = negativeTags.length > 0 ? `${localSettings.negativePrompt}, ${tag}` : tag;
            updateLocalSetting('negativePrompt', newPrompt);
        }
    };

    const removeNegativeTag = (tag: string) => {
        const filtered = negativeTags.filter(t => t.toLowerCase() !== tag.toLowerCase());
        updateLocalSetting('negativePrompt', filtered.join(', '));
    };

    const toggleStyle = (id: string) => {
        const current = localSettings.activeStyles || [];
        if (id === 'none') {
            updateLocalSetting('activeStyles', ['none']);
            return;
        }
        const filtered = current.filter(s => s !== 'none');
        if (filtered.includes(id)) {
            const next = filtered.filter(s => s !== id);
            updateLocalSetting('activeStyles', next.length === 0 ? ['none'] : next);
        } else {
            updateLocalSetting('activeStyles', [...filtered, id]);
        }
    };

    return (
        <div className="px-5 py-6 flex flex-col gap-8 overflow-y-auto no-scrollbar max-h-[60vh] pb-32">
            <div className="flex flex-col gap-3 glass-panel-sub p-5 rounded-[2.2rem] border-[0.5px] border-white/10">
                <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em]">Batch Capacity (Max 8)</p>
                <div className="flex justify-between items-center gap-2">
                    {[1, 2, 4, 6, 8].map(n => (
                        <button 
                            key={n} 
                            onClick={() => updateLocalSetting('imageCount', n)}
                            className={`flex-1 h-12 rounded-2xl text-[12px] font-black transition-all border ${localSettings.imageCount === n ? 'bg-primary/20 border-primary/50 text-primary shadow-glow scale-105' : 'bg-white/5 border-transparent text-white/30 hover:bg-white/10'}`}
                        >
                            {n}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="glass-panel-sub p-5 rounded-[2.2rem] flex flex-col gap-3">
                        <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em]">Neural Engine</p>
                        <button 
                            onClick={() => updateLocalSetting('enhance', !localSettings.enhance)}
                            className={`w-full h-12 rounded-2xl text-[9px] font-black transition-all border flex items-center justify-center gap-2 ${localSettings.enhance ? 'bg-primary/20 border-primary/50 text-primary shadow-glow' : 'bg-white/5 border-transparent text-white/30 hover:bg-white/10'}`}
                        >
                            <span className="material-symbols-outlined text-[16px]">{localSettings.enhance ? 'auto_awesome' : 'auto_awesome_off'}</span>
                            {localSettings.enhance ? 'ON' : 'OFF'}
                        </button>
                    </div>
                    <div className="glass-panel-sub p-5 rounded-[2.2rem] flex flex-col gap-3">
                        <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em]">Neural Privacy</p>
                        <button 
                            onClick={() => updateLocalSetting('visualSafety', !localSettings.visualSafety)}
                            className={`w-full h-12 rounded-2xl text-[9px] font-black transition-all border flex items-center justify-center gap-2 ${localSettings.visualSafety ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-glow' : 'bg-white/5 border-transparent text-white/30 hover:bg-white/10'}`}
                        >
                            <span className="material-symbols-outlined text-[16px] animate-pulse-slow">{localSettings.visualSafety ? 'visibility_lock' : 'visibility'}</span>
                            {localSettings.visualSafety ? 'AUDIT' : 'OFF'}
                        </button>
                    </div>
                </div>

                <div>
                    <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em] mb-4 pl-1">Aspect Geometry</p>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar px-1 pb-2">
                        {ASPECT_RATIOS.map(ratio => {
                            const isSelected = localSettings.width === ratio.width && localSettings.height === ratio.height;
                            const iconDims: Record<string, { w: number, h: number }> = {
                                "1:1": { w: 12, h: 12 }, "3:4": { w: 9, h: 12 }, "4:3": { w: 12, h: 9 }, "16:9": { w: 16, h: 9 }, "9:16": { w: 9, h: 16 }
                            };
                            const { w, h } = iconDims[ratio.label] || { w: 12, h: 12 };
                            return (
                                <button key={ratio.label} onClick={() => setAspectRatio(ratio.width, ratio.height)} className={`shrink-0 flex flex-col items-center justify-center gap-2 px-3 py-4 rounded-2xl min-w-[68px] border transition-all ${isSelected ? 'bg-primary/10 border-primary/40 shadow-glow' : 'bg-white/5 border-transparent opacity-50 hover:opacity-100'}`}>
                                    <div className={`border-[1.5px] rounded-[2px] ${isSelected ? 'border-primary bg-primary/20' : 'border-white/30'}`} style={{ width: `${w}px`, height: `${h}px` }} />
                                    <span className={`text-[8px] font-black ${isSelected ? 'text-primary' : 'text-white/40'}`}>{ratio.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em] mb-4 pl-1">Style Matrix</p>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar px-1 pb-4">
                        {sortedStyles.map(style => {
                            const isSelected = localSettings.activeStyles.includes(style.id);
                            return (
                                <button key={style.id} onClick={() => toggleStyle(style.id)} className={`relative shrink-0 w-32 h-44 rounded-[2rem] overflow-hidden border transition-all duration-500 ${isSelected ? 'border-primary/60 ring-4 ring-primary/10 scale-105 z-10' : 'border-white/10 opacity-40 hover:opacity-100'}`}>
                                    <img src={style.image} alt={style.label} className="w-full h-full object-cover" loading="lazy" />
                                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black to-transparent">
                                        <p className={`text-[10px] font-black uppercase tracking-tight text-center ${isSelected ? 'text-primary' : 'text-white'}`}>{style.label}</p>
                                        <p className="text-[7px] text-white/30 text-center uppercase font-black tracking-widest mt-1">{style.category}</p>
                                    </div>
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 size-6 rounded-full bg-primary flex items-center justify-center shadow-lg border border-white/20">
                                            <span className="material-symbols-outlined text-white text-[14px] font-black">check</span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="glass-panel-sub p-5 rounded-[2.2rem] flex flex-col gap-3">
                    <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em]">Seed Matrix</p>
                    <div className="flex gap-2">
                        <input 
                            type="number"
                            value={localSettings.seed || ''}
                            onChange={(e) => updateLocalSetting('seed', parseInt(e.target.value) || 0)}
                            placeholder="Auto-Seed Active"
                            className="flex-1 h-12 bg-white/[0.03] border border-white/10 rounded-2xl px-4 text-[10px] text-white focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all placeholder:text-white/10"
                        />
                        <button onClick={() => updateLocalSetting('seed', getRandomSeed())} className="h-12 w-12 shrink-0 bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:text-white transition-all flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px]">shuffle</span>
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em] pl-1">Exclusion Engine</p>
                    <div className="flex flex-wrap gap-2 px-1">
                        <AnimatePresence>
                            {negativeTags.map(tag => (
                                <motion.div 
                                    key={tag}
                                    layout
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary shadow-glow"
                                >
                                    <span className="text-[10px] font-black uppercase tracking-wider">{tag}</span>
                                    <button 
                                        onClick={() => removeNegativeTag(tag)}
                                        className="size-4 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/40 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-[10px] font-black">close</span>
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {negativeTags.length === 0 && (
                            <p className="text-[10px] text-white/10 italic py-2 pl-1">Exclusion Matrix is currently clear...</p>
                        )}
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {NEGATIVE_SUGGESTIONS.map(suggestion => {
                            const isActive = negativeTags.some(t => t.toLowerCase() === suggestion.toLowerCase());
                            return (
                                <button 
                                    key={suggestion}
                                    onClick={() => !isActive && addNegativeTag(suggestion)}
                                    className={`shrink-0 px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-primary/20 border-primary/40 text-primary opacity-30 cursor-default' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white active:scale-95'}`}
                                >
                                    {suggestion}
                                </button>
                            );
                        })}
                    </div>
                    <div className="relative group">
                        <input 
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ',') {
                                    e.preventDefault();
                                    const val = (e.target as HTMLInputElement).value.trim();
                                    if (val) addNegativeTag(val);
                                    (e.target as HTMLInputElement).value = '';
                                }
                            }}
                            placeholder="Inject custom exclusion tokens..."
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-xs text-white placeholder:text-white/10 focus:ring-1 focus:ring-primary/40 transition-all"
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 group-focus-within:opacity-40 transition-opacity">
                             <span className="material-symbols-outlined text-[18px]">keyboard_return</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ 
    settings: globalSettings, onNavigate, onAddToHistory, updateSettings, sessionPrompt, setSessionPrompt, sessionImages, setSessionImages
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [localSettings, setLocalSettings] = useState({ 
    ...globalSettings, 
    activeStyles: (globalSettings.activeStyles && globalSettings.activeStyles.length > 0) ? globalSettings.activeStyles : ['none'] 
  });
  const [showSettings, setShowSettings] = useState(false);
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [accountState, setAccountState] = useState<AccountState>({ profile: null, balance: null, usage: [], isLoading: false, error: null });
  const [sessionTotalCost, setSessionTotalCost] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const islandRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const fetchAccount = useCallback(async () => {
      const data = await getAccountDetails(globalSettings.apiKey);
      setAccountState(data);
  }, [globalSettings.apiKey]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, []);

  useEffect(() => {
      fetchAccount();
      const interval = setInterval(fetchAccount, 20000); 
      return () => clearInterval(interval);
  }, [fetchAccount]);

  useEffect(() => {
    if (isLoading || sessionImages.length > 0) {
        scrollToBottom();
    }
  }, [sessionImages.length, isLoading, scrollToBottom]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
        if (islandRef.current && !islandRef.current.contains(e.target as Node)) setIsIslandExpanded(false);
    };
    if (isIslandExpanded) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isIslandExpanded]);

  useEffect(() => setLocalSettings(prev => ({ 
    ...prev, ...globalSettings,
    activeStyles: (globalSettings.activeStyles && globalSettings.activeStyles.length > 0) ? globalSettings.activeStyles : prev.activeStyles
  })), [globalSettings]);

  const generateImagesBatch = async (count: number): Promise<HistoryItem[]> => {
        const batchId = crypto.randomUUID(); 
        const selectedStyles = MODEL_STYLES.filter(s => localSettings.activeStyles.includes(s.id) && s.id !== 'none');
        const combinedSuffix = selectedStyles.map(s => s.suffix).join('');
        const promptWithStyles = `${sessionPrompt}${combinedSuffix}${selectedStyles.length > 0 ? ', highly detailed, 8k' : ''}`;
        
        const scale = localSettings.quality === 'hd' ? 2 : 1;
        const finalWidth = Math.round(localSettings.width * scale);
        const finalHeight = Math.round(localSettings.height * scale);

        const cost = count * ZIMAGE_COST_PER_IMG;
        setSessionTotalCost(prev => prev + cost);

        const newItems: HistoryItem[] = [];
        for (let i = 0; i < count; i++) {
            if (abortControllerRef.current?.signal.aborted) break;
            const itemSeed = localSettings.seed || (getRandomSeed() + i);
            const params = { 
                prompt: promptWithStyles, model: 'zimage', width: finalWidth, height: finalHeight, 
                seed: itemSeed, enhance: localSettings.enhance, nologo: true, 
                negative_prompt: localSettings.negativePrompt || SILENT_NEGATIVE, apiKey: globalSettings.apiKey, safe: true, private: true 
            };
            const item: HistoryItem = { 
                ...params, id: Date.now().toString() + i, batchId, timestamp: Date.now(), 
                url: generateImageUrl(params), prompt: sessionPrompt, styleIds: localSettings.activeStyles, styleSuffix: combinedSuffix 
            };
            newItems.push(item);
            onAddToHistory(item);
        }
        setTimeout(fetchAccount, 5000);
        return newItems;
  };

  const handleGenerate = async () => {
    if (!sessionPrompt) return;
    setShowSettings(false); setIsLoading(true);
    abortControllerRef.current = new AbortController();
    scrollToBottom();
    const newItems = await generateImagesBatch(localSettings.imageCount || 1);
    if (!abortControllerRef.current?.signal.aborted) {
        setSessionImages(prev => [...prev, ...newItems]);
        setIsLoading(false);
    }
  };

  const updateLocalSetting = useCallback((key: keyof AppSettings, value: any) => {
      setLocalSettings(prev => ({ ...prev, [key]: value }));
      if (updateSettings) updateSettings({ [key]: value });
  }, [updateSettings]);

  const setAspectRatio = useCallback((width: number, height: number) => {
    updateLocalSetting('width', width);
    updateLocalSetting('height', height);
  }, [updateLocalSetting]);

  const clearSessionFeed = () => {
      setSessionImages([]);
      showToast("Session Purged");
  };

  return (
    <motion.div className="flex flex-col h-full relative overflow-hidden font-display bg-black">
      <div className="fixed top-0 left-0 right-0 z-[200] h-24 flex justify-center pointer-events-none">
          <div className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-auto">
            <motion.div ref={islandRef} layout onClick={() => setIsIslandExpanded(!isIslandExpanded)} animate={{ width: isIslandExpanded ? 'min(380px, 90vw)' : '160px', height: isIslandExpanded ? 'auto' : '38px', borderRadius: isIslandExpanded ? '2rem' : '1.2rem' }} transition={{ type: "spring", stiffness: 450, damping: 32 }} className={`flex flex-col items-center shadow-liquid bg-black/80 backdrop-blur-[60px] overflow-hidden ${isLoading ? 'processing-border' : ''} border-[0.5px] border-white/20 origin-top cursor-pointer`}>
                <motion.div className="flex items-center gap-3 w-full h-[38px] justify-center px-4 shrink-0" animate={{ opacity: isIslandExpanded ? 0 : 1 }}>
                    <div className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-blue-500 shadow-glow" /><span className="text-[11px] font-black uppercase text-blue-400 font-mono tracking-tighter">{formatPollen(accountState.balance)}</span></div>
                    <div className="w-[0.5px] h-3 bg-white/15" /><span className="text-[11px] font-black uppercase text-white/80 font-mono tracking-tighter">~{getEstimatedImagesLeft(accountState.balance)}</span>
                </motion.div>
                <AnimatePresence>
                    {isIslandExpanded && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full p-6 flex flex-col gap-6">
                            <div className="flex justify-between items-center border-b border-white/5 pb-4"><div className="flex flex-col"><h3 className="text-[10px] font-black uppercase text-white tracking-[0.3em]">Core Processor</h3><p className="text-[8px] text-primary/80 font-mono uppercase tracking-widest mt-1">Status: Stable</p></div><span className="text-[9px] font-mono text-white/20">V4.32.R</span></div>
                            <div className="grid grid-cols-2 gap-3"><div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center"><p className="text-[8px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Account</p><p className="text-sm font-mono font-bold text-blue-400">{formatPollen(accountState.balance)}</p></div><div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center"><p className="text-[8px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Session Burn</p><p className="text-sm font-mono font-bold text-red-500">-${sessionTotalCost.toFixed(4)}</p></div></div>
                            <div className="flex flex-col gap-2"><button onClick={(e) => { e.stopPropagation(); if(sessionImages[0]) { navigator.clipboard.writeText(sessionImages[0].url); showToast("Link Copied"); } }} className="w-full h-11 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all disabled:opacity-20" disabled={sessionImages.length === 0}>Copy Asset Link</button><button onClick={(e) => { e.stopPropagation(); clearSessionFeed(); }} className="w-full h-11 rounded-2xl bg-white/10 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all">Clear Feed</button></div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
          </div>
      </div>

      <div className="fixed top-8 left-0 right-0 z-[100] px-6 flex justify-between pointer-events-none">
          <button onClick={() => onNavigate(AppRoute.PREFERENCES)} className="pointer-events-auto size-11 rounded-full glass-panel flex items-center justify-center text-white/40 border-[0.5px] border-white/15 active:scale-90 transition-all shadow-liquid"><span className="material-symbols-outlined text-[24px] !font-light">settings</span></button>
          <button onClick={() => onNavigate(AppRoute.HISTORY)} className="pointer-events-auto size-11 rounded-full glass-panel flex items-center justify-center text-white/40 border-[0.5px] border-white/15 active:scale-90 transition-all shadow-liquid"><span className="material-symbols-outlined text-[24px] !font-light">grid_view</span></button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar relative px-6 pb-[25vh]">
          <div className="h-32 shrink-0" aria-hidden="true" />
          <div className="max-w-4xl mx-auto w-full flex flex-col items-center gap-14">
            <AnimatePresence mode="popLayout">
                {sessionImages.length === 0 && !isLoading ? (
                    <motion.div key="intro" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-24">
                        <div className="size-20 rounded-[2.2rem] bg-white/[0.04] border-[0.5px] border-white/12 flex items-center justify-center mb-8 mx-auto shadow-liquid"><span className="material-symbols-outlined text-4xl text-white/10 !font-light animate-pulse-slow">blur_on</span></div>
                        <h2 className="text-4xl font-black uppercase logo-text text-white tracking-tighter">RESONANCE</h2>
                        <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.5em] mt-3 ml-[0.5em]">Synthetic Reality Studio</p>
                    </motion.div>
                ) : (
                    <>
                        {sessionImages.map((item, idx) => (<GenerationCard key={item.id} item={item} index={idx} visualSafety={localSettings.visualSafety} />))}
                        {isLoading && (
                             <motion.div key="loading-batch" initial={{ opacity: 0, scale: 0.98, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="relative shrink-0 overflow-hidden bg-white/[0.03] border-[0.5px] border-white/15 rounded-[2.5rem] shadow-liquid animate-pulse flex items-center justify-center mb-4" style={{ aspectRatio: `${localSettings.width}/${localSettings.height}`, width: '100%', maxWidth: 'min(calc(100vw - 48px), 600px)', height: 'auto' }}>
                                 <div className="flex flex-col items-center gap-4"><div className="size-10 rounded-full border-2 border-white/5 border-t-primary/60 animate-spin" /><span className="text-[10px] text-white/20 uppercase font-black tracking-[0.3em]">Architecting...</span></div>
                             </motion.div>
                        )}
                    </>
                )}
            </AnimatePresence>
          </div>
      </div>

      <div className="fixed bottom-8 left-0 right-0 px-6 z-50 pointer-events-none">
          <div className="max-w-2xl mx-auto w-full pointer-events-auto">
              <motion.div layout transition={{ type: "spring", stiffness: 450, damping: 35 }} className={`glass-panel overflow-hidden shadow-liquid ${showSettings ? 'rounded-[3rem]' : 'rounded-full'} border-[0.5px] border-white/20`}>
                  <div className="flex items-center gap-3 p-2.5">
                      <button onClick={() => setShowSettings(!showSettings)} className={`size-11 rounded-full flex items-center justify-center transition-all ${showSettings ? 'bg-white text-black shadow-lg' : 'text-white/30 hover:text-white hover:bg-white/5'}`}><span className="material-symbols-outlined !font-light text-[24px]">{showSettings ? 'expand_more' : 'tune'}</span></button>
                      <input value={sessionPrompt} onChange={(e) => setSessionPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenerate()} className="flex-1 bg-transparent border-none text-white text-base font-medium focus:ring-0 placeholder:text-white/15 px-1" placeholder="Define your reality..." />
                      <button onClick={handleGenerate} disabled={!sessionPrompt || isLoading} className={`size-11 rounded-full flex items-center justify-center transition-all ${!sessionPrompt ? 'bg-white/5 text-white/10' : 'bg-primary text-white shadow-glow active:scale-90'}`}><span className="material-symbols-outlined text-[22px]">{isLoading ? 'stop' : 'arrow_upward'}</span></button>
                  </div>
                  <AnimatePresence>{showSettings && (<motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t-[0.5px] border-white/5 bg-black/40 overflow-hidden"><SettingsPill localSettings={localSettings} updateLocalSetting={updateLocalSetting} setAspectRatio={setAspectRatio} /></motion.div>)}</AnimatePresence>
              </motion.div>
          </div>
      </div>

      <AnimatePresence>{toastMessage && (<motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[200] px-8 py-3.5 rounded-full glass-panel border border-white/20 shadow-liquid flex items-center"><span className="text-[10px] font-black text-white tracking-[0.2em] uppercase">{toastMessage}</span></motion.div>)}</AnimatePresence>
    </motion.div>
  );
};

export default ImageGenerator;