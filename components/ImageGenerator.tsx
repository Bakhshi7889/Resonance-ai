import React, { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useAnimate } from 'framer-motion';
import { 
    Settings, LayoutGrid, Shuffle, Eraser, Maximize2, Minimize2, 
    Trash2, EyeOff, Wand2, Zap, ArrowUp, ChevronDown, 
    Check, ShieldCheck, XCircle, Info, Hash, Clock
} from 'lucide-react';
import { generateImageUrl, getRandomSeed, getAccountDetails, getEstimatedImagesLeft } from '../services/pollinations';
import { AppRoute, AppSettings, HistoryItem, MODEL_STYLES, ASPECT_RATIOS, AccountState } from '../types';

const SILENT_NEGATIVE = "nsfw, naked, nude, porn, sex, explicit, genitals, nipples, topless, breasts, bad anatomy, deformed, ugly, watermark, logo";
const SPRING_CONFIG = { stiffness: 400, damping: 30 };
const STORAGE_KEY_TELEMETRY = 'resonance_v4_telemetry';

const NEGATIVE_SUGGESTIONS = [
    "Blurry", "Distorted", "Lowres", "Text", "Watermark", "Malformed", "Extra Limbs", "Grainy", "Logo", "Bad Anatomy"
];

const performVisualAudit = async (imageUrl: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(false);
      const w = 100, h = 100;
      canvas.width = w; canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      let flagged = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2];
        if (r > 95 && g > 40 && b > 20 && (Math.max(r, g, b) - Math.min(r, g, b) > 15) && Math.abs(r - g) > 15 && r > g && r > b) flagged++;
      }
      resolve((flagged / (w * h)) > 0.45);
    };
    img.onerror = () => resolve(false);
  });
};

const formatPollen = (balance: number | null) => {
    if (balance === null) return '$0.000';
    return `$${balance.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 4 })}`;
};

const RatioIcon = ({ width, height, isSelected }: { width: number, height: number, isSelected: boolean }) => {
    const base = 20;
    const ratio = width / height;
    const w = ratio > 1 ? base : base * ratio;
    const h = ratio > 1 ? base / ratio : base;
    return (
        <div 
            className={`rounded-[2px] border-[1.5px] transition-all duration-300 ${isSelected ? 'border-primary bg-primary/20 shadow-glow' : 'border-white/20'}`}
            style={{ width: `${w}px`, height: `${h}px` }}
        />
    );
};

interface ImageGeneratorProps {
  settings: AppSettings;
  onNavigate: (route: AppRoute) => void;
  onAddToHistory: (item: HistoryItem) => void;
  updateSettings?: (s: Partial<AppSettings>) => void;
  sessionPrompt: string;
  setSessionPrompt: (prompt: string) => void;
  sessionImages: HistoryItem[];
  setSessionImages: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
}

const PromptHeader = memo(({ prompt, onClearBatch, batchId }: { prompt: string, onClearBatch: (id: string) => void, batchId: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col gap-3 px-2 mb-4 group max-w-3xl mx-auto">
            <div className="flex items-center gap-3">
                <div 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex-1 flex items-center gap-3 px-6 py-4 rounded-[1.8rem] bg-white/[0.03] border-[0.5px] border-white/10 backdrop-blur-md cursor-pointer hover:bg-white/5 transition-all overflow-hidden shadow-sm"
                >
                    <Info size={14} className="text-primary shrink-0" />
                    <p className={`text-[11px] font-medium text-white/50 tracking-tight leading-relaxed ${isExpanded ? '' : 'truncate'}`}>
                        {prompt}
                    </p>
                </div>
                <button 
                    onClick={() => onClearBatch(batchId)}
                    className="size-12 rounded-[1.5rem] bg-white/5 border-[0.5px] border-white/10 flex items-center justify-center text-white/10 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0 active:scale-90"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </motion.div>
    );
});

