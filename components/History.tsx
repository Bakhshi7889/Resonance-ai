
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { HistoryItem, AppRoute } from '../types';
import { Header } from './Header';

interface HistoryProps {
  history: HistoryItem[];
  onNavigate: (route: AppRoute) => void;
  onRemix?: (item: HistoryItem) => void;
  onDelete?: (ids: string[]) => void;
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

export const History: React.FC<HistoryProps> = ({ history, onNavigate, onRemix, onDelete }) => {
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState(0);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  // Group history items by Date (Day)
  const groupedHistory = useMemo(() => {
    const groups: { [key: string]: HistoryItem[] } = {};
    const dates: string[] = []; // Keep order
    
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

  // Toggle Selection Mode
  const toggleSelectionMode = () => {
      if (isSelectionMode) {
          setIsSelectionMode(false);
          setSelectedIds([]);
      } else {
          setIsSelectionMode(true);
      }
  };

  const toggleItemSelection = (id: string) => {
      setSelectedIds(prev => {
          if (prev.includes(id)) {
              return prev.filter(itemId => itemId !== id);
          } else {
              return [...prev, id];
          }
      });
  };

  const toggleGroupSelection = (items: HistoryItem[]) => {
      const allIds = items.map(i => i.id);
      const allSelected = allIds.every(id => selectedIds.includes(id));

      if (allSelected) {
          // Deselect all in group
          setSelectedIds(prev => prev.filter(id => !allIds.includes(id)));
      } else {
          // Select all in group (unique)
          setSelectedIds(prev => [...new Set([...prev, ...allIds])]);
      }
      
      if (!isSelectionMode) setIsSelectionMode(true);
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
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `resonance-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
        window.open(url, '_blank');
    }
  };

  const handleCopyLink = () => {
      if (currentFullscreenItem) {
        navigator.clipboard.writeText(currentFullscreenItem.url);
        setShowCopiedToast(true);
        setTimeout(() => setShowCopiedToast(false), 2000);
      }
  };

  return (
    <motion.div 
      className="flex flex-col h-full bg-background-dark w-full relative"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      <div className="w-full max-w-7xl mx-auto flex flex-col h-full">
        <Header 
            title={isSelectionMode ? `${selectedIds.length} Selected` : "History"} 
            leftIcon={isSelectionMode ? "close" : "arrow_back_ios_new"}
            onLeftClick={isSelectionMode ? toggleSelectionMode : () => onNavigate(AppRoute.GENERATOR)}
            rightIcon={isSelectionMode ? (selectedIds.length > 0 ? "delete" : undefined) : "checklist"}
            onRightClick={isSelectionMode ? (selectedIds.length > 0 ? () => setShowDeleteConfirm(true) : undefined) : toggleSelectionMode}
        />

        <div className="flex-1 overflow-y-auto no-scrollbar pb-24 px-4">
            {groupedHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[60vh] text-white/40">
                    <span className="material-symbols-outlined text-6xl mb-4">image_not_supported</span>
                    <p>No history yet</p>
                </div>
            )}

            <div className="flex flex-col gap-8 py-4">
                {groupedHistory.map((group) => {
                    const allInGroupSelected = group.items.every(i => selectedIds.includes(i.id));
                    return (
                    <div key={group.title} className="flex flex-col gap-4">
                        <div className="sticky top-0 bg-background-dark/95 backdrop-blur-md py-3 z-10 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-white/50 text-xs font-bold uppercase tracking-widest">
                                {group.title}
                            </h3>
                            {(isSelectionMode || selectedIds.length > 0) && (
                                <button 
                                    onClick={() => toggleGroupSelection(group.items)}
                                    className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${allInGroupSelected ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-white/60'}`}
                                >
                                    {allInGroupSelected ? 'Deselect Day' : 'Select Day'}
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4">
                            {group.items.map((item) => {
                                const globalIndex = history.findIndex(h => h.id === item.id);
                                const isSelected = selectedIds.includes(item.id);
                                return (
                                    <motion.div 
                                        key={item.id}
                                        layoutId={`thumb-${item.id}`}
                                        onClick={() => isSelectionMode ? toggleItemSelection(item.id) : setFullscreenImageIndex(globalIndex)}
                                        className={`relative aspect-square bg-surface-dark overflow-hidden cursor-pointer group rounded-xl border transition-all ${isSelected ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background-dark' : 'border-white/5 hover:border-white/20'}`}
                                    >
                                        <motion.img 
                                            src={item.url} 
                                            className="w-full h-full object-cover" 
                                            alt="thumbnail" 
                                            loading="lazy"
                                            animate={isSelectionMode && isSelected ? { scale: 0.9 } : { scale: 1 }}
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
                )})}
            </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
          {showDeleteConfirm && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
              >
                  <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-[#192233] border border-white/10 rounded-[2rem] p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 text-center"
                  >
                       <div className="size-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
                          <span className="material-symbols-outlined text-[28px]">delete</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">Delete {selectedIds.length} items?</h3>
                      
                      <div className="flex gap-3 mt-2">
                          <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-white font-medium">Cancel</button>
                          <button onClick={handleConfirmDelete} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold">Delete</button>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* Fullscreen Swiper Overlay */}
      <AnimatePresence>
        {fullscreenImageIndex !== null && currentFullscreenItem && !isSelectionMode && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black flex flex-col"
                onClick={() => setFullscreenImageIndex(null)}
            >
                 <div className="absolute top-0 left-0 right-0 p-6 pt-8 flex justify-between items-start z-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                     <div className="flex flex-col pointer-events-auto max-w-[80%]">
                        <span className="text-white/60 font-mono text-xs mb-1">
                            {new Date(currentFullscreenItem.timestamp).toLocaleString()}
                        </span>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setFullscreenImageIndex(null); }}
                        className="size-10 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-md pointer-events-auto hover:bg-white/20"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex-1 flex items-center justify-center relative w-full h-full overflow-hidden">
                    <AnimatePresence initial={false} custom={slideDirection}>
                        <motion.div
                            key={currentFullscreenItem.id}
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
                                src={currentFullscreenItem.url} 
                                className="max-w-full max-h-full object-contain shadow-2xl"
                                alt="fullscreen" 
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div 
                    className="absolute bottom-0 left-0 right-0 p-6 pb-12 flex justify-center gap-6 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent" 
                    onClick={(e) => e.stopPropagation()}
                >
                    <button 
                        onClick={() => handleDownload(currentFullscreenItem.url)}
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

                    {onRemix && (
                        <button 
                            onClick={() => onRemix(currentFullscreenItem)}
                            className="flex flex-col items-center gap-1 min-w-[60px] text-white/80 hover:text-white transition-colors"
                        >
                            <div className="size-12 rounded-full bg-white/10 flex items-center justify-center mb-1 backdrop-blur-md border border-white/5 active:bg-white/20">
                                <span className="material-symbols-outlined text-[20px]">edit</span>
                            </div>
                            <span className="text-[10px] uppercase tracking-wide font-bold">Remix</span>
                        </button>
                    )}

                    <button 
                        onClick={() => setShowInfoPanel(!showInfoPanel)}
                        className={`flex flex-col items-center gap-1 min-w-[60px] transition-colors ${showInfoPanel ? 'text-primary' : 'text-white/80 hover:text-white'}`}
                    >
                        <div className={`size-12 rounded-full flex items-center justify-center mb-1 backdrop-blur-md transition-colors ${showInfoPanel ? 'bg-primary/20 border border-primary/30' : 'bg-white/10 border border-white/5'}`}>
                             <span className="material-symbols-outlined text-[20px]">info</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wide font-bold">Info</span>
                    </button>
                </div>

                <AnimatePresence>
                    {showCopiedToast && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="absolute bottom-32 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/80 backdrop-blur-md rounded-full border border-white/10 text-white text-xs font-bold pointer-events-none"
                        >
                            Link Copied
                        </motion.div>
                    )}
                </AnimatePresence>

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
                                        {decodeURIComponent(currentFullscreenItem.prompt)}
                                    </div>
                                </div>

                                {currentFullscreenItem.styleSuffix && (
                                    <div>
                                        <h4 className="text-xs font-bold text-purple-400/60 uppercase tracking-widest mb-2">Spice (Added)</h4>
                                        <div className="text-xs text-white/80 leading-relaxed font-mono bg-purple-500/10 p-3 rounded-xl border border-purple-500/20 select-text">
                                            {currentFullscreenItem.styleSuffix}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Model</h4>
                                        <span className="px-2 py-0.5 rounded bg-white/10 text-xs font-bold text-white uppercase">{currentFullscreenItem.model}</span>
                                    </div>
                                    {currentFullscreenItem.styleLabel && (
                                         <div>
                                            <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Style</h4>
                                            <span className="px-2 py-0.5 rounded bg-primary/20 text-xs font-bold text-primary border border-primary/20">{currentFullscreenItem.styleLabel}</span>
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Seed</h4>
                                        <span className="text-sm text-white font-mono">{currentFullscreenItem.seed}</span>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Size</h4>
                                        <span className="text-sm text-white">{currentFullscreenItem.width} x {currentFullscreenItem.height}</span>
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
