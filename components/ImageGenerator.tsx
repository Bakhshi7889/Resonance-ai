import React, { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useAnimate } from 'framer-motion';
import { 
    Settings, LayoutGrid, Shuffle, Eraser, Maximize2, Minimize2, 
    Trash2, EyeOff, Wand2, Zap, ArrowUp, ChevronDown, 
    Check, ShieldCheck, XCircle, Hash, Clock, AlertTriangle, RefreshCw, Layers, Heart,
    Sparkles, Loader2, Camera, Plus, X, LogIn, LogOut, User, Globe, Download, Share2, Video, ExternalLink, Terminal
} from 'lucide-react';
import { generateImageUrl, getRandomSeed, getAccountDetails, getEstimatedImagesLeft, getEffectiveKey } from '../services/pollinations';
import { downloadImage, performVisualAudit } from '../services/utils';
import { AppRoute, AppSettings, HistoryItem, ASPECT_RATIOS, AccountState, ModelInfo, CustomStyle } from '../types';
import { addLog } from '../services/logger';
import { enhancePrompt } from '../services/ai';
import { supabase } from '../services/supabase';
import { storage } from '../services/storage';
import TextareaAutosize from 'react-textarea-autosize';

const SILENT_NEGATIVE = "nsfw, naked, nude, porn, sex, explicit, genitals, nipples, topless, breasts, bad anatomy, deformed, ugly, watermark, logo";
const SPRING_CONFIG = { stiffness: 400, damping: 30 };
const LIQUID_SPRING = { stiffness: 260, damping: 20, mass: 1 };
const STORAGE_KEY_TELEMETRY = 'resonance_v4_telemetry';

const NEGATIVE_SUGGESTIONS = [
    "Blurry", "Distorted", "Lowres", "Text", "Watermark", "Malformed", "Extra Limbs", "Grainy", "Logo", "Bad Anatomy"
];

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
  models: ModelInfo[];
  onNavigate: (route: AppRoute) => void;
  onAddToHistory: (item: HistoryItem) => void;
  onUpdateHistoryItem?: (id: string, updates: Partial<HistoryItem>) => void;
  updateSettings?: (s: Partial<AppSettings>) => void;
  sessionPrompt: string;
  setSessionPrompt: (prompt: string) => void;
  sessionImages: HistoryItem[];
  setSessionImages: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  accountState: AccountState;
  refreshAccount: () => void;
}

const PromptHeader = memo(({ prompt, onClearBatch, batchId }: { prompt: string, onClearBatch: (id: string) => void, batchId: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col gap-3 px-2 mb-4 group max-w-3xl mx-auto">
            <div className="flex items-center gap-3">
                <div 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex-1 flex items-center gap-3 px-6 py-4 rounded-[1.8rem] bg-zinc-900 border border-zinc-800 cursor-pointer hover:bg-zinc-800 transition-all overflow-hidden shadow-sm"
                >
                    <Camera size={14} className="text-primary shrink-0" />
                    <p className={`text-xs font-medium text-white/70 tracking-tight leading-relaxed ${isExpanded ? '' : 'truncate'}`}>
                        {prompt}
                    </p>
                </div>
                <button 
                    onClick={() => onClearBatch(batchId)}
                    className="size-12 rounded-[1.5rem] bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0 active:scale-90"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </motion.div>
    );
});

const SKELETON_STAGES = [
    "Initializing Neural Pipeline...",
    "Sampling Latent Space...",
    "Synthesizing High-Frequency Tensors...",
    "Refining Texture & Lighting...",
    "Finalizing Output Image..."
];