const GenerationCard = memo(({ item, index, visualSafety, onImageReady }: { item: HistoryItem, index: number, visualSafety: boolean, onImageReady?: (id: string) => void }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [visualRisk, setVisualRisk] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  
  const handleImageLoad = async () => {
      if (visualSafety) {
          setIsAuditing(true);
          const result = await performVisualAudit(item.url);
          setVisualRisk(result);
          setIsAuditing(false);
      }
      setIsLoaded(true);
      if (onImageReady) onImageReady(item.id);
  };

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-100, 100], [3, -3]), SPRING_CONFIG);
  const rotateY = useSpring(useTransform(x, [-100, 100], [-3, 3]), SPRING_CONFIG);

  return (
    <motion.div 
      layout
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - rect.left - rect.width/2);
        y.set(e.clientY - rect.top - rect.height/2);
      }}
      onPointerLeave={() => { x.set(0); y.set(0); }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, type: "spring", ...SPRING_CONFIG }}
      className="relative shrink-0 overflow-hidden bg-white/[0.02] border-[0.5px] border-white/10 shadow-liquid rounded-[2.5rem] flex items-center justify-center group/card w-full max-w-3xl"
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', aspectRatio: `${item.width}/${item.height}` }}
    >
      <img 
        src={item.url} 
        alt="vision"
        className={`w-full h-full object-cover transition-all duration-1000 ease-out ${isLoaded && !isAuditing ? 'opacity-100' : 'opacity-0'} ${(visualRisk && !revealed) ? 'blur-[80px] saturate-50 brightness-50' : 'blur-0'}`}
        onLoad={handleImageLoad}
      />
      {(!isLoaded || isAuditing) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md">
          <div className="size-8 rounded-full border-2 border-white/5 border-t-primary animate-spin" />
        </div>
      )}
      {visualRisk && !revealed && isLoaded && !isAuditing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-20 bg-black/80 backdrop-blur-3xl">
          <EyeOff className="text-white/10 mb-6" strokeWidth={1} size={54} />
          <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.4em] mb-10">Neural Filter Active</p>
          <button onClick={() => setRevealed(true)} className="px-12 py-5 rounded-full bg-white text-black text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-glow">Reveal</button>
        </div>
      )}
    </motion.div>
  );
});

