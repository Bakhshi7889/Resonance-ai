import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { HistoryItem, AppRoute, AccountState, AppSettings } from '../types';
import { Header } from './Header';
import { supabase } from '../services/supabase';
import { Globe, Share2, ShieldCheck, Clock, Trash2, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { downloadImage } from '../services/utils';

interface HistoryProps {
  history: HistoryItem[];
  onNavigate: (route: AppRoute) => void;
  onRemix?: (item: HistoryItem) => void;
  onDelete?: (ids: string[]) => void;
  onPurgeExpired?: (days?: number) => number;
  accountState: AccountState;
  settings?: AppSettings;
  updateSettings?: (updates: Partial<AppSettings>) => void;
}

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

export const History: React.FC<HistoryProps> = memo(({ 
  history, 
  onNavigate, 
  onRemix, 
  onDelete, 
  onPurgeExpired, 
  accountState,
  settings,
  updateSettings 
}) => {
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState(0);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [purgeToastMessage, setPurgeToastMessage] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const autoDeleteEnabled = settings?.historyAutoDeleteEnabled !== false;
  const autoDeleteDays = settings?.historyAutoDeleteDays ?? 7;
  const cutoffTimestamp = useMemo(() => Date.now() - autoDeleteDays * 24 * 60 * 60 * 1000, [autoDeleteDays]);

  const expiredItems = useMemo(() => {
    return history.filter(item => item.timestamp && item.timestamp < cutoffTimestamp);
  }, [history, cutoffTimestamp]);

  const oldestTimestamp = useMemo(() => {
    if (history.length === 0) return null;
    return Math.min(...history.map(item => item.timestamp || Date.now()));
  }, [history]);

  const oldestDays = oldestTimestamp ? Math.max(0, Math.floor((Date.now() - oldestTimestamp) / (1000 * 60 * 60 * 24))) : 0;

  // Auto-purge expired on mount if enabled
  useEffect(() => {
    if (autoDeleteEnabled && expiredItems.length > 0) {
      if (onPurgeExpired) {
        onPurgeExpired(autoDeleteDays);
      } else if (onDelete) {
        onDelete(expiredItems.map(i => i.id));
      }
    }
  }, []);

  const handleManualPurge = useCallback(() => {
    let purged = 0;
    if (onPurgeExpired) {
      purged = onPurgeExpired(autoDeleteDays);
    } else if (onDelete && expiredItems.length > 0) {
      onDelete(expiredItems.map(i => i.id));
      purged = expiredItems.length;
    }
    if (purged > 0) {
      setPurgeToastMessage(`Auto-purged ${purged} asset${purged === 1 ? '' : 's'} older than ${autoDeleteDays} days to safeguard your API key.`);
    } else {
      setPurgeToastMessage(`History is clean. All ${history.length} assets are within the safe ${autoDeleteDays}-day window.`);
    }
    setTimeout(() => setPurgeToastMessage(null), 3800);
  }, [onPurgeExpired, onDelete, autoDeleteDays, expiredItems, history.length]);

  // Grouping history only by date for a flatter grid view
  const groupedHistory = useMemo(() => {
    const groups: { [key: string]: HistoryItem[] } = {};
    const dates: string[] = []; 
    
    history.forEach(item => {
      const date = new Date(item.timestamp).toLocaleDateString(undefined, {
          weekday: 'long', 
          month: 'short', 
          day: 'numeric'
      });
      
      if (!groups[date]) {
        groups[date] = [];
        dates.push(date);
      }
      groups[date].push(item);
    });
    
    return dates.map(date => ({
        title: date,
        items: groups[date]
    }));
  }, [history]);

  const currentFullscreenItem = fullscreenImageIndex !== null ? history[fullscreenImageIndex] : null;

  const toggleSelectionMode = () => {
      if (isSelectionMode) {
          setIsSelectionMode(false);
          setSelectedIds([]);
      } else {
          setIsSelectionMode(true);
      }
  };

  const toggleItemSelection = (id: string) => {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleConfirmDelete = () => {
      if (onDelete && selectedIds.length > 0) {
          onDelete(selectedIds);
          setIsSelectionMode(false);
          setSelectedIds([]);
      }
      setShowDeleteConfirm(false);
  };

  const handleNextImage = () => {
    if (fullscreenImageIndex !== null && fullscreenImageIndex < history.length - 1) {
        setSlideDirection(1);
        setFullscreenImageIndex(fullscreenImageIndex + 1);
        setShowInfoPanel(false);
    }
  };

  const handlePrevImage = () => {
    if (fullscreenImageIndex !== null && fullscreenImageIndex > 0) {
        setSlideDirection(-1);
        setFullscreenImageIndex(fullscreenImageIndex - 1);
        setShowInfoPanel(false);
    }
  };

  const handleDragEnd = (e: any, { offset, velocity }: PanInfo) => {
    const swipe = Math.abs(offset.x) * velocity.x;
    if (swipe < -200 || offset.x < -100) {
      handleNextImage();
    } else if (swipe > 200 || offset.x > 100) {
      handlePrevImage();
    }
  };

  const handleDownload = async (url: string) => {
    await downloadImage(url, `resonance-${currentFullscreenItem?.width}x${currentFullscreenItem?.height}-${Date.now()}.jpg`);
  };

  const handleShare = async () => {
      if (!supabase || !currentFullscreenItem) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
          alert("Please log in to share images.");
          return;
      }

      // Dynamic import to avoid circular dependencies if any
      const { performVisualAudit } = await import('../services/utils');
      const isRisky = await performVisualAudit(currentFullscreenItem.url);
      if (isRisky) {
          alert("Neural Safety Alert: This image contains content that violates our community guidelines and cannot be shared publicly.");
          return;
      }

      const { error } = await supabase
          .from('generations')
          .update({ is_public: true })
          .eq('url', currentFullscreenItem.url)
          .eq('user_id', session.user.id);

      if (error) {
          // If update fails, try inserting (maybe it was generated before cloud sync)
          const { error: insertError } = await supabase
              .from('generations')
              .insert({
                  user_id: session.user.id,
                  prompt: currentFullscreenItem.prompt,
                  url: currentFullscreenItem.url,
                  model: currentFullscreenItem.model,
                  width: currentFullscreenItem.width,
                  height: currentFullscreenItem.height,
                  seed: currentFullscreenItem.seed,
                  style_suffix: currentFullscreenItem.styleSuffix,
                  is_public: true
              });
          
          if (insertError) alert("Failed to share: " + insertError.message);
          else alert("Shared to Community!");
      } else {
          alert("Shared to Community!");
      }
  };

  return (
    <motion.div 
      className="flex flex-col h-full bg-black w-full relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full max-w-7xl mx-auto flex flex-col h-full">
        <Header 
            title={isSelectionMode ? `${selectedIds.length} Selected` : "History"} 
            leftIcon={isSelectionMode ? "close" : "arrow_back"}
            onLeftClick={isSelectionMode ? toggleSelectionMode : () => onNavigate(AppRoute.GENERATOR)}
            rightIcon={isSelectionMode ? (selectedIds.length > 0 ? "delete" : undefined) : "checklist"}
            onRightClick={isSelectionMode ? (selectedIds.length > 0 ? () => setShowDeleteConfirm(true) : undefined) : toggleSelectionMode}
        />

        <div className="flex-1 overflow-y-auto no-scrollbar pb-32 px-4">
            {/* 7-Day Auto-Delete Protection Banner */}
            <div className="mt-4 mb-3 p-4 rounded-3xl bg-zinc-900/90 border border-white/10 backdrop-blur-xl flex flex-col gap-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="size-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white tracking-tight">
                        7-Day Auto-Delete Protection
                      </span>
                      <span className={`text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        autoDeleteEnabled 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-zinc-800 text-white/40'
                      }`}>
                        {autoDeleteEnabled ? `${autoDeleteDays} Days Active` : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-[9px] text-white/50 leading-relaxed mt-0.5 max-w-xl">
                      Pollinations CDN servers keep rendered images cached for ~7 days. Auto-deleting creations older than 7 days ensures expired CDN URLs won't trigger unwanted re-generation charges on your API key.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  {updateSettings && (
                    <select
                      value={autoDeleteEnabled ? autoDeleteDays : 'off'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'off') {
                          updateSettings({ historyAutoDeleteEnabled: false });
                        } else {
                          const d = parseInt(val, 10);
                          updateSettings({ historyAutoDeleteEnabled: true, historyAutoDeleteDays: d });
                        }
                      }}
                      className="bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-[8px] font-bold text-white uppercase tracking-wider focus:outline-none focus:border-primary/50 cursor-pointer"
                    >
                      <option value="3" className="bg-zinc-900">3 Days</option>
                      <option value="7" className="bg-zinc-900">7 Days (Default)</option>
                      <option value="14" className="bg-zinc-900">14 Days</option>
                      <option value="30" className="bg-zinc-900">30 Days</option>
                      <option value="off" className="bg-zinc-900">Off</option>
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={handleManualPurge}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[8px] font-black text-white/80 hover:text-white uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all"
                  >
                    <Trash2 size={11} className={expiredItems.length > 0 ? "text-amber-400" : "text-white/40"} />
                    <span>{expiredItems.length > 0 ? `Purge Expired (${expiredItems.length})` : 'Clean >7d Now'}</span>
                  </button>
                </div>
              </div>

              {/* Status / protection indicator */}
              <div className="flex flex-wrap items-center justify-between text-[8px] font-mono text-white/40 pt-2 border-t border-white/5 gap-2">
                <div className="flex items-center gap-3">
                  <span>Stored: {history.length} assets</span>
                  <span>•</span>
                  <span>Oldest: {history.length > 0 ? `${oldestDays} day${oldestDays === 1 ? '' : 's'} old` : 'None'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Key Shield: Re-Generation Protection Active</span>
                </div>
              </div>
            </div>

            {groupedHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[50vh] text-white/40">
                    <span className="material-symbols-outlined text-6xl mb-4">image_not_supported</span>
                    <p className="text-xs font-bold uppercase tracking-widest">No assets saved</p>
                </div>
            )}

            <div className="flex flex-col gap-10 py-6">
                {groupedHistory.map((group) => (
                    <div key={group.title} className="flex flex-col gap-4" style={{ contentVisibility: 'auto' }}>
                        <h3 className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] pl-1">
                            {group.title}
                        </h3>
                        <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
                            {group.items.map((item) => {
                                const globalIndex = history.findIndex(i => i.id === item.id);
                                const isSelected = selectedIds.includes(item.id);
                                const itemAgeDays = Math.floor((Date.now() - (item.timestamp || Date.now())) / (1000 * 60 * 60 * 24));
                                const isExpiringSoon = autoDeleteEnabled && itemAgeDays >= Math.max(1, autoDeleteDays - 2);
                                const isFailed = failedImages[item.id];

                                return (
                                    <motion.div 
                                        key={item.id}
                                        onClick={() => {
                                            if (isSelectionMode) {
                                                toggleItemSelection(item.id);
                                            } else if (!isFailed) {
                                                setFullscreenImageIndex(globalIndex);
                                            }
                                        }}
                                        className={`relative break-inside-avoid cursor-pointer group rounded-2xl overflow-hidden border transition-all mb-4 ${isSelected ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-black' : 'border-white/5 hover:border-white/20'}`}
                                    >
                                        {isFailed ? (
                                            <div className="w-full aspect-square bg-zinc-900 p-4 flex flex-col items-center justify-center text-center gap-2">
                                                <AlertTriangle size={20} className="text-amber-400" />
                                                <span className="text-[10px] font-bold text-white">Cache Expired</span>
                                                <span className="text-[8px] text-white/40 leading-snug">Pollinations CDN cache purged to avoid API key charges.</span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (onDelete) onDelete([item.id]);
                                                    }}
                                                    className="mt-1 px-3 py-1 rounded-xl bg-red-500/20 text-red-300 text-[8px] font-black uppercase tracking-wider hover:bg-red-500/30 transition-all"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <img 
                                                    src={item.url} 
                                                    className="w-full h-auto block" 
                                                    alt="thumbnail" 
                                                    loading="lazy" 
                                                    onError={() => setFailedImages(prev => ({ ...prev, [item.id]: true }))}
                                                    style={{ aspectRatio: `${item.width}/${item.height}` }}
                                                />
                                                {isExpiringSoon && (
                                                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-amber-300 text-[7px] font-mono font-bold border border-amber-500/30 flex items-center gap-1 shadow-md">
                                                        <Clock size={8} />
                                                        <span>~{Math.max(1, autoDeleteDays - itemAgeDays)}d left</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        {isSelectionMode && (
                                            <div className="absolute inset-0 bg-black/20 z-10 flex items-start justify-end p-2">
                                                <div className={`size-5 rounded-full border border-white/40 flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'bg-black/40'}`}>
                                                    {isSelected && <span className="material-symbols-outlined text-[14px] text-white font-bold">check</span>}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      <AnimatePresence>
          {showDeleteConfirm && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[150] bg-black flex items-center justify-center p-6"
              >
                  <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="glass-panel border border-white/10 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl flex flex-col gap-4 text-center"
                  >
                       <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
                          <span className="material-symbols-outlined text-[32px]">delete</span>
                      </div>
                      <h3 className="text-xl font-bold text-white tracking-tight">Delete {selectedIds.length} Assets?</h3>
                      <div className="flex gap-3 mt-4">
                          <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-2xl bg-white/5 text-white font-medium">Cancel</button>
                          <button onClick={handleConfirmDelete} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold shadow-lg shadow-red-500/20">Delete</button>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

      <AnimatePresence>
        {fullscreenImageIndex !== null && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black flex flex-col will-change-opacity"
                onClick={() => setFullscreenImageIndex(null)}
            >
                 <div className="absolute top-0 left-0 right-0 p-6 pt-12 flex justify-between items-start z-20 pointer-events-none">
                     <div className="flex flex-col pointer-events-auto bg-black px-4 py-1.5 rounded-full border border-white/10">
                        <span className="text-white/80 font-mono text-[10px] font-bold">
                            {fullscreenImageIndex + 1} / {history.length}
                        </span>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setFullscreenImageIndex(null); }}
                        className="size-11 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-md pointer-events-auto hover:bg-white/20 border border-white/10 active:scale-90 transition-all"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex-1 flex items-center justify-center relative w-full h-full overflow-hidden">
                    <AnimatePresence initial={false} custom={slideDirection}>
                        <motion.div
                            key={currentFullscreenItem?.id}
                            custom={slideDirection}
                            variants={swipeVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                            className="absolute inset-0 flex items-center justify-center touch-pan-y"
                            onClick={(e) => e.stopPropagation()} 
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.5}
                            onDragEnd={handleDragEnd}
                        >
                            <img 
                                src={currentFullscreenItem?.url} 
                                className="max-w-[95vw] max-h-[85vh] object-contain rounded-[2rem] shadow-2xl"
                                alt="fullscreen" 
                                style={{ aspectRatio: `${currentFullscreenItem?.width}/${currentFullscreenItem?.height}` }}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Info Panel Overlay */}
                <AnimatePresence>
                    {showInfoPanel && currentFullscreenItem && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute bottom-40 left-6 right-6 z-30 glass-panel backdrop-blur-2xl p-6 rounded-[2rem] border border-white/10 space-y-4"
                        >
                            <div className="space-y-1">
                                <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Vision Data</p>
                                <p className="text-sm text-white/90 leading-relaxed italic">"{currentFullscreenItem.prompt}"</p>
                            </div>
                            {typeof currentFullscreenItem.styleSuffix === 'string' && currentFullscreenItem.styleSuffix.trim() !== '' && (
                                <div className="space-y-1 border-t border-white/5 pt-4">
                                    <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Style Matrix</p>
                                    <p className="text-[11px] text-white/50 leading-relaxed">{currentFullscreenItem.styleSuffix.replace(/^, /, '')}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4">
                                <div className="space-y-1">
                                    <p className="text-[9px] text-white/30 uppercase font-black tracking-widest">Seed</p>
                                    <p className="text-[11px] font-mono text-white/60 truncate">{currentFullscreenItem.seed}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] text-white/30 uppercase font-black tracking-widest">Scale</p>
                                    <p className="text-[11px] font-mono text-white/60 truncate">{currentFullscreenItem.width}x{currentFullscreenItem.height}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] text-white/30 uppercase font-black tracking-widest">Synthesized</p>
                                    <p className="text-[11px] font-mono text-white/60 truncate">
                                        {currentFullscreenItem.timestamp ? new Date(currentFullscreenItem.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div 
                    className="absolute bottom-0 left-0 right-0 p-8 pb-14 flex justify-center gap-10 z-20 bg-black" 
                    onClick={(e) => e.stopPropagation()}
                >
                    <button onClick={() => currentFullscreenItem && handleDownload(currentFullscreenItem.url)} className="flex flex-col items-center gap-1.5 group">
                        <div className="size-12 rounded-full bg-white/5 flex items-center justify-center mb-1 backdrop-blur-md border border-white/5 active:scale-90 transition-all group-hover:bg-white/10">
                             <span className="material-symbols-outlined text-[20px] text-white/60 group-hover:text-white">download</span>
                        </div>
                        <span className="text-[8px] uppercase tracking-[0.3em] font-black text-white/40 group-hover:text-white/80">Save</span>
                    </button>

                    <button onClick={handleShare} className="flex flex-col items-center gap-1.5 group">
                        <div className="size-12 rounded-full bg-white/5 flex items-center justify-center mb-1 backdrop-blur-md border border-white/5 active:scale-90 transition-all group-hover:bg-white/10">
                            <Globe size={20} className="text-white/60 group-hover:text-white" />
                        </div>
                        <span className="text-[8px] uppercase tracking-[0.3em] font-black text-white/40 group-hover:text-white/80">Share</span>
                    </button>

                    {onRemix && currentFullscreenItem && (
                        <button onClick={() => onRemix(currentFullscreenItem)} className="flex flex-col items-center gap-1.5 group">
                            <div className="size-12 rounded-full bg-white/5 flex items-center justify-center mb-1 backdrop-blur-md border border-white/5 active:scale-90 transition-all group-hover:bg-white/10">
                                <span className="material-symbols-outlined text-[20px] text-white/60 group-hover:text-white">edit_square</span>
                            </div>
                            <span className="text-[8px] uppercase tracking-[0.3em] font-black text-white/40 group-hover:text-white/80">Remix</span>
                        </button>
                    )}

                    <button onClick={() => setShowInfoPanel(!showInfoPanel)} className={`flex flex-col items-center gap-1.5 group ${showInfoPanel ? 'text-primary' : 'text-white/40'}`}>
                        <div className={`size-12 rounded-full flex items-center justify-center mb-1 backdrop-blur-md transition-all active:scale-90 border ${showInfoPanel ? 'bg-primary/20 border-primary/40' : 'bg-white/5 border-white/5 group-hover:bg-white/10'}`}>
                             <span className={`material-symbols-outlined text-[20px] ${showInfoPanel ? 'text-primary' : 'text-white/60 group-hover:text-white'}`}>screenshot</span>
                        </div>
                        <span className={`text-[8px] uppercase tracking-[0.3em] font-black ${showInfoPanel ? 'text-primary' : 'text-white/40 group-hover:text-white/80'}`}>Info</span>
                    </button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-Purge Feedback Toast */}
      <AnimatePresence>
        {purgeToastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[160] px-4 py-3 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-emerald-500/30 text-white shadow-2xl flex items-center gap-2.5 max-w-md mx-auto"
          >
            <div className="size-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check size={14} />
            </div>
            <span className="text-[10px] font-medium leading-tight text-white/90">
              {purgeToastMessage}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

History.displayName = 'History';