const FluidGenerationSkeleton = memo(({ prompt, width, height }: { prompt: string, width?: number, height?: number }) => {
    const [seconds, setSeconds] = useState(0);
    const [stageIndex, setStageIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setSeconds(prev => +(prev + 0.1).toFixed(1));
        }, 100);
        const stageTimer = setInterval(() => {
            setStageIndex(prev => (prev + 1) % SKELETON_STAGES.length);
        }, 2200);
        return () => {
            clearInterval(timer);
            clearInterval(stageTimer);
        };
    }, []);

    return (
        <div className="absolute inset-0 z-10 overflow-hidden bg-zinc-950 flex flex-col items-center justify-center select-none">
            {/* Content */}
            <div className="relative z-20 flex flex-col items-center gap-6 p-8 text-center max-w-md">
                <div className="relative size-20 flex items-center justify-center">
                    <motion.div 
                        animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        className="absolute inset-0 bg-primary/20 rounded-[2rem]"
                    />
                    <motion.div 
                        animate={{ scale: [0.98, 1.02, 0.98] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="relative size-16 rounded-[1.5rem] bg-zinc-900 border border-primary/30 flex items-center justify-center text-primary shadow-xl"
                    >
                        <Wand2 size={24} />
                    </motion.div>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white text-[10px] font-black tracking-widest uppercase">
                        <Loader2 size={12} className="animate-spin" />
                        {seconds.toFixed(1)}s
                    </div>
                    <span className="text-xs font-bold text-white/90 tracking-wider uppercase font-mono">
                        {SKELETON_STAGES[stageIndex]}
                    </span>
                </div>

                {prompt && (
                    <p className="text-xs text-white/70 font-sans leading-relaxed line-clamp-2">
                        "{prompt}"
                    </p>
                )}
            </div>
        </div>
    );
});

