import React, { useState, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { HistoryItem, AppRoute, AccountState } from '../types';
import { Header } from './Header';
import { supabase } from '../services/supabase';
import { Globe, Share2 } from 'lucide-react';
import { downloadImage } from '../services/utils';

interface HistoryProps {
  history: HistoryItem[];
  onNavigate: (route: AppRoute) => void;
  onRemix?: (item: HistoryItem) => void;
  onDelete?: (ids: string[]) => void;
  accountState: AccountState;
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

export const History: React.FC<HistoryProps> = memo(({ history, onNavigate, onRemix, onDelete, accountState }) => {
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState(0);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

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
            {groupedHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[60vh] text-white/40">
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

                                return (
                                    <motion.div 
                                        key={item.id}
                                        onClick={() => {
                                            if (isSelectionMode) {
                                                toggleItemSelection(item.id);
                                            } else {
                                                setFullscreenImageIndex(globalIndex);
                                            }
                                        }}
                                        className={`relative break-inside-avoid cursor-pointer group rounded-2xl overflow-hidden border transition-all mb-4 will-change-transform ${isSelected ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-black' : 'border-white/5 hover:border-white/20'}`}
                                    >
                                        <img 
                                            src={item.url} 
                                            className="w-full h-auto block" 
                                            alt="thumbnail" 
                                            loading="lazy" 
                                            style={{ aspectRatio: `${item.width}/${item.height}` }}
                                        />
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
                            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Seed</p>
                                    <p className="text-xs font-mono text-white/60">{currentFullscreenItem.seed}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Scale</p>
                                    <p className="text-xs font-mono text-white/60">{currentFullscreenItem.width}x{currentFullscreenItem.height}</p>
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
    </motion.div>
  );
});

History.displayName = 'History';