import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { HistoryItem, AppRoute } from '../types';
import { Header } from './Header';

interface HistoryProps {
  history: HistoryItem[];
  onNavigate: (route: AppRoute) => void;
  onRemix?: (item: HistoryItem) => void;
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

export const History: React.FC<HistoryProps> = ({ history, onNavigate, onRemix }) => {
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState(0);

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

  // Navigate: Next (Newer Index -> Older Index)
  // In our list, Index 0 is newest. Index N is oldest.
  // Next Image -> Increment Index (Go to older image)
  // Visuals: Current image exits Left, Next image enters from Right. (Direction 1)
  const handleNextImage = () => {
    if (fullscreenImageIndex !== null && fullscreenImageIndex < history.length - 1) {
        setSlideDirection(1);
        setFullscreenImageIndex(fullscreenImageIndex + 1);
    }
  };

  // Navigate: Prev (Older Index -> Newer Index)
  // Prev Image -> Decrement Index (Go to newer image)
  // Visuals: Current image exits Right, Prev image enters from Left. (Direction -1)
  const handlePrevImage = () => {
    if (fullscreenImageIndex !== null && fullscreenImageIndex > 0) {
        setSlideDirection(-1);
        setFullscreenImageIndex(fullscreenImageIndex - 1);
    }
  };

  const handleDragEnd = (e: any, { offset, velocity }: PanInfo) => {
    const swipe = Math.abs(offset.x) * velocity.x;

    if (swipe < -200 || offset.x < -100) {
      // Swipe Left -> Next Image
      handleNextImage();
    } else if (swipe > 200 || offset.x > 100) {
      // Swipe Right -> Prev Image
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

  const handleShare = async (item: HistoryItem) => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Resonance AI Generation',
                text: item.prompt,
                url: item.url
            });
        } catch (err) {
            console.log("Share failed", err);
        }
    } else {
        navigator.clipboard.writeText(item.url);
        // Could show toast here
    }
  };

  return (
    <motion.div 
      className="flex flex-col h-full bg-background-dark w-full"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      <div className="w-full max-w-7xl mx-auto flex flex-col h-full">
        <Header 
            title="History" 
            leftIcon="arrow_back_ios_new" 
            onLeftClick={() => onNavigate(AppRoute.GENERATOR)}
            // rightIcon="search"
        />

        <div className="flex-1 overflow-y-auto no-scrollbar pb-24 px-4">
            {groupedHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[60vh] text-white/40">
                    <span className="material-symbols-outlined text-6xl mb-4">image_not_supported</span>
                    <p>No history yet</p>
                </div>
            )}

            <div className="flex flex-col gap-8 py-4">
                {groupedHistory.map((group) => (
                    <div key={group.title} className="flex flex-col gap-4">
                        <h3 className="text-white/50 text-xs font-bold uppercase tracking-widest sticky top-0 bg-background-dark/95 backdrop-blur-md py-3 z-10 border-b border-white/5">
                            {group.title}
                        </h3>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4">
                            {group.items.map((item) => {
                                // Find index in global history for fullscreen
                                const globalIndex = history.findIndex(h => h.id === item.id);
                                
                                return (
                                    <motion.div 
                                        key={item.id}
                                        layoutId={`thumb-${item.id}`}
                                        onClick={() => setFullscreenImageIndex(globalIndex)}
                                        className="relative aspect-square bg-surface-dark overflow-hidden cursor-pointer group rounded-xl border border-white/5 hover:border-white/20 transition-all"
                                    >
                                        <img 
                                            src={item.url} 
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                            alt="thumbnail" 
                                            loading="lazy"
                                        />
                                        {/* Selection Overlay */}
                                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Fullscreen Swiper Overlay */}
      <AnimatePresence>
        {fullscreenImageIndex !== null && currentFullscreenItem && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black flex flex-col"
                onClick={() => setFullscreenImageIndex(null)}
            >
                 {/* Top Controls */}
                <div className="absolute top-0 left-0 right-0 p-6 pt-8 flex justify-between items-start z-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                     <div className="flex flex-col pointer-events-auto max-w-[80%]">
                        <span className="text-white/60 font-mono text-xs mb-1">
                            {new Date(currentFullscreenItem.timestamp).toLocaleString()}
                        </span>
                        <p className="text-white text-sm font-medium line-clamp-2 leading-relaxed">
                            {currentFullscreenItem.prompt}
                        </p>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setFullscreenImageIndex(null); }}
                        className="size-10 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-md pointer-events-auto hover:bg-white/20"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Main Swiper Area */}
                <div className="flex-1 flex items-center justify-center relative w-full h-full overflow-hidden">
                    {/* Image Carousel */}
                    <AnimatePresence initial={false} custom={slideDirection}>
                        <motion.div
                            key={currentFullscreenItem.id}
                            custom={slideDirection}
                            variants={swipeVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 }
                            }}
                            className="absolute inset-0 flex items-center justify-center touch-pan-y"
                            onClick={(e) => e.stopPropagation()} 
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={1}
                            onDragEnd={handleDragEnd}
                        >
                            <img 
                                src={currentFullscreenItem.url}
                                className="max-w-full max-h-full object-contain shadow-2xl"
                                alt="Fullscreen"
                            />
                        </motion.div>
                    </AnimatePresence>

                    {/* Nav Arrows (Desktop/Access) */}
                    {fullscreenImageIndex > 0 && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                            className="absolute left-4 z-20 p-4 rounded-full bg-black/20 text-white/50 hover:text-white hover:bg-black/50 transition-all hidden md:flex"
                        >
                             <span className="material-symbols-outlined text-3xl">chevron_left</span>
                        </button>
                    )}
                    {fullscreenImageIndex < history.length - 1 && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                            className="absolute right-4 z-20 p-4 rounded-full bg-black/20 text-white/50 hover:text-white hover:bg-black/50 transition-all hidden md:flex"
                        >
                             <span className="material-symbols-outlined text-3xl">chevron_right</span>
                        </button>
                    )}
                </div>

                {/* Bottom Actions */}
                <div 
                    className="p-6 pb-10 flex justify-center gap-4 z-20 bg-gradient-to-t from-black/90 to-transparent" 
                    onClick={(e) => e.stopPropagation()}
                >
                    <button 
                        onClick={() => handleDownload(currentFullscreenItem.url)}
                        className="flex flex-col items-center gap-1 p-2 min-w-[60px] text-white/80 hover:text-white transition-colors"
                    >
                        <div className="size-12 rounded-full bg-white/10 flex items-center justify-center mb-1 backdrop-blur-md">
                             <span className="material-symbols-outlined text-[20px]">download</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wide font-bold">Save</span>
                    </button>
                    
                    <button 
                         onClick={() => { if (onRemix) onRemix(currentFullscreenItem); }}
                         className="flex flex-col items-center gap-1 p-2 min-w-[60px] text-white/80 hover:text-white transition-colors"
                    >
                        <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center mb-1 backdrop-blur-md border border-primary/20">
                            <span className="material-symbols-outlined text-[20px] text-primary">auto_fix_high</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wide font-bold">Remix</span>
                    </button>

                    <button 
                         onClick={() => handleShare(currentFullscreenItem)}
                         className="flex flex-col items-center gap-1 p-2 min-w-[60px] text-white/80 hover:text-white transition-colors"
                    >
                        <div className="size-12 rounded-full bg-white/10 flex items-center justify-center mb-1 backdrop-blur-md">
                            <span className="material-symbols-outlined text-[20px]">share</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wide font-bold">Share</span>
                    </button>
                </div>

            </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};