const GenerationCard = memo(({ item, index, visualSafety, privateMode, onImageReady, onNavigate, showToast, onUploadComplete, apiKey, onSelect, onReveal }: { item: HistoryItem, index: number, visualSafety: boolean, privateMode: boolean, onImageReady?: (id: string) => void, onNavigate: (route: AppRoute) => void, showToast: (msg: string) => void, onUploadComplete?: (id: string, newUrl: string) => void, apiKey: string, onSelect?: () => void, onReveal?: (id: string) => void }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [visualRisk, setVisualRisk] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [imgSrc, setImgSrc] = useState(item.url);
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state if url updates externally
  useEffect(() => {
     setImgSrc(item.url);
  }, [item.url]);

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
      let isRisky = false;
      if (visualSafety || !privateMode) {
          setIsAuditing(true);
          isRisky = await performVisualAudit(item.url);
          setVisualRisk(isRisky);
          setIsAuditing(false);
      }
      setIsLoaded(true);
      if (onImageReady) onImageReady(item.id);

      // Handle automatic permanent media hosting
      if (!item.url.startsWith('https://media.pollinations.ai/')) {
          try {
              const { uploadToMediaStorage } = await import('../services/utils');
              const mediaUrl = await uploadToMediaStorage(item.url, apiKey);
              if (mediaUrl && mediaUrl !== item.url) {
                  if (onUploadComplete) onUploadComplete(item.id, mediaUrl);
                  
                  if (!privateMode && !isRisky && supabase) {
                      try {
                          const { data: { session } } = await supabase.auth.getSession();
                          if (session) {
                              await supabase.from('generations').update({ 
                                  url: mediaUrl,
                                  is_public: true, 
                                  visual_audit_passed: true 
                              })
                              .eq('url', item.url)
                              .eq('user_id', session.user.id);
                          }
                      } catch (e) {
                          console.error("DB URL update failed:", e);
                      }
                  }
                  return; // Skip standard update since we just handled it above with the final URL
              }
          } catch(e) {
              console.error("Upload to Media Storage failed", e);
          }
      }

      if (!privateMode && !isRisky && supabase) {
          try {
              const { data: { session } } = await supabase.auth.getSession();
              if (session) {
                  await supabase.from('generations').update({ is_public: true, visual_audit_passed: true })
                      .eq('url', item.url)
                      .eq('user_id', session.user.id);
              }
          } catch(e) {
              console.error("DB Update Failed", e);
          }
      }
  };

  const handleImageError = async () => {
      setHasError(true);
      setIsLoaded(true); 
      if (onImageReady) onImageReady(item.id);

      addLog('warn', 'Image generation failed', { id: item.id, url: item.url });
      
      try {
          // Perform diagnostic fetch to capture exact error code & message
          const res = await fetch(item.url);
          if (!res.ok) {
              const text = await res.text();
              setErrorCode(res.status);
              let errorMsg = `Generation Failed (${res.status})`;
              
              if (res.status === 400) {
                  errorMsg = "Bad Request (400): Invalid parameters or malformed prompt.";
              } else if (res.status === 401) {
                  errorMsg = "Unauthorized (401): Invalid or missing API key.";
              } else if (res.status === 402) {
                  errorMsg = "Out of Pollen (402): Please top up at enter.pollinations.ai";
              } else if (res.status === 403) {
                  errorMsg = "Forbidden (403): You don't have permission for this model.";
              } else if (res.status === 404) {
                  errorMsg = "Not Found (404): The requested endpoint does not exist.";
              } else if (res.status === 422) {
                  errorMsg = "Unprocessable (422): Required fields missing or invalid.";
              } else if (res.status === 429) {
                  errorMsg = "Rate Limited (429): Please slow down.";
              } else if (res.status === 502) {
                  errorMsg = "Provider Error (502): Upstream AI service unavailable.";
              } else if (res.status === 500 || res.status === 503) {
                  errorMsg = "Server Error (500/503): Pollinations is temporarily overloaded.";
              } else {
                  try {
                      const json = JSON.parse(text);
                      if (json?.error?.message) {
                          errorMsg = `${json.error.message} (${res.status})`;
                      }
                  } catch {}
              }

              setErrorMessage(errorMsg);
              addLog('error', errorMsg, { status: res.status, response: text.substring(0, 300), url: item.url });
          } else {
              setErrorMessage("Render Error: Image fetched successfully but browser failed to decode content.");
          }
      } catch (e: any) {
          setErrorMessage(`Network Error: ${e.message}`);
          addLog('error', 'Diagnostic fetch failed', { message: e.message, url: item.url });
      }
  };

  const retry = (overrideModel?: string) => {
      setHasError(false);
      setIsLoaded(false);
      setErrorMessage(null);
      setErrorCode(null);
      
      const urlObj = new URL(item.url);
      urlObj.searchParams.set('retry', Date.now().toString());
      if (overrideModel) {
          urlObj.searchParams.set('model', overrideModel);
      }
      item.url = urlObj.toString();
      setImgSrc(item.url);
      addLog('info', 'Retrying generation', { id: item.id, model: overrideModel || 'current' });
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!supabase) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        alert("Login to share");
        return;
    }

    // Perform visual audit before sharing
    setIsAuditing(true);
    const isRisky = await performVisualAudit(item.url);
    setIsAuditing(false);

    if (isRisky) {
        alert("Neural Safety Alert: This image contains content that violates our community guidelines and cannot be shared publicly.");
        setVisualRisk(true);
        return;
    }

    const { error } = await supabase
        .from('generations')
        .update({ 
            is_public: true,
            visual_audit_passed: true // Flag that it passed the audit
        })
        .eq('url', item.url)
        .eq('user_id', session.user.id);

    if (error) alert("Share failed");
    else alert("Shared to Community!");
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await downloadImage(item.url, `resonance-${item.width}x${item.height}-${Date.now()}.jpg`);
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
      className={`relative shrink-0 overflow-hidden bg-white/[0.02] border-[0.5px] border-white/10 shadow-liquid rounded-[2.5rem] flex items-center justify-center group/card w-full max-w-3xl ${!isLoaded ? 'bg-white/[0.03]' : ''} ${onSelect && !(visualRisk && !item.revealed) ? 'cursor-pointer' : ''}`}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', aspectRatio: `${item.width}/${item.height}` }}
      onClick={() => {
        if (visualRisk && !item.revealed) return;
        if (onSelect) onSelect();
      }}
    >
      {/* Skeleton Shimmer Layer - Always visible until loaded */}
      {!isLoaded && (
          <FluidGenerationSkeleton 
              prompt={item.prompt} 
              width={item.width} 
              height={item.height} 
          />
      )}

      {!hasError ? (
          <img 
            src={imgSrc} 
            alt="vision"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover transition-all duration-500 ease-out ${isLoaded && !isAuditing ? 'opacity-100' : 'opacity-0'} ${(visualRisk && !item.revealed) ? 'saturate-50 brightness-50 opacity-20' : ''}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
      ) : (
          <div className="flex flex-col items-center justify-center gap-4 text-white/70 p-8 text-center max-w-md">
              <AlertTriangle size={32} className="text-amber-400" />
              <div className="flex flex-col gap-1.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-400">
                    {errorCode ? `Error Code: ${errorCode}` : 'Generation Failed'}
                </p>
                <p className="text-xs text-white/80 font-sans leading-relaxed">
                    {errorMessage || 'Failed to render generated image. Please check parameters or try again.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                  <button 
                      onClick={() => retry()} 
                      className="px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-2 transition-all shadow"
                  >
                      <RefreshCw size={12} /> Try Again
                  </button>
                  {item.url.includes('flux') && !item.url.includes('model=flux') && (
                      <button 
                          onClick={() => retry('flux')} 
                          className="px-4 py-2.5 rounded-xl bg-primary/20 border border-primary/40 hover:bg-primary/30 text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-2 transition-all shadow"
                      >
                          Try with Official Flux Model
                      </button>
                  )}
              </div>
          </div>
      )}
      
      {isLoaded && !isAuditing && !hasError && (!visualRisk || item.revealed) && (
        <div className="absolute bottom-6 right-6 flex gap-2 opacity-0 group-hover/card:opacity-100 transition-all translate-y-2 group-hover/card:translate-y-0 z-30">
           <button 
               onClick={handleDownload}
               className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white/60 hover:text-white hover:bg-zinc-800 transition-all active:scale-90"
           >
               <Download size={16} />
           </button>
           <button 
               onClick={handleShare}
               className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white/60 hover:text-white hover:bg-zinc-800 transition-all active:scale-90"
           >
               <Share2 size={16} />
           </button>
        </div>
      )}

      {isAuditing && !hasError && showOverlay && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 overflow-hidden z-20"
        >
          <div className="absolute inset-0 bg-zinc-900 animate-pulse" />
          <div className="relative flex flex-col items-center gap-6">
              <div className="relative">
                  <div className="size-12 rounded-full border-2 border-white/5 border-t-primary animate-spin" />
                  <div className="absolute inset-0 size-12 rounded-full border border-primary/20 animate-ping" />
              </div>
              <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] animate-pulse">
                      Auditing Matrix
                  </span>
              </div>
          </div>
        </motion.div>
      )}
      {visualRisk && !item.revealed && isLoaded && !isAuditing && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-20 bg-zinc-950">
          <EyeOff className="text-white/10 mb-6" strokeWidth={1} size={54} />
          <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.4em] mb-10">Neural Filter Active</p>
          <button 
            type="button"
            onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                onReveal?.(item.id); 
            }} 
            className="px-12 py-5 rounded-full bg-white text-black text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-glow"
          >
            Reveal
          </button>
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
                        />
                    </g>
                ))}
            </svg>
        </motion.div>
    );
});