const SettingsPill = memo(({ localSettings, updateLocalSetting, setAspectRatio }: { 
    localSettings: AppSettings, updateLocalSetting: (k: keyof AppSettings, v: any) => void, setAspectRatio: (w: number, h: number) => void
}) => {
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

    const selectedIndices = useMemo(() => {
        const indices = MODEL_STYLES
            .map((s, i) => (localSettings.activeStyles.includes(s.id) && s.id !== 'none') ? i : -1)
            .filter(i => i !== -1);
        return indices.length > 1 ? indices : [];
    }, [localSettings.activeStyles]);

    const meshData = useMemo(() => {
        if (selectedIndices.length < 2) return null;
        
        const cardWidth = 112; 
        const gap = 16; 
        const containerPadding = 4; 
        
        const points = selectedIndices.map(index => {
            return containerPadding + (index * (cardWidth + gap)) + (cardWidth / 2);
        });

        const minX = Math.min(...points);
        const maxX = Math.max(...points);
        const bridgeY = 32; 
        
        return { 
            points, 
            minX, 
            maxX, 
            bridgeY, 
            totalWidth: (MODEL_STYLES.length * cardWidth) + ((MODEL_STYLES.length - 1) * gap) + (containerPadding * 2) 
        };
    }, [selectedIndices]);

    return (
        <div className="px-6 py-10 flex flex-col gap-10 overflow-y-auto no-scrollbar max-h-[60vh] pb-36">
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => updateLocalSetting('enhance', !localSettings.enhance)} className={`h-16 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all border ${localSettings.enhance ? 'bg-primary/20 border-primary/40 text-primary shadow-glow' : 'bg-white/5 border-transparent text-white/20'}`}>
                    <Wand2 size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Neural {localSettings.enhance ? 'ON' : 'OFF'}</span>
                </button>
                <button onClick={() => updateLocalSetting('visualSafety', !localSettings.visualSafety)} className={`h-16 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all border ${localSettings.visualSafety ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 shadow-glow' : 'bg-white/5 border-transparent text-white/20'}`}>
                    <ShieldCheck size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Audit {localSettings.visualSafety ? 'ON' : 'OFF'}</span>
                </button>
            </div>

            <div className="space-y-4">
                <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em] pl-1">Aspect Geometry</p>
                <div className="grid grid-cols-5 gap-2 bg-white/5 p-2 rounded-[1.8rem] border border-white/5">
                    {ASPECT_RATIOS.map(ratio => {
                        const isSelected = localSettings.width === ratio.width && localSettings.height === ratio.height;
                        return (
                            <button key={ratio.label} onClick={() => setAspectRatio(ratio.width, ratio.height)} className={`h-14 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${isSelected ? 'bg-white/10 text-white shadow-lg' : 'text-white/20 hover:text-white/40'}`}>
                                <RatioIcon width={ratio.width} height={ratio.height} isSelected={isSelected} />
                                <span className="text-[8px] font-black">{ratio.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-4">
                <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em] pl-1">Batch Capacity</p>
                <div className="grid grid-cols-4 gap-2 bg-white/5 p-2 rounded-[1.8rem] border border-white/5">
                    {[1, 2, 4, 8].map(n => (
                        <button key={n} onClick={() => updateLocalSetting('imageCount', n)} className={`h-14 rounded-2xl text-[10px] font-black transition-all ${localSettings.imageCount === n ? 'bg-primary text-white shadow-glow' : 'text-white/20 hover:text-white/40'}`}>{n}x</button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em] pl-1">Style Matrix</p>
                <div className="relative">
                    <div className="flex gap-4 overflow-x-auto no-scrollbar px-1 pb-24 relative z-10">
                        {MODEL_STYLES.map(style => {
                            const isSelected = localSettings.activeStyles.includes(style.id);
                            return (
                                <button 
                                    key={style.id} 
                                    onClick={() => toggleStyle(style.id)} 
                                    className={`relative shrink-0 w-28 h-40 rounded-[1.8rem] overflow-hidden border transition-all duration-500 ${isSelected ? 'border-primary shadow-[0_4px_30px_rgba(59,130,246,0.4)] scale-105 z-10' : 'border-white/10 opacity-40 hover:opacity-100'}`}
                                >
                                    <img src={style.image} alt={style.label} className="w-full h-full object-cover" loading="lazy" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                                        <p className={`text-[9px] font-black uppercase tracking-tighter text-center leading-tight ${isSelected ? 'text-primary' : 'text-white/80'}`}>{style.label}</p>
                                    </div>
                                    {isSelected && style.id !== 'none' && (
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-12 bg-primary/20 blur-2xl pointer-events-none" />
                                    )}
                                </button>
                            );
                        })}
                        
                        <AnimatePresence>
                            {meshData && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute bottom-6 left-0 h-[60px] z-0 pointer-events-none"
                                    style={{ width: meshData.totalWidth }}
                                >
                                    <svg 
                                        width={meshData.totalWidth} 
                                        height="60" 
                                        viewBox={`0 0 ${meshData.totalWidth} 60`} 
                                        className="overflow-visible"
                                    >
                                        <defs>
                                            <filter id="mesh-glow" x="-50%" y="-50%" width="200%" height="200%">
                                                <feGaussianBlur stdDeviation="4" result="blur" />
                                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                            </filter>
                                        </defs>
                                        <motion.line
                                            initial={{ x1: meshData.minX, x2: meshData.minX }}
                                            animate={{ 
                                                x1: meshData.minX, 
                                                x2: meshData.maxX, 
                                                y1: meshData.bridgeY, 
                                                y2: meshData.bridgeY,
                                            }}
                                            stroke="#3b82f6"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            filter="url(#mesh-glow)"
                                            transition={{ type: "spring", ...SPRING_CONFIG }}
                                        />
                                        {meshData.points.map((x, i) => (
                                            <g key={`neural-path-${i}`}>
                                                <motion.line
                                                    initial={{ opacity: 0, y1: 0, y2: 0 }}
                                                    animate={{ x1: x, x2: x, y1: 0, y2: meshData.bridgeY, opacity: 1 }}
                                                    stroke="#3b82f6"
                                                    strokeWidth="2.5"
                                                    strokeLinecap="round"
                                                    filter="url(#mesh-glow)"
                                                />
                                            </g>
                                        ))}
                                    </svg>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em] pl-1">Seed Override</p>
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <input type="number" value={localSettings.seed || ''} onChange={(e) => updateLocalSetting('seed', parseInt(e.target.value) || 0)} placeholder="Random (Auto)" className="w-full h-16 bg-white/5 border border-white/10 rounded-[1.5rem] px-6 text-[11px] font-mono text-white focus:ring-1 focus:ring-primary/40 placeholder:text-white/10" />
                        <Hash size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/10" />
                    </div>
                    <button onClick={() => updateLocalSetting('seed', getRandomSeed())} className="size-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-90"><Shuffle size={18} /></button>
                </div>
            </div>

            <div className="glass-panel-sub p-6 rounded-[2.5rem] flex flex-col gap-5">
                <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em]">Exclusion Architecture</p>
                <div className="flex flex-wrap gap-2">
                    <AnimatePresence>
                        {(localSettings.negativePrompt || "").split(',').filter(t => t.trim()).map(tag => (
                            <motion.div key={tag} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/60">
                                {tag.trim()}
                                <XCircle size={10} className="cursor-pointer hover:text-white" onClick={() => updateLocalSetting('negativePrompt', (localSettings.negativePrompt || "").split(',').filter(t => t.trim() !== tag.trim()).join(', '))} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    {NEGATIVE_SUGGESTIONS.map(s => (
                        <button key={s} onClick={() => updateLocalSetting('negativePrompt', localSettings.negativePrompt ? `${localSettings.negativePrompt}, ${s}` : s)} className="shrink-0 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 hover:bg-white/10 transition-all">{s}</button>
                    ))}
                </div>
                <input onKeyDown={(e) => { if(e.key === 'Enter') { const val = (e.target as HTMLInputElement).value; if(val) updateLocalSetting('negativePrompt', localSettings.negativePrompt ? `${localSettings.negativePrompt}, ${val}` : val); (e.target as HTMLInputElement).value = ''; } }} placeholder="Tokens to prevent..." className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-6 text-[11px] text-white focus:ring-1 focus:ring-primary/40 placeholder:text-white/10" />
            </div>
        </div>
    );
});

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ 
    settings: globalSettings, onNavigate, onAddToHistory, updateSettings, sessionPrompt, setSessionPrompt, sessionImages, setSessionImages
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [localSettings, setLocalSettings] = useState({ ...globalSettings });
  const [showSettings, setShowSettings] = useState(false);
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [renderTime, setRenderTime] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<Set<string>>(new Set());

  const [telemetry, setTelemetry] = useState<{ avgDuration: number; count: number }>(() => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_TELEMETRY);
        return stored ? JSON.parse(stored) : { avgDuration: 5.0, count: 0 };
    } catch {
        return { avgDuration: 5.0, count: 0 };
    }
  });

  const progressValue = useMotionValue(0);
  const [scope, animate] = useAnimate();

  const [accountState, setAccountState] = useState<AccountState>(() => {
      try {
          const cached = localStorage.getItem('resonance_cached_account');
          return cached ? JSON.parse(cached) : { profile: null, balance: null, usage: [], isLoading: false, error: null };
      } catch {
          return { profile: null, balance: null, usage: [], isLoading: false, error: null };
      }
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);

  const showToast = (message: string) => { setToastMessage(message); setTimeout(() => setToastMessage(null), 3000); };

  const fetchAccount = useCallback(async () => {
      const data = await getAccountDetails(globalSettings.apiKey);
      setAccountState(data);
      localStorage.setItem('resonance_cached_account', JSON.stringify(data));
  }, [globalSettings.apiKey]);

  useEffect(() => {
      fetchAccount(); 
  }, [fetchAccount]);

  const isActuallyRendering = useMemo(() => isProcessing || pendingImages.size > 0, [isProcessing, pendingImages]);

  useEffect(() => {
    if (isProcessing) {
        animate(progressValue, 0.85, { 
            duration: telemetry.avgDuration, 
            ease: "easeOut" 
        });
    } else if (pendingImages.size > 0) {
        // Continue crawl
    } else {
        if (progressValue.get() > 0) {
            animate(progressValue, 1, { duration: 0.4, ease: "circIn" }).then(() => {
                setTimeout(() => animate(progressValue, 0, { duration: 0.2 }), 1000);
            });
        }
    }
  }, [isProcessing, pendingImages.size, telemetry.avgDuration, animate, progressValue]);

  useEffect(() => {
      if (isActuallyRendering) {
          if (!timerRef.current) {
            setRenderTime(0);
            timerRef.current = setInterval(() => setRenderTime(prev => prev + 0.1), 100);
          }
      } else {
          if (renderTime > 1.0) {
            setTelemetry(prev => {
                const nextCount = prev.count + 1;
                const nextAvg = (prev.avgDuration * prev.count + renderTime) / nextCount;
                const nextData = { avgDuration: nextAvg, count: nextCount };
                localStorage.setItem(STORAGE_KEY_TELEMETRY, JSON.stringify(nextData));
                return nextData;
            });
          }
          clearInterval(timerRef.current);
          timerRef.current = null;
      }
      return () => {
          if (timerRef.current && !isActuallyRendering) {
              clearInterval(timerRef.current);
              timerRef.current = null;
          }
      };
  }, [isActuallyRendering]);

  const handleImageLoaded = useCallback((id: string) => {
      setPendingImages(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
      });
  }, []);

  useEffect(() => {
      if (pendingImages.size === 0 && !isProcessing && renderTime > 0) {
          fetchAccount();
      }
  }, [pendingImages.size, isProcessing, fetchAccount, renderTime]);

  const handleGenerate = async () => {
    if (!sessionPrompt || isActuallyRendering) return;
    setShowSettings(false); 
    setIsProcessing(true);
    
    const batchId = crypto.randomUUID();
    const scale = localSettings.quality === 'hd' ? 2 : 1;
    const activeStyleObjects = MODEL_STYLES.filter(s => localSettings.activeStyles.includes(s.id) && s.id !== 'none');
    const styleSuffix = activeStyleObjects.map(s => s.suffix).join('');
    const promptWithStyles = `${sessionPrompt}${styleSuffix}${activeStyleObjects.length > 0 ? ', ultra detailed, 8k' : ''}`;

    const newBatch: HistoryItem[] = [];
    const pendingIds = new Set<string>();

    for (let i = 0; i < localSettings.imageCount; i++) {
        const id = Date.now().toString() + i;
        const seed = localSettings.seed || getRandomSeed() + i;
        const params = { prompt: promptWithStyles, model: 'zimage', width: localSettings.width * scale, height: localSettings.height * scale, seed, enhance: localSettings.enhance, nologo: true, negative_prompt: localSettings.negativePrompt || SILENT_NEGATIVE, safe: true, private: true };
        const item: HistoryItem = { ...params, id, batchId, timestamp: Date.now(), url: generateImageUrl(params), prompt: sessionPrompt };
        newBatch.push(item);
        pendingIds.add(id);
        onAddToHistory(item);
    }
    
    setPendingImages(pendingIds);
    setSessionImages(prev => [...prev, ...newBatch]);
    
    setTimeout(() => {
        setIsProcessing(false);
    }, 1500); 

    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 300);
  };

  const handleClearBatch = (batchId: string) => {
    setSessionImages(prev => prev.filter(img => img.batchId !== batchId));
    showToast("Batch Excised");
  };

  const updateLocalSetting = (key: keyof AppSettings, value: any) => {
      setLocalSettings(prev => ({ ...prev, [key]: value }));
      updateSettings?.({ [key]: value });
  };

  const groupedImages = useMemo(() => {
      const groups: { batchId: string, prompt: string, items: HistoryItem[] }[] = [];
      sessionImages.forEach(img => {
          const group = groups.find(g => g.batchId === img.batchId);
          if (group) group.items.push(img);
          else groups.push({ batchId: img.batchId || 'default', prompt: img.prompt, items: [img] });
      });
      return groups;
  }, [sessionImages]);

  // FIX: Adaptive Island sizing. Use a percentage of screen on mobile (wider) and max-width on desktop.
  // calc(100vw - 32px) ensures it spans the width with small padding on mobile.
  // min(..., 600px) ensures it doesn't get ridiculously wide on desktop.
  const islandWidth = isIslandExpanded ? "min(calc(100vw - 32px), 600px)" : (isActuallyRendering ? 280 : 200);
  const islandHeight = isIslandExpanded ? "auto" : 44;
  const islandRadius = isIslandExpanded ? 40 : 22;

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-black font-display px-safe">
      
      <AnimatePresence>
          {isIslandExpanded && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="fixed inset-0 z-[199] bg-black/40 backdrop-blur-sm" 
                onClick={() => setIsIslandExpanded(false)} 
              />
          )}
      </AnimatePresence>

      <div className="fixed top-8 left-0 right-0 z-[200] flex flex-col items-center pointer-events-none px-4">
          <motion.div 
            layout 
            animate={{ 
                width: islandWidth,
                height: islandHeight,
                borderRadius: islandRadius
            }} 
            transition={{ type: "spring", ...SPRING_CONFIG }} 
            className="relative pointer-events-auto bg-black/85 backdrop-blur-[60px] border-[0.5px] border-white/20 shadow-liquid overflow-hidden cursor-pointer flex flex-col items-center mb-4" 
            onClick={() => !isActuallyRendering && setIsIslandExpanded(!isIslandExpanded)}
          >
              <AnimatePresence>
                {isActuallyRendering && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-0 pointer-events-none"
                    >
                        <svg className="w-full h-full" style={{ overflow: 'visible' }}>
                            <motion.rect
                                x="1"
                                y="1"
                                width="calc(100% - 2px)"
                                height="calc(100% - 2px)"
                                rx={islandRadius}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="1.5"
                                style={{
                                    pathLength: progressValue,
                                    filter: 'drop-shadow(0 0 3px rgba(59,130,246,0.6))'
                                }}
                            />
                        </svg>
                    </motion.div>
                )}
              </AnimatePresence>

              <div className="relative z-10 w-full flex flex-col items-center">
                {!isIslandExpanded ? (
                    <div className="flex items-center justify-center w-full h-[44px] px-6 gap-3">
                        {isActuallyRendering ? (
                            <div className="flex items-center gap-4 w-full justify-center">
                                <div className="flex items-center gap-2">
                                    <div className="size-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Rendering</span>
                                </div>
                                <div className="w-[0.5px] h-3 bg-white/20" />
                                <div className="flex items-center gap-2 text-white/80">
                                    <Clock size={12} className="opacity-40"/>
                                    <span className="text-[10px] font-mono font-black">{renderTime.toFixed(1)}s</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2">
                                    <div className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                                    <span className="text-[10px] font-bold font-mono text-primary tracking-tight">
                                        {formatPollen(accountState.balance)}
                                    </span>
                                </div>
                                <div className="w-[0.5px] h-3 bg-white/20" />
                                <span className="text-[10px] font-bold font-mono text-white/40 tracking-tight">
                                    ~{getEstimatedImagesLeft(accountState.balance)}
                                </span>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="w-full p-8 flex flex-col gap-6">
                        <div className="flex justify-between items-center pb-2">
                            <h3 className="text-[11px] font-black uppercase text-white tracking-[0.3em]">Neural Core</h3>
                            <Zap size={14} className="text-white/20" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-3xl p-5 border border-white/5 flex flex-col items-center">
                                <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Credits</p>
                                <p className="text-sm font-mono font-bold text-primary">{formatPollen(accountState.balance)}</p>
                            </div>
                            <div className="bg-white/5 rounded-3xl p-5 border border-white/5 flex flex-col items-center">
                                <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Status</p>
                                <p className="text-sm font-mono font-bold text-white/80">Active</p>
                            </div>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setSessionImages([]); setIsIslandExpanded(false); showToast("Feed Purged"); }} 
                            className="w-full h-14 rounded-[1.5rem] bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.3em] active:scale-95 transition-all"
                        >
                            Clear Session Feed
                        </button>
                    </div>
                )}
              </div>
          </motion.div>
      </div>

      <div className="fixed top-8 left-0 right-0 px-6 z-[100] flex justify-between pointer-events-none">
          <button onClick={() => onNavigate(AppRoute.PREFERENCES)} className="pointer-events-auto size-11 rounded-full glass-panel flex items-center justify-center text-white/40 border-white/10 shadow-liquid active:scale-90 transition-all">
              <Settings size={20} strokeWidth={1.5} />
          </button>
          <button onClick={() => onNavigate(AppRoute.HISTORY)} className="pointer-events-auto size-11 rounded-full glass-panel flex items-center justify-center text-white/40 border-white/10 shadow-liquid active:scale-90 transition-all">
              <LayoutGrid size={20} strokeWidth={1.5} />
          </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar relative px-6 pb-[32vh] pt-44">
          <div className="flex flex-col items-center gap-20">
              {groupedImages.length === 0 && !isActuallyRendering ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, rotateX: 20 }} 
                    animate={{ opacity: 1, scale: 1, rotateX: 0 }} 
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center py-28 perspective-1000"
                  >
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="size-20 rounded-[2rem] bg-white/[0.04] border-[0.5px] border-white/10 flex items-center justify-center mb-10 mx-auto shadow-liquid backdrop-blur-3xl animate-liquid-pulse"
                      >
                        <Wand2 size={32} className="text-white/40" strokeWidth={1} />
                      </motion.div>
                      <motion.h2 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-7xl font-black logo-text liquid-text tracking-tighter"
                      >
                        RESONANCE
                      </motion.h2>
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-[10px] text-white/20 font-black uppercase tracking-[0.8em] mt-8"
                      >
                        Neural Architecture V4
                      </motion.p>
                  </motion.div>
              ) : (
                  <div className="w-full flex flex-col items-center gap-28">
                      {groupedImages.map((group) => (
                          <div key={group.batchId} className="w-full flex flex-col items-center gap-10">
                              <PromptHeader prompt={group.prompt} batchId={group.batchId} onClearBatch={handleClearBatch} />
                              <div className="w-full flex flex-col items-center gap-16">
                                  {group.items.map((item, idx) => (
                                    <GenerationCard 
                                      key={item.id} 
                                      item={item} 
                                      index={idx} 
                                      visualSafety={localSettings.visualSafety} 
                                      onImageReady={handleImageLoaded}
                                    />
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      </div>

      <div className="fixed bottom-10 left-0 right-0 px-2 sm:px-4 z-50 pointer-events-none flex justify-center">
          <div className="w-full max-w-3xl pointer-events-auto">
              <motion.div 
                  layout 
                  transition={{ type: "spring", ...SPRING_CONFIG }} 
                  className={`glass-panel overflow-hidden shadow-liquid w-full ${showSettings ? 'rounded-[3rem]' : 'rounded-[2rem]'}`}
              >
                  <div className="flex flex-col">
                      <div className="flex items-end gap-3 p-3">
                          <button onClick={() => setShowSettings(!showSettings)} className={`size-12 rounded-[1.2rem] flex items-center justify-center transition-all shrink-0 ${showSettings ? 'bg-white text-black' : 'text-white/20 hover:bg-white/5'}`}>
                              <ChevronDown size={20} className={showSettings ? '' : 'rotate-180'} />
                          </button>
                          
                          <div className="flex-1 flex flex-col gap-2 py-1">
                              {isInputExpanded ? (
                                  <textarea value={sessionPrompt} onChange={(e) => setSessionPrompt(e.target.value)} className="w-full bg-transparent border-none text-white text-base focus:ring-0 placeholder:text-white/10 min-h-[140px] max-h-[300px] resize-none py-2 px-1" placeholder="Architect your reality..." />
                              ) : (
                                  <input value={sessionPrompt} onChange={(e) => setSessionPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenerate()} className="w-full bg-transparent border-none text-white text-base focus:ring-0 placeholder:text-white/10 h-10 px-1" placeholder="Seed your imagination..." />
                              )}
                          </div>

                          <div className="flex gap-2 shrink-0 mb-0.5">
                              {sessionPrompt && (
                                  <button onClick={() => setSessionPrompt('')} title="Clear Prompt" className="size-11 rounded-full flex items-center justify-center text-white/10 hover:text-white/40 transition-all"><Eraser size={18} /></button>
                              )}
                              <button onClick={() => setIsInputExpanded(!isInputExpanded)} className={`size-11 rounded-full flex items-center justify-center transition-all ${isInputExpanded ? 'text-primary' : 'text-white/10 hover:text-white/40'}`}>
                                  {isInputExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                              </button>
                              <button onClick={handleGenerate} disabled={!sessionPrompt || isActuallyRendering} className={`size-12 rounded-[1.2rem] flex items-center justify-center transition-all ${!sessionPrompt ? 'bg-white/5 text-white/5' : 'bg-primary text-white shadow-glow active:scale-90'}`}>
                                  <ArrowUp size={22} />
                              </button>
                          </div>
                      </div>
                      <AnimatePresence>
                          {showSettings && (
                              <motion.div 
                                  initial={{ height: 0, opacity: 0 }} 
                                  animate={{ height: 'auto', opacity: 1 }} 
                                  exit={{ height: 0, opacity: 0 }} 
                                  className="border-t-[0.5px] border-white/10 bg-black/40 overflow-hidden"
                              >
                                  <SettingsPill 
                                      localSettings={localSettings} 
                                      updateLocalSetting={updateLocalSetting} 
                                      setAspectRatio={(w, h) => { updateLocalSetting('width', w); updateLocalSetting('height', h); }} 
                                  />
                              </motion.div>
                          )}
                      </AnimatePresence>
                  </div>
              </motion.div>
          </div>
      </div>

      <AnimatePresence>{toastMessage && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-36 left-1/2 -translate-x-1/2 px-8 py-3 rounded-full glass-panel border-white/20 text-[10px] font-black uppercase tracking-widest">{toastMessage}</motion.div>}</AnimatePresence>
    </div>
  );
};

export default ImageGenerator;