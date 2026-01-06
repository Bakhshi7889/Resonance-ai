import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { generateImageUrl, getRandomSeed } from '../services/pollinations';
import { AppRoute, AppSettings, HistoryItem, ASPECT_RATIOS, AVAILABLE_MODELS, MODEL_STYLES } from '../types';

interface ImageGeneratorProps {
  settings: AppSettings;
  onNavigate: (route: AppRoute) => void;
  onAddToHistory: (item: HistoryItem) => void;
  updateSettings?: (s: Partial<AppSettings>) => void;
  remixItem?: HistoryItem | null;
  onClearRemix?: () => void;
  // Lifted State Props
  sessionPrompt: string;
  setSessionPrompt: (prompt: string) => void;
  sessionImages: string[];
  setSessionImages: React.Dispatch<React.SetStateAction<string[]>>;
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
  // Use passed props for state
  const prompt = sessionPrompt;
  const setPrompt = setSessionPrompt;
  const currentImages = sessionImages;
  const setCurrentImages = setSessionImages;

  const [isLoading, setIsLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Local settings state
  const [localSettings, setLocalSettings] = useState(globalSettings);
  const [showSettings, setShowSettings] = useState(false);

  // Fullscreen State
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState(0);

  // Sync global settings
  useEffect(() => {
    setLocalSettings(globalSettings);
  }, [globalSettings]);

  // Handle Remix
  useEffect(() => {
    if (remixItem) {
        setPrompt(remixItem.prompt);
        // Reset active style to avoid double application
        updateLocalSetting('activeStyle', ''); 
        
        // Update other settings
        if (updateSettings) {
            updateSettings({
                model: remixItem.model,
                width: remixItem.width,
                height: remixItem.height,
                enhance: remixItem.enhance,
                negativePrompt: remixItem.negativePrompt || '',
                quality: remixItem.quality || 'medium',
                activeStyle: ''
            });
        }
        
        if (onClearRemix) onClearRemix();
    }
  }, [remixItem]);

  // Timer logic
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      const startTime = Date.now();
      setElapsedTime(0);
      interval = setInterval(() => {
        setElapsedTime((Date.now() - startTime) / 1000);
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleGenerate = async () => {
    if (!prompt) return;
    
    setShowSettings(false); 
    setIsLoading(true);
    
    const count = localSettings.imageCount || 1;
    const newImages: string[] = [];
    const batchId = crypto.randomUUID(); // Unique ID for this batch

    // Find active style suffix
    const activeStyle = MODEL_STYLES.find(s => s.id === localSettings.activeStyle);
    const promptWithStyle = (activeStyle && activeStyle.model === localSettings.model) 
        ? `${prompt}${activeStyle.suffix}` 
        : prompt;

    // Generate multiple images
    for (let i = 0; i < count; i++) {
        const newSeed = getRandomSeed() + i; 
        const params = {
          prompt: promptWithStyle,
          model: localSettings.model,
          width: localSettings.width,
          height: localSettings.height,
          seed: newSeed,
          enhance: localSettings.enhance,
          nologo: true,
          negativePrompt: localSettings.negativePrompt,
          quality: localSettings.quality
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

    // Preload images
    await Promise.all(newImages.map(url => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = url;
            img.onload = resolve;
            img.onerror = resolve; 
        });
    }));

    // Add new images to the START of the list
    setCurrentImages(prev => [...newImages, ...prev]);
    setIsLoading(false);
  };

  const handleDownload = async (url: string) => {
    try {
      // Fetch the image to get a blob
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor
      const link = document.createElement('a');
      link.href = blobUrl;
      const filename = `resonance-${Date.now()}.jpg`; 
      link.download = filename;
      document.body.appendChild(link);
      
      // Trigger click
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback if CORS or other issues prevent blob download
      window.open(url, '_blank');
    }
  };

  const updateLocalSetting = (key: keyof AppSettings, value: any) => {
      setLocalSettings(prev => ({ ...prev, [key]: value }));
      if (updateSettings) updateSettings({ [key]: value });
  };

  // Fullscreen Navigation Handlers
  const handleNext = () => {
    if (fullscreenIndex !== null && fullscreenIndex < currentImages.length - 1) {
        setSlideDirection(1);
        setFullscreenIndex(fullscreenIndex + 1);
    }
  };

  const handlePrev = () => {
    if (fullscreenIndex !== null && fullscreenIndex > 0) {
        setSlideDirection(-1);
        setFullscreenIndex(fullscreenIndex - 1);
    }
  };

  const handleFullscreenDragEnd = (e: any, { offset, velocity }: PanInfo) => {
    const swipeThreshold = 50;
    const velocityThreshold = 400;

    // Swipe Down to Close
    // Prioritize vertical swipe if it is dominant
    if (offset.y > 100 || (velocity.y > 500 && offset.y > 20)) {
        setFullscreenIndex(null);
        return;
    }
    
    // Horizontal Swipes
    // Check if horizontal movement is significant
    if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > velocityThreshold) {
        // Ensure we are swiping more horizontally than vertically to avoid accidental triggers
        if (Math.abs(offset.x) > Math.abs(offset.y)) {
            if (offset.x < 0) {
                // Swipe Left -> Next
                handleNext();
            } else {
                // Swipe Right -> Prev
                handlePrev();
            }
        }
    }
  };

  const handleSettingsDragEnd = (e: any, { offset, velocity }: PanInfo) => {
    if (offset.y > 80 || velocity.y > 400) {
        setShowSettings(false);
    }
  };

  const renderRatioIcon = (width: number, height: number, active: boolean) => {
      const ratio = width / height;
      const strokeColor = active ? "currentColor" : "currentColor";
      const opacity = active ? 1 : 0.4;
      
      let path;
      if (ratio === 1) { // 1:1
          path = <rect x="5" y="5" width="14" height="14" rx="2" stroke={strokeColor} strokeWidth="2" fill="none" opacity={opacity} />;
      } else if (ratio > 1.7) { // 16:9
          path = <rect x="2" y="7" width="20" height="10" rx="2" stroke={strokeColor} strokeWidth="2" fill="none" opacity={opacity} />;
      } else if (ratio > 1.3) { // 4:3
          path = <rect x="3" y="5" width="18" height="14" rx="2" stroke={strokeColor} strokeWidth="2" fill="none" opacity={opacity} />;
      } else if (ratio < 0.6) { // 9:16
          path = <rect x="7" y="2" width="10" height="20" rx="2" stroke={strokeColor} strokeWidth="2" fill="none" opacity={opacity} />;
      } else { // 3:4
          path = <rect x="5" y="3" width="14" height="18" rx="2" stroke={strokeColor} strokeWidth="2" fill="none" opacity={opacity} />;
      }

      return (
        <svg width="24" height="24" viewBox="0 0 24 24" className={`transition-all ${active ? 'text-white scale-110' : 'text-white group-hover:text-white'}`}>
            {path}
        </svg>
      );
  };

  // Filter styles for current model
  const availableStyles = MODEL_STYLES.filter(s => s.model === localSettings.model);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full relative"
    >
      {/* Settings Backdrop Overlay - Catches clicks outside the menu */}
      <AnimatePresence>
        {showSettings && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px]"
                onClick={() => setShowSettings(false)}
            />
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="absolute top-6 left-0 right-0 z-50 flex justify-between px-6 pointer-events-none max-w-7xl mx-auto w-full">
          {/* Account Button (Top Left) */}
          <button 
            onClick={() => onNavigate(AppRoute.PREFERENCES)}
            className="pointer-events-auto flex size-10 items-center justify-center rounded-full glass-panel text-white hover:bg-white/10 transition-colors relative shadow-lg active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">person</span>
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

      <div 
        className={`flex-1 flex flex-col items-center gap-6 px-4 pt-20 overflow-y-auto no-scrollbar w-full max-w-7xl mx-auto ${currentImages.length > 0 ? 'justify-start pb-48' : 'justify-center pb-64 min-h-0'}`} 
      >
        {/* Main Image Display Area */}
        <div className={`w-full relative group z-0 flex items-center justify-center ${currentImages.length > 0 ? 'min-h-[300px]' : 'flex-1'}`}>
          
          {/* Ambient Glow */}
          <div className={`absolute -inset-1 bg-gradient-to-b from-primary/40 to-purple-600/40 rounded-[2.5rem] blur-2xl transition-all duration-1000 ${isLoading ? 'opacity-80 scale-105' : (currentImages.length > 0 ? 'opacity-50' : 'opacity-20')}`}></div>
          
           {/* Central Loading / Empty State Orb */}
           <AnimatePresence mode="wait">
            {(currentImages.length === 0 || isLoading) && (
               <motion.div 
                 key="orb-container"
                 initial={{ opacity: 0, scale: 0.9 }} 
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                 className={`absolute inset-0 z-20 flex flex-col items-center justify-center text-center w-full h-full pointer-events-none`}
               >
                 {/* The Orb */}
                 <div className="relative">
                    {/* Outer Glow Ring - Pulses when loading */}
                    <motion.div 
                        animate={isLoading ? { 
                            scale: [1, 1.5, 1],
                            opacity: [0.3, 0.6, 0.3],
                        } : {
                             scale: [1, 1.2, 1],
                             opacity: [0.3, 0.5, 0.3], 
                        }}
                        transition={{ 
                            duration: isLoading ? 2 : 4, 
                            repeat: Infinity,
                            ease: "easeInOut" 
                        }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-64 bg-gradient-to-r from-primary/30 to-purple-500/30 rounded-full blur-[60px]"
                    />

                    {/* Core Orb */}
                    <motion.div
                        animate={isLoading ? { rotate: 360, scale: [1, 1.1, 1] } : { rotate: 0 }}
                        transition={isLoading ? { 
                            rotate: { duration: 3, ease: "linear", repeat: Infinity },
                            scale: { duration: 1.5, ease: "easeInOut", repeat: Infinity } 
                        } : {}}
                        className="relative size-24 rounded-[2rem] bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shadow-glass backdrop-blur-md z-10"
                    >
                         {/* Inner Spinning Ring for loading */}
                        {isLoading && (
                            <motion.div 
                                className="absolute inset-0 rounded-[2rem] border-t-2 border-primary border-r-2 border-transparent"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                        )}
                        
                        <span className={`material-symbols-outlined text-5xl text-white/90 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all duration-500 ${isLoading ? 'scale-75 opacity-80' : 'scale-100'}`}>
                            {isLoading ? 'hourglass_empty' : 'auto_awesome'}
                        </span>
                    </motion.div>
                 </div>
                 
                 {/* Text Content */}
                 <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 space-y-2 relative z-10"
                 >
                    <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-lg">
                        {isLoading ? 'Dreaming...' : 'Ready to Dream'}
                    </h2>
                    <p className="text-sm text-white/50 max-w-[220px] mx-auto leading-relaxed font-medium">
                        {isLoading 
                            ? `Visualizing your thought (${elapsedTime.toFixed(1)}s)` 
                            : 'Ignite your imagination. Describe a scene below.'}
                    </p>
                 </motion.div>
               </motion.div>
            )}
            </AnimatePresence>

          {/* Result Container */}
          {currentImages.length > 0 && (
             <motion.div 
                animate={isLoading ? { opacity: 0.3, filter: "blur(4px)", scale: 0.98 } : { opacity: 1, filter: "blur(0px)", scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full relative z-10"
             >
                {/* Horizontal Scroll for All Images in Session */}
                {/* Desktop: Use larger images and centered scrolling */}
                <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory w-full pb-4 no-scrollbar items-center">
                    {currentImages.map((imgUrl, idx) => (
                        <div 
                            key={idx}
                            onClick={() => setFullscreenIndex(idx)}
                            className="relative shrink-0 w-[85%] md:w-auto md:h-[60vh] snap-center overflow-hidden rounded-[2rem] bg-surface-dark border border-white/10 shadow-2xl ring-1 ring-white/5 flex items-center justify-center transition-all duration-500 first:ml-[7.5%] last:mr-[7.5%] md:first:ml-[25%] md:last:mr-[25%] cursor-pointer active:scale-[0.98]"
                            style={{ aspectRatio: localSettings.width / localSettings.height }}
                        >
                            <img 
                                src={imgUrl} 
                                alt={`Generated Content ${idx + 1}`} 
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute top-4 left-4 z-20 pointer-events-none">
                                <div className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-white/90">#{currentImages.length - idx}</span>
                                </div>
                            </div>
                            <div className="absolute top-4 right-4 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="glass-panel size-8 rounded-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[16px] text-white">fullscreen</span>
                                </div>
                            </div>
                            <div className="absolute bottom-4 right-4 flex gap-2 z-20">
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        handleDownload(imgUrl);
                                    }}
                                    className="glass-panel size-10 flex items-center justify-center rounded-full text-white hover:bg-white/20 transition-all active:scale-95 hover:shadow-glow"
                                >
                                    <span className="material-symbols-outlined text-[20px]">download</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
             </motion.div>
          )}
        </div>
      </div>

      {/* Bottom Bar Container */}
      {/* Responsive: On mobile, full width bottom. On Desktop, floating centered capsule. */}
      <div className="fixed bottom-0 left-0 w-full z-40 pointer-events-none bg-gradient-to-t from-[#101622] via-[#101622] to-transparent pt-4 pb-4 px-4 md:bg-none md:bottom-6 md:flex md:justify-center">
        
        {/* Style Chips - Wrapped in container to match Input width on desktop */}
        {availableStyles.length > 0 && !showSettings && (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full md:max-w-2xl mx-auto overflow-x-auto no-scrollbar pb-3 mb-1 pointer-events-auto"
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
                        <span className="text-[11px] font-bold tracking-wide">{style.label}</span>
                    </button>
                    ))}
                </div>
            </motion.div>
        )}

        <div className="mx-auto w-full max-w-md md:max-w-2xl bg-[#192233]/90 backdrop-blur-md rounded-[2rem] shadow-liquid border border-white/10 ring-1 ring-white/5 transition-all duration-300 overflow-hidden relative z-50 pointer-events-auto">
          
          {/* Prompt Input Section */}
          <div className="relative w-full flex flex-col gap-2 p-2">
            <div className="flex items-start gap-3 w-full px-2">
              <span className="material-symbols-outlined text-primary mt-3 select-none text-[24px]">edit_note</span>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onClick={() => setShowSettings(false)}
                className="w-full bg-transparent border-none text-white text-base placeholder:text-white/30 focus:ring-0 resize-none p-2 leading-relaxed min-h-[50px] font-medium" 
                placeholder="Describe your dream..." 
                rows={1}
                style={{ minHeight: '3rem' }}
              />
            </div>
            
            <div className="flex items-center justify-between gap-3 px-2 pb-1">
               {/* Toggle Settings Button */}
               <div 
                 onClick={() => setShowSettings(!showSettings)}
                 className="flex-1 flex items-center gap-2 overflow-hidden cursor-pointer group"
               >
                   <div className={`size-8 rounded-full flex items-center justify-center border transition-colors ${showSettings ? 'bg-primary text-white border-primary' : 'bg-white/5 border-white/10 text-white/60 group-hover:bg-white/10 group-hover:text-white'}`}>
                        <span className="material-symbols-outlined text-[18px]">{showSettings ? 'expand_more' : 'tune'}</span>
                   </div>
                   <div className="flex flex-col overflow-hidden">
                       <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Settings</span>
                       <span className="text-xs text-white truncate font-medium">
                           {localSettings.width === localSettings.height ? 'Square' : 'Custom'} • {AVAILABLE_MODELS.find(m => m.id === localSettings.model)?.name.split(' ')[0]}
                       </span>
                   </div>
               </div>

               {/* Generate Button */}
               <button 
                onClick={handleGenerate}
                disabled={isLoading || !prompt}
                className="relative overflow-hidden h-12 px-6 rounded-full bg-gradient-to-r from-primary to-blue-600 flex items-center gap-2 shadow-glow hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
               >
                 <span className="text-sm font-bold text-white tracking-wide">{isLoading ? 'STOP' : 'GENERATE'}</span>
                 {localSettings.imageCount > 1 && (
                     <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{localSettings.imageCount}</span>
                 )}
               </button>
            </div>
          </div>

          {/* Expandable Settings Section */}
          <AnimatePresence>
            {showSettings && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={{ top: 0, bottom: 0.4 }}
                    onDragEnd={handleSettingsDragEnd}
                    className="border-t border-white/5 bg-black/20 touch-pan-x"
                >
                    {/* Handle for swipe gesture hint */}
                    <div className="w-full flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing">
                        <div className="w-12 h-1 bg-white/20 rounded-full" />
                    </div>

                    <div className="p-4 flex flex-col gap-4 pb-6">
                        {/* Models List */}
                        <div>
                             <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-2 pl-1">AI Model</p>
                             <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                {AVAILABLE_MODELS.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => {
                                            updateLocalSetting('model', m.id);
                                            updateLocalSetting('activeStyle', ''); // Reset style on model change
                                        }}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all shrink-0 ${localSettings.model === m.id ? 'bg-primary/20 border-primary text-white' : 'bg-white/5 border-transparent text-white/60 hover:bg-white/10'}`}
                                    >
                                        <span className="text-xs font-medium">{m.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Image Count Selector */}
                         <div>
                             <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-2 pl-1">Image Count</p>
                             <div className="flex gap-2 bg-[#111722] p-1 rounded-xl border border-white/5">
                                {[1, 2, 3, 4].map(count => (
                                    <button
                                        key={count}
                                        onClick={() => updateLocalSetting('imageCount', count)}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${localSettings.imageCount === count ? 'bg-surface-dark text-white shadow-sm ring-1 ring-white/10' : 'text-white/30 hover:text-white'}`}
                                    >
                                        {count}
                                    </button>
                                ))}
                             </div>
                        </div>

                        {/* Aspect Ratio SVGs */}
                        <div>
                             <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-2 pl-1">Ratio</p>
                             <div className="flex justify-between gap-2 bg-[#111722] p-2 rounded-xl border border-white/5">
                                {ASPECT_RATIOS.map((ratio) => {
                                  const isActive = localSettings.width === ratio.width && localSettings.height === ratio.height;
                                  return (
                                    <button 
                                        key={ratio.label}
                                        onClick={() => {
                                            updateLocalSetting('width', ratio.width);
                                            updateLocalSetting('height', ratio.height);
                                        }}
                                        className={`flex-1 flex flex-col items-center justify-center py-2 rounded-lg gap-1 transition-all group ${isActive ? 'bg-surface-dark shadow-sm' : 'hover:bg-white/5'}`}
                                        title={ratio.label}
                                    >
                                        {renderRatioIcon(ratio.width, ratio.height, isActive)}
                                        <span className={`text-[10px] font-medium ${isActive ? 'text-white' : 'text-white/30 group-hover:text-white/50'}`}>{ratio.label}</span>
                                    </button>
                                  );
                                })}
                             </div>
                        </div>

                         {/* Quality & Enhance */}
                        <div className="flex gap-2">
                             {/* Enhance Toggle */}
                            <div 
                                onClick={() => updateLocalSetting('enhance', !localSettings.enhance)}
                                className="flex-1 flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 active:bg-white/10 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-2">
                                    <span className={`material-symbols-outlined text-[18px] ${localSettings.enhance ? 'text-primary' : 'text-white/40'}`}>auto_fix</span>
                                    <span className="text-xs font-medium text-white">Enhance</span>
                                </div>
                                <div className={`w-8 h-4 rounded-full relative transition-colors ${localSettings.enhance ? 'bg-primary' : 'bg-white/10'}`}>
                                    <div className={`absolute top-0.5 left-0.5 size-3 bg-white rounded-full transition-transform ${localSettings.enhance ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                            </div>

                             {/* Upscale/Quality Toggle - Only for Flux */}
                             {localSettings.model === 'flux' && (
                                <div 
                                    onClick={() => updateLocalSetting('quality', localSettings.quality === 'hd' ? 'medium' : 'hd')}
                                    className="flex-1 flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 active:bg-white/10 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`material-symbols-outlined text-[18px] ${localSettings.quality === 'hd' ? 'text-primary' : 'text-white/40'}`}>hd</span>
                                        <span className="text-xs font-medium text-white">Upscale</span>
                                    </div>
                                    <div className={`w-8 h-4 rounded-full relative transition-colors ${localSettings.quality === 'hd' ? 'bg-primary' : 'bg-white/10'}`}>
                                        <div className={`absolute top-0.5 left-0.5 size-3 bg-white rounded-full transition-transform ${localSettings.quality === 'hd' ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                </div>
                             )}
                        </div>

                        {/* Negative Prompt */}
                         <div>
                             <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-2 pl-1">Negative Prompt</p>
                             <div className="flex items-center bg-white/5 rounded-xl border border-white/5 px-3 py-2">
                                <span className="material-symbols-outlined text-white/40 text-[18px] mr-2">block</span>
                                <input 
                                    type="text" 
                                    value={localSettings.negativePrompt || ''}
                                    onChange={(e) => updateLocalSetting('negativePrompt', e.target.value)}
                                    placeholder="What to exclude (e.g. blurry, nsfw)"
                                    className="w-full bg-transparent border-none text-xs text-white placeholder:text-white/20 focus:ring-0 p-0"
                                />
                             </div>
                        </div>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Fullscreen Overlay */}
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
                            <span className="text-white/60 font-mono text-xs">
                                {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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

                    {/* Hint Text */}
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="absolute bottom-24 left-1/2 -translate-x-1/2 text-white/30 text-[10px] pointer-events-none"
                    >
                        Swipe down to close
                    </motion.div>
                </div>

                {/* Bottom Actions */}
                <div 
                    className="p-6 pb-12 flex justify-center gap-6 z-20 bg-gradient-to-t from-black/90 to-transparent" 
                    onClick={(e) => e.stopPropagation()}
                >
                     <button 
                        onClick={() => handleDownload(currentImages[fullscreenIndex])}
                        className="flex flex-col items-center gap-1 min-w-[60px] text-white/80 hover:text-white transition-colors"
                    >
                        <div className="size-12 rounded-full bg-white/10 flex items-center justify-center mb-1 backdrop-blur-md">
                             <span className="material-symbols-outlined text-[20px]">download</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wide font-bold">Save</span>
                    </button>
                    
                    <button 
                        onClick={() => {
                            // Copy to clipboard
                            navigator.clipboard.writeText(currentImages[fullscreenIndex]);
                        }}
                        className="flex flex-col items-center gap-1 min-w-[60px] text-white/80 hover:text-white transition-colors"
                    >
                        <div className="size-12 rounded-full bg-white/10 flex items-center justify-center mb-1 backdrop-blur-md">
                             <span className="material-symbols-outlined text-[20px]">content_copy</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wide font-bold">Copy</span>
                    </button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};