const SettingsPill = memo(({ localSettings, updateLocalSetting, setAspectRatio, styles, models }: { 
    localSettings: AppSettings, updateLocalSetting: (k: keyof AppSettings, v: any) => void, setAspectRatio: (w: number, h: number) => void, styles: CustomStyle[], models: ModelInfo[]
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

            // Fallback to default order (which is sorted by order property from styleService)
            return 0;
        });
    }, [localSettings.hiddenStyleIds, allStyles, localSettings.activeStyles]);

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
        <div className="px-5 py-6 flex flex-col gap-6 overflow-y-auto no-scrollbar max-h-[60vh]">
            <div className="grid grid-cols-2 gap-3">
                <button onClick={() => updateLocalSetting('enhance', !localSettings.enhance)} className={`relative h-12 rounded-2xl flex items-center justify-center gap-2 transition-all border backdrop-blur-md ${localSettings.enhance ? 'bg-primary/25 border-primary/50 text-primary font-black shadow-glow' : 'bg-white/10 border-white/10 text-white/60 hover:bg-white/15'}`}>
                    <Wand2 size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Neural {localSettings.enhance ? 'ON' : 'OFF'}</span>
                    <span className="absolute -top-1 -right-1 bg-black/80 text-[7px] px-1.5 py-0.5 rounded-full border border-white/10 font-bold text-white/40">+~3s</span>
                </button>
                <button onClick={() => updateLocalSetting('visualSafety', !localSettings.visualSafety)} className={`h-12 rounded-2xl flex items-center justify-center gap-2 transition-all border backdrop-blur-md ${localSettings.visualSafety ? 'bg-blue-500/25 border-blue-500/50 text-blue-300 font-black shadow-glow' : 'bg-white/10 border-white/10 text-white/60 hover:bg-white/15'}`}>
                    <ShieldCheck size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Audit {localSettings.visualSafety ? 'ON' : 'OFF'}</span>
                </button>
            </div>

            <div className="space-y-3">
                <p className="text-[8px] text-white/50 font-black uppercase tracking-[0.2em] pl-1">Aspect Geometry</p>
                <div className="grid grid-cols-5 gap-1.5 p-1">
                    {ASPECT_RATIOS.map(ratio => {
                        const isSelected = localSettings.width === ratio.width && localSettings.height === ratio.height;
                        return (
                            <button key={ratio.label} onClick={() => setAspectRatio(ratio.width, ratio.height)} className={`h-12 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all backdrop-blur-md ${isSelected ? 'bg-white text-black font-black shadow-glow border border-white' : 'text-white/50 hover:text-white bg-white/10 border border-white/10 hover:bg-white/20'}`}>
                                <RatioIcon width={ratio.width} height={ratio.height} isSelected={isSelected} />
                                <span className="text-[7px] font-black">{ratio.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-3">
                <p className="text-[8px] text-white/50 font-black uppercase tracking-[0.2em] pl-1">Batch Capacity</p>
                <div className="grid grid-cols-4 gap-1.5 p-1">
                    {[1, 2, 3, 4].map(n => {
                        const maxBatch = localSettings.model === 'zimage' ? 2 : 4;
                        const isDisabled = n > maxBatch;
                        return (
                            <button 
                                key={n} 
                                onClick={() => !isDisabled && updateLocalSetting('imageCount', n)} 
                                disabled={isDisabled}
                                className={`h-12 rounded-xl text-[9px] font-black transition-all backdrop-blur-md ${localSettings.imageCount === n ? 'bg-primary text-black shadow-glow' : 'text-white/50 hover:text-white bg-white/10 border border-white/10 hover:bg-white/20'} ${isDisabled ? 'opacity-20 cursor-not-allowed' : ''}`}
                            >
                                {n}x
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-3">
                <p className="text-[8px] text-white/50 font-black uppercase tracking-[0.2em] pl-1">Neural Model</p>
                <div className="grid grid-cols-3 gap-2 p-1">
                    {models.map(m => (
                        <button 
                            key={m.id} 
                            onClick={() => {
                                updateLocalSetting('model', m.id);
                                const maxBatch = m.id === 'zimage' ? 2 : 4;
                                if (localSettings.imageCount > maxBatch) {
                                    updateLocalSetting('imageCount', maxBatch);
                                }
                            }} 
                            className={`h-12 rounded-xl text-[8px] font-black transition-all flex flex-col items-center justify-center gap-1 relative overflow-hidden backdrop-blur-md ${localSettings.model === m.id ? 'bg-primary text-black shadow-glow border border-primary' : 'bg-white/10 text-white/60 hover:text-white border border-white/10 hover:bg-white/20'}`}
                        >
                            <div className="flex items-center gap-1">
                                {m.type === 'video' ? <Video size={10} className="text-blue-400" /> : (m.paid_only ? <Zap size={10} className="text-amber-400" /> : <Sparkles size={10} />)}
                                <span className="truncate max-w-[60px]">{m.name}</span>
                            </div>
                            {m.price > 0 && (
                                <span className="text-[6px] opacity-60">
                                    ${m.price}{m.type === 'video' ? '/s' : ''}
                                </span>
                            )}
                            {m.type === 'video' && (
                                <div className="absolute top-0 right-0 px-1 py-0.5 bg-blue-500/20 text-blue-400 text-[5px] font-black uppercase tracking-tighter rounded-bl-lg">
                                    VIDEO
                                </div>
                            )}
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
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-6 relative z-10">
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
                                    <img src={previewUrl} alt={style.label} crossOrigin="anonymous" referrerPolicy="no-referrer" className="w-full h-full object-cover" loading="lazy" />
                                    
                                    {/* Like Button at Top Left */}
                                    {style.id !== 'none' && (
                                        <button 
                                            onClick={(e) => toggleFavorite(e, style.id)}
                                            className={`absolute top-3 left-3 size-7 rounded-full flex items-center justify-center transition-all z-30 ${isFavorite ? 'bg-red-500 text-white' : 'bg-zinc-900 border border-zinc-800 text-white/40 hover:text-white'}`}
                                        >
                                            <Heart size={12} fill={isFavorite ? "currentColor" : "none"} />
                                        </button>
                                    )}

                                    {/* Model Pill moved to Top Right */}
                                    {effectiveModelId && (
                                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 z-20">
                                            <p className="text-[7px] font-black uppercase tracking-widest text-white/60">{effectiveModelId}</p>
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-black/70 flex flex-col justify-end p-4">
                                        <p className={`text-[10px] font-black uppercase tracking-tighter text-center leading-tight ${isSelected ? 'text-primary' : 'text-white/80'}`}>{style.label}</p>
                                    </div>
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
    settings: globalSettings, styles, models, onNavigate, onAddToHistory, onUpdateHistoryItem, updateSettings, sessionPrompt, setSessionPrompt, sessionImages, setSessionImages, accountState, refreshAccount
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [localSettings, setLocalSettings] = useState({ ...globalSettings });
  const [showSettings, setShowSettings] = useState(false);
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleUploadComplete = useCallback((id: string, newUrl: string) => {
    setSessionImages(prev => prev.map(img => img.id === id ? { ...img, url: newUrl } : img));
    onUpdateHistoryItem?.(id, { url: newUrl });
  }, [setSessionImages, onUpdateHistoryItem]);

  const handleReveal = useCallback((id: string) => {
    setSessionImages(prev => prev.map(img => img.id === id ? { ...img, revealed: true } : img));
    onUpdateHistoryItem?.(id, { revealed: true });
  }, [setSessionImages, onUpdateHistoryItem]);
  const [showPromptTools, setShowPromptTools] = useState(false);
  const [renderTime, setRenderTime] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<Set<string>>(new Set());
  const [batchTotal, setBatchTotal] = useState(0);

  const [telemetry, setTelemetry] = useState<Record<string, { avgDuration: number; count: number }>>({
    zimage: { avgDuration: 1.5, count: 0 },
    flux: { avgDuration: 8.0, count: 0 },
    klein: { avgDuration: 4.0, count: 0 }
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

  // Load telemetry cache from IndexedDB
  useEffect(() => {
    const loadCache = async () => {
      try {
        const storedTelemetry = await storage.get<any>(STORAGE_KEY_TELEMETRY);
        if (storedTelemetry) {
          // Migration/Safety check: if it's the old format (single object), reset to default
          if (storedTelemetry.avgDuration !== undefined || !storedTelemetry.klein) {
            setTelemetry({
              zimage: { avgDuration: 1.5, count: 0 },
              flux: { avgDuration: 8.0, count: 0 },
              klein: { avgDuration: 4.0, count: 0 }
            });
          } else {
            setTelemetry(storedTelemetry);
          }
        }
      } catch (e) {
        console.error('Cache Load Error:', e);
      }
    };
    loadCache();
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
  const isFirstLoad = useRef(true);

  // Automatically scroll to the newest generations (bottom of the feed) when app opens or when images change/start
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      const timer = setTimeout(() => {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: isFirstLoad.current ? 'auto' : 'smooth'
        });
        if (sessionImages.length > 0) {
            isFirstLoad.current = false;
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [sessionImages.length, isProcessing]);

  const showToast = (message: string) => { setToastMessage(message); setTimeout(() => setToastMessage(null), 3000); };

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
          refreshAccount();
      }
  }, [pendingImages.size, isProcessing, refreshAccount, renderTime]);

  const handleEnhance = async () => {
      if (!sessionPrompt || isEnhancing) return;
      setIsEnhancing(true);
      try {
          const finalPrompt = await enhancePrompt(
              sessionPrompt, 
              localSettings.model, 
              globalSettings.apiKey, 
              (chunk) => {
                  setSessionPrompt(chunk);
              }
          );
          setSessionPrompt(finalPrompt);
          showToast("Prompt Enhanced");
      } catch (error: any) {
          showToast(error.message || "Enhancement Failed");
      } finally {
          setIsEnhancing(false);
      }
  };

  const handleGenerate = async () => {
    if (!sessionPrompt) return;

    if (localSettings.model === 'klein') {
        const today = new Date().toISOString().split('T')[0];
        let usage: { date: string, count: number } | null = await storage.get('resonance_klein_usage');
        
        if (!usage || usage.date !== today) {
            usage = { date: today, count: 0 };
        }
        
        if (usage.count + localSettings.imageCount > 10) {
            showToast(`Klein 4B limit reached. You have ${Math.max(0, 10 - usage.count)} left today.`);
            return;
        }
        
        usage.count += localSettings.imageCount;
        await storage.set('resonance_klein_usage', usage);
    }

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
    
    let basePrompt = sessionPrompt;
    if (localSettings.enhance) {
        try {
            setIsEnhancing(true);
            showToast("Neural Core Enhancing...");
            basePrompt = await enhancePrompt(
                sessionPrompt, 
                localSettings.model, 
                globalSettings.apiKey
            );
        } catch (e: any) {
            console.error("Neural Enhance Failed", e);
            showToast(e?.message || "Enhancement Failed, using original prompt.");
        } finally {
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
            enhance: localSettings.enhance, 
            nologo: true, 
            negative_prompt: localSettings.negativePrompt || SILENT_NEGATIVE, 
            safe: localSettings.visualSafety, 
            private: localSettings.privateMode, 
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
                className="fixed inset-0 z-[299] bg-black/80" 
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
            className="relative pointer-events-auto glass-card shadow-liquid overflow-hidden cursor-pointer flex flex-col items-center" 
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

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar relative px-6 pb-[32vh] pt-44">
          <div className="flex flex-col items-center gap-20">
              {groupedImages.length === 0 && !isActuallyRendering && !isProcessing ? (
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
                        className="size-20 rounded-[2rem] bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-10 mx-auto shadow-liquid animate-liquid-pulse"
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
                                        <div key={item.id} className="active:scale-[0.98] transition-transform">
                                            <GenerationCard 
                                              item={item} 
                                              index={idx} 
                                              visualSafety={localSettings.visualSafety} 
                                              privateMode={localSettings.privateMode}
                                              onImageReady={handleImageLoaded}
                                              onNavigate={onNavigate}
                                              showToast={showToast}
                                              onUploadComplete={handleUploadComplete}
                                              apiKey={globalSettings.apiKey}
                                              onSelect={() => setSelectedImage(item)} onReveal={handleReveal}
                                            />
                                        </div>
                                      ))}
                                  </div>
                              </motion.div>
                          ))}
                          {isProcessing && (
                              <motion.div 
                                  layout
                                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                  transition={LIQUID_SPRING}
                                  key="skeleton-batch"
                                  className="w-full flex flex-col items-center gap-10"
                              >
                                  <div className="w-full max-w-2xl flex items-center justify-between px-4">
                                      <div className="flex items-center gap-2.5">
                                          <div className="size-2 rounded-full bg-primary animate-ping" />
                                          <span className="text-[10px] font-black uppercase tracking-widest text-primary font-mono">Generating Media Asset...</span>
                                      </div>
                                  </div>
                                  <div className="w-full flex flex-col items-center gap-16">
                                      {Array.from({ length: localSettings.imageCount }).map((_, idx) => (
                                          <div 
                                              key={idx} 
                                              className="relative shrink-0 overflow-hidden bg-zinc-950 border border-zinc-800 shadow-liquid rounded-[2.5rem] flex items-center justify-center w-full max-w-3xl" 
                                              style={{ aspectRatio: `${localSettings.width}/${localSettings.height}` }}
                                          >
                                              <FluidGenerationSkeleton prompt={sessionPrompt} width={localSettings.width} height={localSettings.height} />
                                          </div>
                                      ))}
                                  </div>
                              </motion.div>
                          )}
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
                  className={`glass-card overflow-hidden w-full ${showSettings ? 'rounded-[2.5rem]' : 'rounded-[2rem]'}`}
              >
                  <div className="flex flex-col">
                      {/* Inline Liquid Settings Expansion */}
                      <AnimatePresence initial={false}>
                          {showSettings && (
                              <motion.div 
                                  initial={{ height: 0, opacity: 0 }} 
                                  animate={{ height: "auto", opacity: 1 }} 
                                  exit={{ height: 0, opacity: 0 }} 
                                  transition={{ type: "spring", ...LIQUID_SPRING }}
                                  className="border-b border-white/10 bg-black/20 overflow-hidden"
                              >
                                  <div className="p-3 sm:p-5 overflow-y-auto max-h-[50vh] no-scrollbar">
                                      <SettingsPill 
                                          localSettings={localSettings} 
                                          updateLocalSetting={updateLocalSetting} 
                                          setAspectRatio={(w, h) => { updateLocalSetting('width', w); updateLocalSetting('height', h); }} 
                                          styles={styles}
                                          models={models}
                                      />
                                  </div>
                              </motion.div>
                          )}
                      </AnimatePresence>

                      <div className="flex flex-col p-2 gap-2">
                          <div className="flex flex-row items-end gap-2">
                              <button 
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowSettings(!showSettings); }} 
                                className={`size-12 rounded-2xl flex items-center justify-center transition-all shrink-0 ${showSettings ? 'bg-primary text-black shadow-glow' : 'bg-white/10 text-white/70 hover:bg-white/20 backdrop-blur-md'}`}
                                title={showSettings ? "Close Settings" : "Open Settings"}
                              >
                                  <Settings size={20} className={showSettings ? 'rotate-90 transition-transform duration-300' : 'transition-transform duration-300'} />
                              </button>

                              {/* Prompt Input Area */}
                              <div className="flex-1 bg-white/[0.08] backdrop-blur-md rounded-2xl border border-white/10 flex flex-col transition-all focus-within:border-primary/50 focus-within:bg-white/[0.12] overflow-hidden">
                                  <div className="flex-1 flex items-center min-h-[48px] px-3 py-3">
                                      <TextareaAutosize 
                                        value={sessionPrompt} 
                                        onChange={(e) => setSessionPrompt(e.target.value)} 
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleGenerate();
                                            }
                                        }}
                                        minRows={1}
                                        maxRows={6}
                                        className={`w-full bg-transparent border-none text-white text-[15px] focus:ring-0 placeholder:text-white/60 resize-none p-0 leading-relaxed transition-all ${isEnhancing ? 'animate-pulse text-primary/60' : ''}`} 
                                        placeholder="Type a prompt..." 
                                      />
                                  </div>
                              </div>

                              <button 
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleGenerate(); }} 
                                disabled={!sessionPrompt || isActuallyRendering} 
                                className={`size-12 rounded-2xl flex items-center justify-center transition-all shrink-0 ${!sessionPrompt ? 'bg-white/5 text-white/10' : 'bg-primary text-white shadow-glow active:scale-90'}`}
                              >
                                  <ArrowUp size={22} />
                              </button>
                          </div>

                          {/* Quick Tools Row */}
                          <div className="flex items-center justify-between px-1">
                              <div className="flex items-center gap-2">
                                  {sessionPrompt && (
                                      <div className="flex items-center gap-1 bg-white/5 rounded-full p-1">
                                          <button 
                                              type="button"
                                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEnhance(); }} 
                                              disabled={isEnhancing}
                                              className={`h-7 px-3 rounded-full flex items-center justify-center gap-1.5 transition-all text-[10px] font-bold tracking-wide uppercase ${isEnhancing ? 'text-primary animate-spin' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                                              title="Enhance Prompt"
                                          >
                                              {isEnhancing ? <Loader2 size={12} /> : <Sparkles size={12} />} Enhance
                                          </button>
                                          <button 
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSessionPrompt(''); }} 
                                            className="h-7 px-3 rounded-full flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-wide uppercase text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                            title="Erase Prompt"
                                          >
                                            <Eraser size={12} /> Clear
                                          </button>
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>
              </motion.div>
          </div>
      </div>

      <AnimatePresence>{toastMessage && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-36 left-1/2 -translate-x-1/2 px-8 py-3 rounded-full bg-zinc-900/90 backdrop-blur-xl border border-white/10 text-[10px] font-black uppercase tracking-widest z-[700] shadow-2xl">{toastMessage}</motion.div>}</AnimatePresence>

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
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain sm:object-cover sm:scale-105 sm:opacity-30 absolute inset-0" 
                      />
                      <img 
                          src={selectedImage.url} 
                          alt={selectedImage.prompt} 
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                          className="relative z-10 max-w-full max-h-full object-contain shadow-2xl" 
                      />
                  </motion.div>

                  {/* Close Button */}
                  <button 
                      onClick={() => setSelectedImage(null)}
                      className="absolute top-8 right-8 size-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white hover:bg-zinc-800 transition-all z-50 active:scale-90"
                  >
                      <X size={24} />
                  </button>

                  {/* Floating Info Panel (Bottom) */}
                  <motion.div 
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 50, opacity: 0 }}
                      className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-3xl z-50"
                      onClick={(e) => e.stopPropagation()}
                  >
                      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-3 sm:p-4 shadow-2xl flex flex-col sm:flex-row items-center gap-4">
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
                                    downloadImage(selectedImage.url, `resonance-${selectedImage.id}.png`);
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