import React, { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useAnimate } from 'framer-motion';
import { 
    Settings, LayoutGrid, Shuffle, Eraser, Maximize2, Minimize2, 
    Trash2, EyeOff, Wand2, Zap, ArrowUp, ChevronDown, 
    Check, ShieldCheck, XCircle, Hash, Clock, AlertTriangle, RefreshCw, Layers, Heart,
    Sparkles, Loader2, Camera, Plus, X, LogIn, LogOut, User, Globe, Download, Share2
} from 'lucide-react';
import { generateImageUrl, getRandomSeed, getAccountDetails, getEstimatedImagesLeft, getEffectiveKey } from '../services/pollinations';
import { AppRoute, AppSettings, HistoryItem, ASPECT_RATIOS, AccountState, AVAILABLE_MODELS, CustomStyle } from '../types';
import { addLog } from '../services/logger';
import { enhancePrompt } from '../services/ai';
import { supabase } from '../services/supabase';
import { storage } from '../services/storage';

const SILENT_NEGATIVE = "nsfw, naked, nude, porn, sex, explicit, genitals, nipples, topless, breasts, bad anatomy, deformed, ugly, watermark, logo";
const SPRING_CONFIG = { stiffness: 400, damping: 30 };
const LIQUID_SPRING = { stiffness: 260, damping: 20, mass: 1 };
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
  styles: CustomStyle[];
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
                    className="flex-1 flex items-center gap-3 px-6 py-4 rounded-[1.8rem] glass-panel backdrop-blur-xl cursor-pointer hover:bg-white/5 transition-all overflow-hidden shadow-sm"
                >
                    <Camera size={14} className="text-primary shrink-0" />
                    <p className={`text-xs font-medium text-white/70 tracking-tight leading-relaxed ${isExpanded ? '' : 'truncate'}`}>
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

const GenerationCard = memo(({ item, index, visualSafety, onImageReady, onNavigate, showToast }: { item: HistoryItem, index: number, visualSafety: boolean, onImageReady?: (id: string) => void, onNavigate: (route: AppRoute) => void, showToast: (msg: string) => void }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [visualRisk, setVisualRisk] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  // Delay the "Synthesizing" overlay to prevent flickering on fast loads
  useEffect(() => {
      if (!isLoaded) {
          const timer = setTimeout(() => setShowOverlay(true), 600);
          return () => clearTimeout(timer);
      } else {
          setShowOverlay(false);
      }
  }, [isLoaded]);
  
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

  const handleImageError = async () => {
      setHasError(true);
      setIsLoaded(true); 
      if (onImageReady) onImageReady(item.id);

      addLog('warn', 'Image element reported error', { id: item.id });
      
      try {
          // Perform a diagnostic fetch to see WHY it failed
          const res = await fetch(item.url);
          if (!res.ok) {
              const text = await res.text();
              let errorMsg = `Generation Failed: ${res.status}`;
              
              // Specific error handling based on Pollinations API codes
              if (res.status === 400) {
                  errorMsg = "Bad Request: Invalid parameters or malformed prompt.";
              } else if (res.status === 401) {
                  errorMsg = "Unauthorized: Invalid or missing API key.";
              } else if (res.status === 402) {
                  errorMsg = "Out of Pollen: Please top up at checkout.pollinations.ai";
              } else if (res.status === 403) {
                  errorMsg = "Forbidden: You don't have permission for this model.";
              } else if (res.status === 404) {
                  errorMsg = "Not Found: The requested endpoint does not exist.";
              } else if (res.status === 422) {
                  errorMsg = "Unprocessable: Required fields are missing or invalid.";
              } else if (res.status === 429) {
                  const retryAfter = res.headers.get('retry-after');
                  errorMsg = `Rate Limited: Please slow down.${retryAfter ? ` Retry in ${retryAfter}s.` : ''}`;
              } else if (res.status === 502) {
                  errorMsg = "Provider Error: Upstream AI service is unavailable.";
              } else if (res.status === 500 || res.status === 503) {
                  errorMsg = "Server Error: Pollinations is temporarily overloaded.";
              }

              addLog('error', errorMsg, { 
                  status: res.status,
                  statusText: res.statusText,
                  response: text.substring(0, 200),
                  url: item.url 
              });
              
              // If it's a 402 or 429, we might want to show a toast
              if (res.status === 402 || res.status === 429) {
                  showToast(errorMsg);
              }
          } else {
             // If fetch succeeds but img tag failed, it might be a content-type issue or decoding error
             const blob = await res.blob();
             addLog('warn', 'Image fetch succeeded but render failed', { 
                 type: blob.type, 
                 size: blob.size,
                 url: item.url 
             });
          }
      } catch (e: any) {
          addLog('error', 'Diagnostic fetch failed (Network Error)', { message: e.message, url: item.url });
      }
  };

  const retry = () => {
      setHasError(false);
      setIsLoaded(false);
      // Force reload by appending timestamp
      const urlObj = new URL(item.url);
      urlObj.searchParams.set('retry', Date.now().toString());
      
      // Fallback: If zimage failed, try flux
      if (urlObj.searchParams.get('model') === 'zimage') {
          urlObj.searchParams.set('model', 'flux');
          addLog('warn', 'Z-Image failed, retrying with Flux fallback', { id: item.id });
      }
      
      item.url = urlObj.toString();
      addLog('info', 'Retrying generation', { id: item.id });
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!supabase) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        alert("Login to share");
        return;
    }

    const { error } = await supabase
        .from('generations')
        .update({ is_public: true })
        .eq('url', item.url)
        .eq('user_id', session.user.id);

    if (error) alert("Share failed");
    else alert("Shared to Community!");
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
        const response = await fetch(item.url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `resonance-${item.width}x${item.height}-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
        window.open(item.url, '_blank');
    }
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
      initial={{ opacity: 0, scale: 0.8, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={LIQUID_SPRING}
      className={`relative shrink-0 overflow-hidden bg-white/[0.02] border-[0.5px] border-white/10 shadow-liquid rounded-[2.5rem] flex items-center justify-center group/card w-full max-w-3xl will-change-transform ${!isLoaded ? 'bg-white/[0.03]' : ''}`}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', aspectRatio: `${item.width}/${item.height}` }}
    >
      {/* Skeleton Shimmer Layer - Always visible until loaded */}
      {!isLoaded && (
          <div className="absolute inset-0 z-10 overflow-hidden bg-black/20">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent -translate-x-full animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
              <div className="absolute inset-0 flex flex-col p-10 gap-6">
                  <div className="w-1/2 h-5 bg-white/10 rounded-full animate-pulse" />
                  <div className="w-3/4 h-4 bg-white/10 rounded-full animate-pulse delay-150" />
                  <div className="mt-auto flex justify-between items-end">
                      <div className="flex flex-col gap-3">
                          <div className="w-32 h-3 bg-white/5 rounded-full animate-pulse" />
                          <div className="w-24 h-3 bg-white/5 rounded-full animate-pulse delay-75" />
                      </div>
                      <div className="size-14 rounded-3xl bg-white/10 animate-pulse" />
                  </div>
              </div>
          </div>
      )}

      {!hasError ? (
          <img 
            src={item.url} 
            alt="vision"
            className={`w-full h-full object-cover transition-all duration-500 ease-out ${isLoaded && !isAuditing ? 'opacity-100' : 'opacity-0'} ${(visualRisk && !revealed) ? 'blur-[80px] saturate-50 brightness-50' : 'blur-0'}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
      ) : (
          <div className="flex flex-col items-center justify-center gap-4 text-white/30 p-8 text-center">
              <AlertTriangle size={32} className="text-red-400" />
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">Generation Failed</p>
                <button 
                    onClick={() => onNavigate(AppRoute.PREFERENCES)}
                    className="text-[9px] font-mono text-white/40 max-w-[200px] break-words hover:text-white/60 underline underline-offset-2"
                >
                    Check logs for details
                </button>
              </div>
              <button onClick={retry} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-[9px] font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
                  <RefreshCw size={12} /> Retry
              </button>
          </div>
      )}
      
      {isLoaded && !isAuditing && !hasError && (!visualRisk || revealed) && (
        <div className="absolute bottom-6 right-6 flex gap-2 opacity-0 group-hover/card:opacity-100 transition-all translate-y-2 group-hover/card:translate-y-0 z-30">
           <button 
               onClick={handleDownload}
               className="size-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/60 transition-all active:scale-90"
           >
               <Download size={16} />
           </button>
           <button 
               onClick={handleShare}
               className="size-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/60 transition-all active:scale-90"
           >
               <Share2 size={16} />
           </button>
        </div>
      )}

      {(!isLoaded || isAuditing) && !hasError && showOverlay && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm overflow-hidden z-20"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 animate-pulse" />
          <div className="relative flex flex-col items-center gap-6">
              <div className="relative">
                  <div className="size-12 rounded-full border-2 border-white/5 border-t-primary animate-spin" />
                  <div className="absolute inset-0 size-12 rounded-full border border-primary/20 animate-ping" />
              </div>
              <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] animate-pulse">
                      {isAuditing ? 'Auditing Matrix' : 'Synthesizing'}
                  </span>
                  <div className="w-24 h-[1px] bg-white/10 relative overflow-hidden">
                      <motion.div 
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/40 to-transparent"
                      />
                  </div>
              </div>
          </div>
        </motion.div>
      )}
      {visualRisk && !revealed && isLoaded && !isAuditing && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-20 bg-black/80 backdrop-blur-3xl">
          <EyeOff className="text-white/10 mb-6" strokeWidth={1} size={54} />
          <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.4em] mb-10">Neural Filter Active</p>
          <button onClick={() => setRevealed(true)} className="px-12 py-5 rounded-full bg-white text-black text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-glow">Reveal</button>
        </div>
      )}
    </motion.div>
  );
});

const NeuralMesh = memo(({ meshData, visibleStylesCount }: { meshData: any, visibleStylesCount: number }) => {
    if (!meshData) return null;
    return (
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
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
                {meshData.points.map((x: number, i: number) => (
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
    );
});

const SettingsPill = memo(({ localSettings, updateLocalSetting, setAspectRatio, styles }: { 
    localSettings: AppSettings, updateLocalSetting: (k: keyof AppSettings, v: any) => void, setAspectRatio: (w: number, h: number) => void, styles: CustomStyle[]
}) => {
    // Get effective key for previews
    const effectiveKey = useMemo(() => getEffectiveKey(localSettings.apiKey), [localSettings.apiKey]);

    const toggleStyle = (id: string) => {
        if (id === 'none') {
            updateLocalSetting('activeStyles', ['none']);
            return;
        }
        updateLocalSetting('activeStyles', [id]);
    };

    const toggleFavorite = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const favorites = localSettings.favoriteStyleIds || [];
        if (favorites.includes(id)) {
            updateLocalSetting('favoriteStyleIds', favorites.filter(fid => fid !== id));
        } else {
            updateLocalSetting('favoriteStyleIds', [...favorites, id]);
        }
    };

    // MERGE BUILT-IN AND CUSTOM STYLES
    const allStyles = useMemo(() => {
        return styles;
    }, [styles]);

    // FILTER, SORT, AND GROUP STYLES
    const visibleStyles = useMemo(() => {
        const filtered = allStyles.filter(s => !(localSettings.hiddenStyleIds || []).includes(s.id));
        
        return filtered.sort((a, b) => {
            // 1. 'none' always pinned to start
            if (a.id === 'none') return -1;
            if (b.id === 'none') return 1;

            // 2. Favorites bubble to the top
            const aFav = (localSettings.favoriteStyleIds || []).includes(a.id);
            const bFav = (localSettings.favoriteStyleIds || []).includes(b.id);
            if (aFav && !bFav) return -1;
            if (!aFav && bFav) return 1;

            // Manual Order (styleOrder) if available
            if (localSettings.styleOrder && localSettings.styleOrder.length > 0) {
                let idxA = localSettings.styleOrder.indexOf(a.id);
                let idxB = localSettings.styleOrder.indexOf(b.id);
                if (idxA === -1) idxA = 9999;
                if (idxB === -1) idxB = 9999;
                return idxA - idxB;
            }

            // Fallback to alphabetical or default
            return 0;
        });
    }, [localSettings.hiddenStyleIds, allStyles, localSettings.activeStyles, localSettings.styleOrder]);

    const activeCount = localSettings.activeStyles.filter(s => s !== 'none').length;

    const selectedIndices = useMemo(() => {
        const indices = visibleStyles
            .map((s, i) => (localSettings.activeStyles.includes(s.id) && s.id !== 'none') ? i : -1)
            .filter(i => i !== -1);
        return indices.length > 1 ? indices : [];
    }, [localSettings.activeStyles, visibleStyles]);

    const meshData = useMemo(() => {
        if (selectedIndices.length < 2) return null;
        
        const cardWidth = 128; 
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
            totalWidth: (visibleStyles.length * cardWidth) + ((visibleStyles.length - 1) * gap) + (containerPadding * 2) 
        };
    }, [selectedIndices, visibleStyles.length]);

    return (
        <div className="px-5 py-6 flex flex-col gap-6 overflow-y-auto no-scrollbar max-h-[60vh] pb-24">
            <div className="grid grid-cols-2 gap-3">
                <button onClick={() => updateLocalSetting('enhance', !localSettings.enhance)} className={`relative h-12 rounded-2xl flex items-center justify-center gap-2 transition-all border backdrop-blur-md ${localSettings.enhance ? 'bg-primary/20 border-primary/40 text-primary shadow-glow' : 'bg-white/5 border-transparent text-white/20'}`}>
                    <Wand2 size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Neural {localSettings.enhance ? 'ON' : 'OFF'}</span>
                    <span className="absolute -top-1 -right-1 bg-black/80 text-[7px] px-1.5 py-0.5 rounded-full border border-white/10 font-bold text-white/40">+~3s</span>
                    <div className="absolute -bottom-6 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <p className="text-[6px] text-white/20 uppercase font-black tracking-tighter">AI Prompt Expansion</p>
                    </div>
                </button>
                <button onClick={() => updateLocalSetting('visualSafety', !localSettings.visualSafety)} className={`h-12 rounded-2xl flex items-center justify-center gap-2 transition-all border backdrop-blur-md ${localSettings.visualSafety ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 shadow-glow' : 'bg-white/5 border-transparent text-white/20'}`}>
                    <ShieldCheck size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Audit {localSettings.visualSafety ? 'ON' : 'OFF'}</span>
                </button>
            </div>

            <div className="space-y-3">
                <p className="text-[8px] text-white/40 font-black uppercase tracking-[0.2em] pl-1">Aspect Geometry</p>
                <div className="grid grid-cols-5 gap-1.5 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
                    {ASPECT_RATIOS.map(ratio => {
                        const isSelected = localSettings.width === ratio.width && localSettings.height === ratio.height;
                        return (
                            <button key={ratio.label} onClick={() => setAspectRatio(ratio.width, ratio.height)} className={`h-12 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all ${isSelected ? 'bg-white/20 text-white shadow-lg' : 'text-white/30 hover:text-white/50'}`}>
                                <RatioIcon width={ratio.width} height={ratio.height} isSelected={isSelected} />
                                <span className="text-[7px] font-black">{ratio.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-3">
                <p className="text-[8px] text-white/40 font-black uppercase tracking-[0.2em] pl-1">Batch Capacity</p>
                <div className="grid grid-cols-4 gap-1.5 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
                    {[1, 2, 4, 8].map(n => (
                        <button key={n} onClick={() => updateLocalSetting('imageCount', n)} className={`h-12 rounded-xl text-[9px] font-black transition-all ${localSettings.imageCount === n ? 'bg-primary text-white shadow-glow' : 'text-white/30 hover:text-white/50'}`}>{n}x</button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <p className="text-[8px] text-white/40 font-black uppercase tracking-[0.2em] pl-1">Neural Model</p>
                <div className="grid grid-cols-3 gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
                    {AVAILABLE_MODELS.map(m => (
                        <button 
                            key={m.id} 
                            onClick={() => updateLocalSetting('model', m.id)} 
                            className={`h-12 rounded-xl text-[8px] font-black transition-all flex flex-col items-center justify-center gap-1 ${localSettings.model === m.id ? 'bg-primary text-white shadow-glow' : 'text-white/30 hover:text-white/50'}`}
                        >
                            {m.id === 'zimage' ? <Zap size={10} /> : <Sparkles size={10} />}
                            <span className="truncate w-full px-1">{m.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between pr-4">
                    <p className="text-[8px] text-white/20 font-black uppercase tracking-[0.2em] pl-1">Style Matrix</p>
                    {activeCount > 1 && (
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest animate-pulse flex items-center gap-1">
                             <Layers size={10} /> {activeCount} BLEND ACTIVE
                        </span>
                    )}
                </div>
                <div className="relative -mx-5 px-5">
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-24 relative z-10">
                        {visibleStyles.map(style => {
                            const isSelected = localSettings.activeStyles.includes(style.id);
                            const isFavorite = (localSettings.favoriteStyleIds || []).includes(style.id);
                            // Append API key to preview images. Check if custom style image already has params, if so, append key.
                            // Custom styles usually have static URLs we generated, but appending key doesn't hurt.
                            const separator = style.image.includes('?') ? '&' : '?';
                            let previewUrl = `${style.image}${separator}key=${effectiveKey}`;
                            
                            // For 'none' style, use the current model for the preview
                            if (style.id === 'none') {
                                previewUrl = `https://gen.pollinations.ai/image/Clean%20minimalist%20void?model=${localSettings.model}&width=256&height=384&nologo=true&seed=0&safe=true&key=${effectiveKey}`;
                            }

                            const effectiveModelId = style.id === 'none' ? localSettings.model : style.modelId;

                            return (
                                <motion.div 
                                    layout
                                    key={style.id} 
                                    onClick={() => toggleStyle(style.id)} 
                                    className={`relative shrink-0 w-32 h-48 rounded-[2rem] overflow-hidden border transition-all duration-500 cursor-pointer ${isSelected ? 'border-primary shadow-[0_4px_30px_rgba(59,130,246,0.4)] scale-105 z-10' : 'border-white/10 hover:border-white/20'}`}
                                >
                                    <img src={previewUrl} alt={style.label} className="w-full h-full object-cover" loading="lazy" />
                                    
                                    {/* Like Button at Top Left */}
                                    {style.id !== 'none' && (
                                        <button 
                                            onClick={(e) => toggleFavorite(e, style.id)}
                                            className={`absolute top-3 left-3 size-7 rounded-full flex items-center justify-center transition-all z-30 ${isFavorite ? 'bg-red-500 text-white shadow-glow' : 'bg-black/40 backdrop-blur-md border border-white/10 text-white/40 hover:text-white'}`}
                                        >
                                            <Heart size={12} fill={isFavorite ? "currentColor" : "none"} />
                                        </button>
                                    )}

                                    {/* Model Pill moved to Top Right */}
                                    {effectiveModelId && (
                                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 z-20">
                                            <p className="text-[7px] font-black uppercase tracking-widest text-white/60">{effectiveModelId}</p>
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                                        <p className={`text-[10px] font-black uppercase tracking-tighter text-center leading-tight ${isSelected ? 'text-primary' : 'text-white/80'}`}>{style.label}</p>
                                    </div>
                                    
                                    {isSelected && style.id !== 'none' && (
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-12 bg-primary/20 blur-2xl pointer-events-none" />
                                    )}
                                </motion.div>
                            );
                        })}
                        
                        <AnimatePresence>
                            <NeuralMesh meshData={meshData} visibleStylesCount={visibleStyles.length} />
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em] pl-1">Seed Override</p>
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <input type="number" value={localSettings.seed || ''} onChange={(e) => updateLocalSetting('seed', parseInt(e.target.value) || 0)} placeholder="Random (Auto)" className="w-full h-16 bg-white/5 border border-white/10 rounded-[1.5rem] px-6 text-[11px] font-mono text-white focus:ring-1 focus:ring-primary/40 placeholder:text-white/10" />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            {localSettings.seed !== 0 && (
                                <button onClick={() => updateLocalSetting('seed', 0)} className="p-2 text-white/20 hover:text-white/60 transition-colors">
                                    <X size={14} />
                                </button>
                            )}
                            <Hash size={14} className="text-white/10" />
                        </div>
                    </div>
                    <button onClick={() => updateLocalSetting('seed', getRandomSeed())} className="size-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-90"><Shuffle size={18} /></button>
                </div>
            </div>

            <div className="glass-panel p-6 rounded-[2.5rem] flex flex-col gap-5">
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
    settings: globalSettings, styles, onNavigate, onAddToHistory, updateSettings, sessionPrompt, setSessionPrompt, sessionImages, setSessionImages
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [localSettings, setLocalSettings] = useState({ ...globalSettings });
  const [showSettings, setShowSettings] = useState(false);
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [showPromptTools, setShowPromptTools] = useState(false);
  const [renderTime, setRenderTime] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<Set<string>>(new Set());
  const [batchTotal, setBatchTotal] = useState(0);

  const [telemetry, setTelemetry] = useState<Record<string, { avgDuration: number; count: number }>>({
    zimage: { avgDuration: 1.5, count: 0 },
    flux: { avgDuration: 8.0, count: 0 },
    'flux-2-dev': { avgDuration: 12.0, count: 0 }
  });

  const [selectedImage, setSelectedImage] = useState<HistoryItem | null>(null);

  const isActuallyRendering = useMemo(() => pendingImages.size > 0, [pendingImages]);

  const currentModelTelemetry = useMemo(() => telemetry[localSettings.model] || { avgDuration: 8.0, count: 0 }, [telemetry, localSettings.model]);
  // FIX: Adaptive timer should estimate based on parallel loading, not sequential.
  // We add a small 10% buffer per additional image for overhead.
  const totalEstimatedTime = useMemo(() => {
      const base = currentModelTelemetry.avgDuration;
      // Parallel overhead: 0.8s per extra image as network/processing overhead
      const overhead = Math.max(0, (localSettings.imageCount - 1) * 0.8); 
      return Math.max(2, base + overhead);
  }, [currentModelTelemetry.avgDuration, localSettings.imageCount]);
  
  // Adaptive: if images are finishing faster, we nudge the timer
  const adaptiveRemainingTime = useMemo(() => {
      const baseRemaining = Math.max(0.1, totalEstimatedTime - renderTime);
      if (batchTotal > 0 && pendingImages.size > 0) {
          // Weight the remaining time by the percentage of images left
          const ratioLeft = pendingImages.size / batchTotal;
          return Math.max(0.1, baseRemaining * ratioLeft + (ratioLeft * 2));
      }
      return baseRemaining;
  }, [totalEstimatedTime, renderTime, pendingImages.size, batchTotal]);
  
  const progressMotionValue = useMotionValue(0);
  useEffect(() => {
      // Ensure a minimum progress of 0.05 so the circle is always visible during rendering
      const progress = isActuallyRendering ? Math.max(0.05, Math.min(1, renderTime / totalEstimatedTime)) : 0;
      progressMotionValue.set(progress);
  }, [isActuallyRendering, renderTime, totalEstimatedTime, progressMotionValue]);
  
  const progressValue = useSpring(progressMotionValue, { stiffness: 40, damping: 15 });

  const [scope, animate] = useAnimate();

  const [accountState, setAccountState] = useState<AccountState>({ profile: null, balance: null, usage: [], isLoading: false, error: null, user: null });

  // Load telemetry and account cache from IndexedDB
  useEffect(() => {
    const loadCache = async () => {
      try {
        const storedTelemetry = await storage.get<any>(STORAGE_KEY_TELEMETRY);
        if (storedTelemetry) {
          // Migration/Safety check: if it's the old format (single object), reset to default
          if (storedTelemetry.avgDuration !== undefined) {
            setTelemetry({
              zimage: { avgDuration: 1.5, count: 0 },
              flux: { avgDuration: 8.0, count: 0 },
              'flux-2-dev': { avgDuration: 12.0, count: 0 }
            });
          } else {
            setTelemetry(storedTelemetry);
          }
        }

        const cachedAccount = await storage.get<any>('resonance_cached_account');
        if (cachedAccount) {
          setAccountState(prev => ({ ...prev, ...cachedAccount }));
        }
      } catch (e) {
        console.error('Cache Load Error:', e);
      }
    };
    loadCache();
  }, []);

  // Sync Supabase user to account state
  useEffect(() => {
      if (!supabase) return;
      supabase.auth.getSession().then(({ data: { session } }) => {
          setAccountState(prev => ({ ...prev, user: session?.user ?? null }));
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setAccountState(prev => ({ ...prev, user: session?.user ?? null }));
      });
      return () => subscription.unsubscribe();
  }, []);

  const getRedirectUrl = () => {
      const envUrl = (import.meta as any).env.VITE_APP_URL;
      if (envUrl) return envUrl;
      return window.location.origin;
  };

  const handleLogin = async () => {
      if (!supabase) {
          showToast("Supabase not configured");
          return;
      }
      const { error } = await supabase.auth.signInWithOAuth({
          provider: 'github',
          options: {
              redirectTo: getRedirectUrl()
          }
      });
      if (error) showToast(error.message);
  };

  const handleLogout = async () => {
      if (!supabase) return;
      await supabase.auth.signOut();
      showToast("Logged out");
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);

  const showToast = (message: string) => { setToastMessage(message); setTimeout(() => setToastMessage(null), 3000); };

  const fetchAccount = useCallback(async () => {
      const data = await getAccountDetails(globalSettings.apiKey);
      setAccountState(prev => ({ ...prev, ...data }));
      storage.set('resonance_cached_account', data);
  }, [globalSettings.apiKey]);

  useEffect(() => {
      fetchAccount();
  }, [fetchAccount]);

  useEffect(() => {
    // Progress is now calculated directly from renderTime in the render cycle
  }, [isProcessing, pendingImages.size, telemetry.avgDuration, animate, progressValue]);

  useEffect(() => {
      if (isActuallyRendering) {
          if (!timerRef.current) {
            setRenderTime(0);
            timerRef.current = setInterval(() => setRenderTime(prev => prev + 0.1), 100);
          }
      } else {
          if (renderTime > 1.0) {
            const model = localSettings.model;
            setTelemetry(prev => {
                const current = prev[model] || { avgDuration: 8.0, count: 0 };
                const nextCount = current.count + 1;
                const nextAvg = (current.avgDuration * current.count + renderTime) / nextCount;
                const nextData = { ...prev, [model]: { avgDuration: nextAvg, count: nextCount } };
                storage.set(STORAGE_KEY_TELEMETRY, nextData);
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

      // Update telemetry per image for better accuracy
      const item = sessionImages.find(img => img.id === id);
      if (item && item.startTime) {
          const duration = (Date.now() - item.startTime) / 1000;
          const model = item.model;
          // Only count if under 30s to keep average realistic
          if (duration > 0.2 && duration < 30) {
              setTelemetry(prev => {
                  const current = prev[model] || { avgDuration: 8.0, count: 0 };
                  const nextCount = current.count + 1;
                  const nextAvg = (current.avgDuration * current.count + duration) / nextCount;
                  const nextData = { ...prev, [model]: { avgDuration: nextAvg, count: nextCount } };
                  storage.set(STORAGE_KEY_TELEMETRY, nextData);
                  return nextData;
              });
          }
      }
  }, [sessionImages]);

  useEffect(() => {
      if (pendingImages.size === 0 && !isProcessing && renderTime > 0) {
          fetchAccount();
      }
  }, [pendingImages.size, isProcessing, fetchAccount, renderTime]);

  const handleEnhance = async () => {
      if (!sessionPrompt || isEnhancing) return;
      setIsEnhancing(true);
      try {
          await enhancePrompt(sessionPrompt, localSettings.model, globalSettings.apiKey, (chunk) => {
              setSessionPrompt(chunk);
          });
          showToast("Prompt Enhanced");
      } catch (error: any) {
          showToast("Enhancement Failed");
      } finally {
          setIsEnhancing(false);
      }
  };

  const handleGenerate = async () => {
    if (!sessionPrompt) return;
    // setShowSettings(false); // REMOVED: Keep settings open as requested
    setIsProcessing(true);
    
    addLog('info', 'Generation Session Started', { count: localSettings.imageCount, prompt: sessionPrompt });

    const batchId = crypto.randomUUID();
    
    // RESOLUTION LOGIC: Optimized for Pollinations v2.36MP limit
    const MAX_PIXELS = 2359296;
    let targetWidth = localSettings.width;
    let targetHeight = localSettings.height;

    // If quality is low, we downscale to roughly 480p/720p equivalent
    if (localSettings.quality !== 'hd') {
        targetWidth = Math.round(targetWidth * 0.5);
        targetHeight = Math.round(targetHeight * 0.5);
    }

    // Ensure we don't exceed the 2.3MP limit
    const currentPixels = targetWidth * targetHeight;
    if (currentPixels > MAX_PIXELS) {
        const scale = Math.sqrt(MAX_PIXELS / currentPixels);
        targetWidth = Math.floor(targetWidth * scale);
        targetHeight = Math.floor(targetHeight * scale);
        addLog('warn', 'Resolution exceeded limit, downscaling', { 
            original: `${localSettings.width}x${localSettings.height}`,
            new: `${targetWidth}x${targetHeight}` 
        });
    }

    // MERGE BUILT-IN AND CUSTOM STYLES
    const allStyles = styles;
    const activeStyleObjects = allStyles.filter(s => localSettings.activeStyles.includes(s.id) && s.id !== 'none');
    
    const styleSuffix = activeStyleObjects.map(s => s.suffix).join('');
    
    // NEURAL ENHANCE: If enabled, we use our own Gemini-based enhancement before sending to Pollinations
    let basePrompt = sessionPrompt;
    if (localSettings.enhance) {
        try {
            setIsEnhancing(true);
            showToast("Neural Core Enhancing...");
            basePrompt = await enhancePrompt(sessionPrompt, localSettings.model, globalSettings.apiKey);
            setIsEnhancing(false);
        } catch (e) {
            console.error("Neural Enhance Failed, falling back to original prompt", e);
            setIsEnhancing(false);
        }
    }

    const promptWithStyles = `${basePrompt}${styleSuffix}${activeStyleObjects.length > 0 ? ', ultra detailed, 8k' : ''}`;

    const now = Date.now();

    setBatchTotal(localSettings.imageCount);
    setPendingImages(new Set()); 

    // Prepare all items first to avoid UI flickering
    const newBatch: HistoryItem[] = [];
    const pendingIds = new Set<string>();
    
    for (let i = 0; i < localSettings.imageCount; i++) {
        const id = crypto.randomUUID();
        const seed = localSettings.seed || getRandomSeed() + i;
        
        const params = { 
            prompt: promptWithStyles, 
            model: localSettings.model || 'flux', 
            width: targetWidth, 
            height: targetHeight, 
            seed, 
            enhance: false, 
            nologo: true, 
            negative_prompt: localSettings.negativePrompt || SILENT_NEGATIVE, 
            safe: true, 
            private: true, 
            apiKey: globalSettings.apiKey 
        };
        
        // generateImageUrl is async but returns immediately
        const imageUrl = await generateImageUrl(params);
        const item: HistoryItem = { 
            ...params, 
            id, 
            batchId, 
            timestamp: now, 
            startTime: now, 
            url: imageUrl, 
            prompt: sessionPrompt, 
            styleSuffix,
            styleName: activeStyleObjects.map(s => s.label).join(', ')
        };
        newBatch.push(item);
        pendingIds.add(id);
    }
    
    // Update all at once to trigger parallel rendering of GenerationCards
    setPendingImages(pendingIds);
    setSessionImages(prev => [...prev, ...newBatch]);
    
    // Add to history sequentially to maintain order
    newBatch.forEach(item => onAddToHistory(item));
    
    setIsProcessing(false);

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
  const islandWidth = isIslandExpanded ? "100%" : (isActuallyRendering ? 240 : 180);
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
                className="fixed inset-0 z-[299] bg-black/60 backdrop-blur-md" 
                onClick={() => setIsIslandExpanded(false)} 
              />
          )}
      </AnimatePresence>

      <div className="fixed top-8 left-6 z-[250] pointer-events-none">
          <button 
            onClick={() => onNavigate(AppRoute.PREFERENCES)} 
            className="pointer-events-auto size-11 rounded-full glass-panel flex items-center justify-center text-white/40 shadow-liquid active:scale-90 transition-all hover:bg-white/5"
          >
              <Settings size={20} strokeWidth={1.5} />
          </button>
      </div>

      <div className="fixed top-8 right-6 z-[250] pointer-events-none flex gap-3">
          <button 
            onClick={() => onNavigate(AppRoute.HISTORY)} 
            className="pointer-events-auto size-11 rounded-full glass-panel flex items-center justify-center text-white/40 shadow-liquid active:scale-90 transition-all hover:bg-white/5"
          >
              <LayoutGrid size={20} strokeWidth={1.5} />
          </button>
      </div>

      <div className="fixed top-8 left-0 right-0 z-[300] flex flex-col items-center pointer-events-none px-4">
          <motion.div 
            layout 
            initial={false}
            animate={{ 
                width: islandWidth,
                borderRadius: isIslandExpanded ? 32 : 100
            }}
            transition={{ 
                width: {
                    type: "spring", 
                    stiffness: 400, 
                    damping: 35, 
                    mass: 1
                },
                borderRadius: {
                    type: "spring", 
                    stiffness: 400, 
                    damping: 35, 
                    mass: 1
                },
                layout: {
                    type: "spring", 
                    stiffness: 400, 
                    damping: 35, 
                    mass: 1
                }
            }} 
            className="relative pointer-events-auto glass-card shadow-liquid overflow-hidden cursor-pointer flex flex-col items-center will-change-transform" 
            onClick={() => !isActuallyRendering && setIsIslandExpanded(!isIslandExpanded)}
          >
              <AnimatePresence>
                {isActuallyRendering && (
                    <div className="absolute inset-0 z-0 pointer-events-none" />
                )}
              </AnimatePresence>

              <div className="relative z-10 w-full flex flex-col items-center">
                <AnimatePresence mode="wait">
                    {!isIslandExpanded ? (
                        <motion.div 
                            key="collapsed"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ 
                                duration: 0.2
                            }}
                            className="flex items-center justify-center w-full h-[44px] px-6 gap-3"
                        >
                            {isActuallyRendering ? (
                                <div className="flex items-center gap-4 w-full justify-center">
                                    <div className="flex items-center gap-2">
                                        <div className="size-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">
                                            {pendingImages.size > 0 ? `BATCH ${Math.max(1, batchTotal - pendingImages.size + 1)}/${batchTotal}` : 'FINALIZING'}
                                        </span>
                                    </div>
                                    <div className="w-[0.5px] h-3 bg-white/20" />
                                    <div className="flex items-center gap-2 text-white/80">
                                        <Clock size={12} className="opacity-40"/>
                                        <span className="text-[10px] font-mono font-black">
                                            {isActuallyRendering ? `${adaptiveRemainingTime.toFixed(1)}s` : `${renderTime.toFixed(1)}s`}
                                        </span>
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
                                        ~{getEstimatedImagesLeft(accountState.balance, localSettings.model)}
                                    </span>
                                </>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="expanded"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ 
                                duration: 0.2,
                                delay: isIslandExpanded ? 0.15 : 0
                            }}
                            className="w-full p-8 flex flex-col gap-6"
                        >
                            <div className="flex justify-between items-center pb-2">
                                <h3 className="text-[11px] font-black uppercase text-white tracking-[0.3em]">Neural Core</h3>
                                <Zap size={14} className="text-white/20" />
                            </div>
                             <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 rounded-3xl p-4 border border-white/5 flex flex-col items-center">
                                    <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-1">Credits</p>
                                    <p className="text-xs font-mono font-bold text-primary">{formatPollen(accountState.balance)}</p>
                                </div>
                                <div className="bg-white/5 rounded-3xl p-4 border border-white/5 flex flex-col items-center">
                                    <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-1">Avg. Speed</p>
                                    <p className="text-xs font-mono font-bold text-white/80">{currentModelTelemetry.avgDuration.toFixed(1)}s</p>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setSessionImages([]); setIsIslandExpanded(false); showToast("Feed Purged"); }} 
                                    className="w-full h-14 rounded-[1.5rem] bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.3em] active:scale-95 transition-all"
                                >
                                    Clear Session Feed
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
              </div>
          </motion.div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar relative px-6 pb-[32vh] pt-44 will-change-transform">
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
                        Neural Architecture V5
                      </motion.p>
                  </motion.div>
              ) : (
                  <div className="w-full flex flex-col items-center gap-28">
                      <AnimatePresence mode="popLayout">
                          {groupedImages.map((group) => (
                              <motion.div 
                                  layout
                                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                  transition={LIQUID_SPRING}
                                  key={group.batchId} 
                                  className="w-full flex flex-col items-center gap-10"
                              >
                                  <PromptHeader prompt={group.prompt} batchId={group.batchId} onClearBatch={handleClearBatch} />
                                  <div className="w-full flex flex-col items-center gap-16">
                                      {group.items.map((item, idx) => (
                                        <div key={item.id} onClick={() => setSelectedImage(item)} className="cursor-pointer active:scale-[0.98] transition-transform">
                                            <GenerationCard 
                                              item={item} 
                                              index={idx} 
                                              visualSafety={localSettings.visualSafety} 
                                              onImageReady={handleImageLoaded}
                                              onNavigate={onNavigate}
                                              showToast={showToast}
                                            />
                                        </div>
                                      ))}
                                  </div>
                              </motion.div>
                          ))}
                      </AnimatePresence>
                  </div>
              )}
          </div>
      </div>

      <div className="fixed bottom-10 left-0 right-0 px-2 sm:px-4 z-50 pointer-events-none flex justify-center">
          <div className="w-full max-w-3xl pointer-events-auto">
              <motion.div 
                  layout 
                  transition={{ type: "spring", ...LIQUID_SPRING }} 
                  className={`glass-card overflow-hidden shadow-liquid w-full will-change-transform ${showSettings ? 'rounded-[2.5rem]' : 'rounded-[2rem]'}`}
              >
                  <div className="flex flex-col">
                      <div className={`flex p-2 ${isInputExpanded ? 'flex-col gap-3' : 'flex-row items-center gap-2'}`}>
                          {!isInputExpanded && (
                              <button 
                                onClick={() => setShowSettings(!showSettings)} 
                                className={`size-10 rounded-2xl flex items-center justify-center transition-all shrink-0 ${showSettings ? 'bg-white text-black shadow-glow' : 'bg-white/5 text-white/20 hover:bg-white/10'}`}
                              >
                                  <Settings size={18} className={showSettings ? 'animate-spin-slow' : ''} />
                              </button>
                          )}

                          {/* Prompt Input Area */}
                          <div className={`flex-1 bg-white/[0.08] rounded-2xl border border-white/10 flex transition-all focus-within:border-primary/50 focus-within:bg-white/[0.12] ${isInputExpanded ? 'p-5 min-h-[250px]' : 'items-center px-3 min-h-[50px] flex-row gap-2'}`}>
                              <div className="flex-1">
                                  {isInputExpanded ? (
                                      <textarea 
                                        value={sessionPrompt} 
                                        onChange={(e) => setSessionPrompt(e.target.value)} 
                                        className={`w-full bg-transparent border-none text-white text-[15px] focus:ring-0 placeholder:text-white/60 min-h-[200px] max-h-[600px] resize-none p-0 leading-relaxed transition-all ${isEnhancing ? 'animate-pulse text-primary/60' : ''}`} 
                                        placeholder="Architect your reality..." 
                                        autoFocus
                                      />
                                  ) : (
                                      <input 
                                        value={sessionPrompt} 
                                        onChange={(e) => setSessionPrompt(e.target.value)} 
                                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()} 
                                        className="w-full bg-transparent border-none text-white text-[14px] focus:ring-0 placeholder:text-white/60 h-6 p-0 font-medium" 
                                        placeholder="Seed your imagination..." 
                                      />
                                  )}
                              </div>

                              {!isInputExpanded && (
                                <div className="flex items-center gap-1">
                                    <AnimatePresence>
                                        {showPromptTools && (
                                            <motion.div 
                                              initial={{ opacity: 0, x: 20, scale: 0.8 }}
                                              animate={{ opacity: 1, x: 0, scale: 1 }}
                                              exit={{ opacity: 0, x: 20, scale: 0.8 }}
                                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                              className="flex items-center gap-1"
                                            >
                                                {sessionPrompt && (
                                                    <>
                                                        <button 
                                                            onClick={handleEnhance} 
                                                            disabled={isEnhancing}
                                                            className={`size-8 rounded-full flex items-center justify-center transition-all ${isEnhancing ? 'text-primary animate-spin' : 'text-white/20 hover:text-white/60 hover:bg-white/5'}`}
                                                        >
                                                            {isEnhancing ? <Loader2 size={14} /> : <Sparkles size={14} />}
                                                        </button>
                                                        <button 
                                                          onClick={() => setSessionPrompt('')} 
                                                          className="size-8 rounded-full flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                        >
                                                          <Eraser size={14} />
                                                        </button>
                                                    </>
                                                )}
                                                <button 
                                                  onClick={() => setIsInputExpanded(!isInputExpanded)} 
                                                  className="size-8 rounded-full flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/5 transition-all"
                                                >
                                                    <Maximize2 size={14} />
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    
                                    <button 
                                      onClick={() => setShowPromptTools(!showPromptTools)} 
                                      className={`size-8 rounded-full flex items-center justify-center transition-all ${showPromptTools ? 'bg-white/10 text-white' : 'text-white/20 hover:text-white/60 hover:bg-white/5'}`}
                                    >
                                        <motion.div
                                          animate={{ rotate: showPromptTools ? 45 : 0 }}
                                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        >
                                          <Plus size={16} />
                                        </motion.div>
                                    </button>
                                </div>
                              )}
                          </div>
 
                          {/* Bottom Controls Area */}
                          <div className={`flex items-center ${isInputExpanded ? 'justify-between px-1' : 'gap-2'}`}>
                              <div className="flex items-center gap-2">
                                  {isInputExpanded && (
                                      <button 
                                        onClick={() => setShowSettings(!showSettings)} 
                                        className={`size-10 rounded-2xl flex items-center justify-center transition-all shrink-0 ${showSettings ? 'bg-white text-black shadow-glow' : 'bg-white/5 text-white/20 hover:bg-white/10'}`}
                                      >
                                          <Settings size={18} className={showSettings ? 'animate-spin-slow' : ''} />
                                      </button>
                                  )}

                                  {isInputExpanded && (
                                      <div className="flex items-center gap-1 bg-white/[0.03] border border-white/5 rounded-2xl p-1">
                                          <button 
                                              onClick={handleEnhance} 
                                              disabled={isEnhancing}
                                              className={`size-9 rounded-xl flex items-center justify-center transition-all ${isEnhancing ? 'text-primary animate-spin' : 'text-white/20 hover:text-white/60 hover:bg-white/5'}`}
                                          >
                                              {isEnhancing ? <Loader2 size={16} /> : <Sparkles size={16} />}
                                          </button>
                                          <button 
                                            onClick={() => setSessionPrompt('')} 
                                            className="size-9 rounded-xl flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                          >
                                            <Eraser size={16} />
                                          </button>
                                          <button 
                                            onClick={() => setIsInputExpanded(false)} 
                                            className="size-9 rounded-xl flex items-center justify-center text-primary bg-primary/10 transition-all"
                                          >
                                              <Minimize2 size={16} />
                                          </button>
                                      </div>
                                  )}
                              </div>

                              <button 
                                onClick={handleGenerate} 
                                disabled={!sessionPrompt || isActuallyRendering} 
                                className={`size-12 rounded-2xl flex items-center justify-center transition-all shrink-0 ${!sessionPrompt ? 'bg-white/5 text-white/5' : 'bg-primary text-white shadow-glow active:scale-90'}`}
                              >
                                  <ArrowUp size={22} />
                              </button>
                          </div>
                      </div>
                      <AnimatePresence initial={false}>
                          {showSettings && (
                              <motion.div 
                                  initial={{ height: 0, opacity: 0 }} 
                                  animate={{ height: 'auto', opacity: 1 }} 
                                  exit={{ height: 0, opacity: 0 }} 
                                  transition={LIQUID_SPRING}
                                  className="border-t-[0.5px] border-white/10 bg-black/20 overflow-hidden"
                              >
                                  <SettingsPill 
                                      localSettings={localSettings} 
                                      updateLocalSetting={updateLocalSetting} 
                                      setAspectRatio={(w, h) => { updateLocalSetting('width', w); updateLocalSetting('height', h); }} 
                                      styles={styles}
                                  />
                              </motion.div>
                          )}
                      </AnimatePresence>
                  </div>
              </motion.div>
          </div>
      </div>

      <AnimatePresence>{toastMessage && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-36 left-1/2 -translate-x-1/2 px-8 py-3 rounded-full glass-panel backdrop-blur-xl border-white/20 text-[10px] font-black uppercase tracking-widest">{toastMessage}</motion.div>}</AnimatePresence>

      <AnimatePresence>
          {selectedImage && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[500] bg-black flex items-center justify-center p-0"
                onClick={() => setSelectedImage(null)}
              >
                  {/* Full Screen Image Background */}
                  <motion.div 
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.1, opacity: 0 }}
                    className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
                  >
                      <img 
                          src={selectedImage.url} 
                          alt={selectedImage.prompt} 
                          className="w-full h-full object-contain sm:object-cover sm:scale-105 sm:blur-3xl sm:opacity-50 absolute inset-0" 
                      />
                      <img 
                          src={selectedImage.url} 
                          alt={selectedImage.prompt} 
                          className="relative z-10 max-w-full max-h-full object-contain shadow-2xl" 
                      />
                  </motion.div>

                  {/* Close Button */}
                  <button 
                      onClick={() => setSelectedImage(null)}
                      className="absolute top-8 right-8 size-14 rounded-full bg-black/20 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all z-50 active:scale-90"
                  >
                      <X size={24} />
                  </button>

                  {/* Floating Info Panel (Bottom) - Compact White Frost */}
                  <motion.div 
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 50, opacity: 0 }}
                      className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-3xl z-50"
                      onClick={(e) => e.stopPropagation()}
                  >
                      <div className="backdrop-blur-3xl bg-white/10 border border-white/20 rounded-[2rem] p-3 sm:p-4 shadow-2xl flex flex-col sm:flex-row items-center gap-4">
                          {/* Prompt & Metadata Group */}
                          <div className="flex-1 min-w-0 flex flex-col gap-1.5 px-3">
                              <div className="flex items-center gap-2">
                                  <div className="size-1.5 rounded-full bg-primary" />
                                  <div className="flex gap-2 text-[8px] font-black text-white/40 uppercase tracking-widest">
                                      <span>{selectedImage.model}</span>
                                      <span>•</span>
                                      <span>{selectedImage.seed}</span>
                                  </div>
                              </div>
                              <p className="text-[11px] sm:text-xs text-white/90 font-medium line-clamp-1 leading-none">{selectedImage.prompt}</p>
                          </div>

                          {/* Action Group */}
                          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                              <button 
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!supabase) return;
                                    const { data: { session } } = await supabase.auth.getSession();
                                    if (!session) {
                                        showToast("Login to share");
                                        return;
                                    }
                                    const { error } = await supabase
                                        .from('generations')
                                        .update({ is_public: true })
                                        .eq('url', selectedImage.url)
                                        .eq('user_id', session.user.id);
                                    if (error) showToast("Share failed");
                                    else showToast("Shared to Community!");
                                }}
                                className="flex-1 sm:flex-none h-10 px-5 rounded-full bg-white/10 border border-white/10 text-white text-[9px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                              >
                                  <Share2 size={12} />
                                  FEED
                              </button>
                              <button 
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = selectedImage.url;
                                    link.download = `resonance-${selectedImage.id}.png`;
                                    link.click();
                                }}
                                className="flex-1 sm:flex-none h-10 px-6 rounded-full bg-primary text-white text-[9px] font-black uppercase tracking-widest shadow-glow active:scale-95 transition-all flex items-center justify-center gap-2"
                              >
                                  <Download size={12} />
                                  DOWNLOAD
                              </button>
                          </div>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
};

export default ImageGenerator;