
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { generateImageUrl, getRandomSeed } from '../services/pollinations';
import { AppRoute, AppSettings, HistoryItem, AVAILABLE_MODELS, MODEL_STYLES, ASPECT_RATIOS } from '../types';

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

  // Prompt Box State
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fullscreen State
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState(0);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  
  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
                activeStyle: '',
                safe: remixItem.safe ?? true,
                transparent: remixItem.transparent ?? false,
                privateMode: true // Always force private on remix
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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        // Reset height to auto to get correct scrollHeight
        textareaRef.current.style.height = 'auto';
        
        if (isPromptExpanded) {
             textareaRef.current.style.height = '16rem'; 
        } else {
             const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
             textareaRef.current.style.height = `${Math.max(newHeight, 50)}px`;
        }
    }
  }, [prompt, isPromptExpanded]);

  const showToast = (message: string) => {
      setToastMessage(message);
      setTimeout(() => setToastMessage(null), 2000);
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    
    // 1. Close settings smoothly
    setShowSettings(false);
    setIsPromptExpanded(false); 
    
    // 2. Set loading state immediately for button feedback
    setIsLoading(true);
    
    // 3. Delay actual generation to show off the premium animation
    setTimeout(() => {
        const count = localSettings.imageCount || 1;
        const newImages: string[] = [];
        const batchId = crypto.randomUUID(); 

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
            apiKey: localSettings.apiKey,
            safe: localSettings.safe,
            private: true,
            transparent: localSettings.transparent
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

        // Add new images to the START of the list
        setCurrentImages(prev => [...newImages, ...prev]);
        setIsLoading(false); 
    }, 2000); // 2 second delay for the "dreaming" animation
  };

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
      console.error("Download failed:", error);
      window.open(url, '_blank');
      showToast("Download Started");
    }
  };

  const handleCopyLink = () => {
      if (fullscreenIndex !== null && currentImages[fullscreenIndex]) {
          navigator.clipboard.writeText(currentImages[fullscreenIndex]);
          showToast("Link Copied");
      }
  };

  const handleCopyImage = async () => {
    if (fullscreenIndex !== null && currentImages[fullscreenIndex]) {
        try {
            const response = await fetch(currentImages[fullscreenIndex]);
            const blob = await response.blob();
            const item = new ClipboardItem({ [blob.type]: blob });
            await navigator.clipboard.write([item]);
            showToast("Image Copied");
        } catch (err) {
            console.error('Failed to copy image:', err);
            // Fallback to link
            navigator.clipboard.writeText(currentImages[fullscreenIndex]);
            showToast("Link Copied (Image Copy Failed)");
        }
    }
  };

  const updateLocalSetting = (key: keyof AppSettings, value: any) => {
      setLocalSettings(prev => ({ ...prev, [key]: value }));
      if (updateSettings) updateSettings({ [key]: value });
  };

  const setAspectRatio = (width: number, height: number) => {
      updateLocalSetting('width', width);
      updateLocalSetting('height', height);
  };

  // Fullscreen Navigation Handlers
  const handleNext = () => {
    if (fullscreenIndex !== null && fullscreenIndex < currentImages.length - 1) {
        setSlideDirection(1);
        setFullscreenIndex(fullscreenIndex + 1);
        setShowInfoPanel(false);
    }
  };

  const handlePrev = () => {
    if (fullscreenIndex !== null && fullscreenIndex > 0) {
        setSlideDirection(-1);
        setFullscreenIndex(fullscreenIndex - 1);
        setShowInfoPanel(false);
    }
  };

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
                handleNext();
            } else {
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

  // Filter styles for current model
  const availableStyles = MODEL_STYLES.filter(s => s.model === localSettings.model);
  
  // Extract info from URL for display
  const getInfoFromUrl = (url: string) => {
      try {
          const urlObj = new URL(url);
          const params = new URLSearchParams(urlObj.search);
          return {
              seed: params.get('seed') || 'Random',
              model: params.get('model') || 'Unknown',
              width: params.get('width'),
              height: params.get('height')
          };
      } catch (e) {
          return { seed: '?', model: '?', width: '?', height: '?' };
      }
  };

  const showResults = currentImages.length > 0 || isLoading;

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
                className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[150] px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center gap-2"
            >
                <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
                <span className="text-sm font-bold text-white tracking-wide">{toastMessage}</span>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Backdrop Overlay */}
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
          <button 
            onClick={() => onNavigate(AppRoute.PREFERENCES)}
            className="pointer-events-auto flex size-10 items-center justify-center rounded-full glass-panel text-white hover:bg-white/10 transition-colors relative shadow-lg active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
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
        className={`flex-1 flex flex-col items-center gap-6 px-4 pt-20 overflow-y-auto no-scrollbar w-full max-w-7xl mx-auto ${showResults ? 'justify-start pb-48' : 'justify-center pb-64 min-h-0'}`} 
      >
        {/* Main Image Display Area */}
        <div className={`w-full relative group z-0 flex items-center justify-center ${showResults ? 'min-h-[300px]' : 'flex-1'}`}>
          
          <div className={`absolute -inset-1 bg-gradient-to-b from-primary/40 to-purple-600/40 rounded-[2.5rem] blur-2xl transition-all duration-1000 will-change-transform ${showResults ? 'opacity-50' : 'opacity-20'}`}></div>
          
           <AnimatePresence mode="wait">
            {(!showResults) && (
               <motion.div 
                 key="orb-container"
                 initial={{ opacity: 0, scale: 0.9 }} 
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                 className={`absolute inset-0 z-20 flex flex-col items-center justify-center text-center w-full h-full pointer-events-none will-change-transform`}
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
                    <p className="text-sm text-white/50 max-w-[220px] mx-auto leading-relaxed font-medium">
                        Ignite your imagination. Describe a scene below.
                    </p>
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
                <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory w-full pb-4 no-scrollbar items-center">
                    
                    {/* Animated Placeholder while generating */}
                    {isLoading && (
                         <motion.div 
                            initial={{ opacity: 0, x: -50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, width: 0 }}
                            className="relative shrink-0 w-[85%] md:w-auto md:h-[60vh] snap-center overflow-hidden rounded-[2rem] bg-surface-dark border border-white/10 shadow-2xl flex items-center justify-center"
                            style={{ aspectRatio: localSettings.width / localSettings.height }}
                        >
                            {/* Liquid Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-blue-600/10 animate-pulse" />
                            
                            {/* Animated Orbs */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-[80px] animate-spin-slow" />
                            
                            {/* Central Pulsing Element */}
                            <div className="relative z-10 flex flex-col items-center gap-4">
                                <div className="relative size-16">
                                    <div className="absolute inset-0 bg-primary rounded-full blur-xl animate-breathing opacity-50" />
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 rounded-full border border-white/20 backdrop-blur-md flex items-center justify-center animate-spin-slow">
                                         <span className="material-symbols-outlined text-white/80">autorenew</span>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-white/60 tracking-widest animate-pulse">DREAMING...</span>
                            </div>
                        </motion.div>
                    )}

                    {currentImages.map((imgUrl, idx) => (
                        <div 
                            key={idx}
                            onClick={() => { setFullscreenIndex(idx); setShowInfoPanel(false); }}
                            className="relative shrink-0 w-[85%] md:w-auto md:h-[60vh] snap-center overflow-hidden rounded-[2rem] bg-surface-dark border border-white/10 shadow-2xl ring-1 ring-white/5 flex items-center justify-center transition-all duration-500 first:ml-[7.5%] last:mr-[7.5%] md:first:ml-[25%] md:last:mr-[25%] cursor-pointer active:scale-[0.98]"
                            style={{ aspectRatio: localSettings.width / localSettings.height }}
                        >
                            <img 
                                src={imgUrl} 
                                alt={`Generated Content ${idx + 1}`} 
                                className="w-full h-full object-cover min-h-[200px]"
                                loading="lazy"
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
                        </div>
                    ))}
                </div>
             </motion.div>
          )}
        </div>
      </div>

      {/* Bottom Bar Container */}
      <div className="fixed bottom-0 left-0 w-full z-40 pointer-events-none bg-gradient-to-t from-[#101622] via-[#101622] to-transparent pt-4 pb-4 px-4 md:bg-none md:bottom-6 md:flex md:justify-center">
        
        {/* Style Chips */}
        {availableStyles.length > 0 && !showSettings && !isPromptExpanded && (
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
                        <span className="text-xs font-bold tracking-wide">{style.label}</span>
                    </button>
                    ))}
                </div>
            </motion.div>
        )}

        <div className={`mx-auto w-full md:max-w-2xl bg-[#192233]/90 backdrop-blur-md rounded-[2rem] shadow-liquid border border-white/10 ring-1 ring-white/5 transition-all duration-300 overflow-hidden relative z-50 pointer-events-auto ${isPromptExpanded ? 'max-w-full rounded-t-[2rem] rounded-b-none md:rounded-[2rem] h-[50vh] md:h-auto' : 'max-w-md'}`}>
          
          {/* Prompt Input Section */}
          <div className="relative w-full flex flex-col gap-2 p-2">
            <div className="flex items-start gap-3 w-full px-2">
              <span className="material-symbols-outlined text-primary mt-3 select-none text-[24px]">edit_note</span>
              <textarea 
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onClick={() => setShowSettings(false)}
                className="w-full bg-transparent border-none text-white text-base placeholder:text-white/30 focus:ring-0 resize-none p-2 leading-relaxed font-medium transition-all" 
                placeholder="Describe your dream..." 
                rows={1}
                style={{ minHeight: '3rem' }}
              />
              <button 
                onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                className={`mt-2 p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors ${isPromptExpanded ? 'text-primary' : ''}`}
              >
                  <span className="material-symbols-outlined text-[20px]">
                      {isPromptExpanded ? 'close_fullscreen' : 'open_in_full'}
                  </span>
              </button>
            </div>
            
            <div className="flex items-center justify-between gap-3 px-2 pb-1">
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

               <button 
                onClick={handleGenerate}
                disabled={!prompt}
                className="relative overflow-hidden h-12 px-6 rounded-full bg-gradient-to-r from-primary to-blue-600 flex items-center gap-2 shadow-glow hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
               >
                 <span className="text-sm font-bold text-white tracking-wide">{isLoading ? 'QUEUED' : 'GENERATE'}</span>
                 {isLoading && (
                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                 )}
                 {localSettings.imageCount > 1 && !isLoading && (
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
                    <div className="w-full flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing">
                        <div className="w-12 h-1 bg-white/20 rounded-full" />
                    </div>

                    <div className="p-4 flex flex-col gap-6 pb-6">
                        
                         {/* Image Count Selector */}
                         <div>
                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-3 pl-1">Image Count</p>
                            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                                {[1, 2, 3, 4].map((count) => (
                                    <button
                                        key={count}
                                        onClick={() => updateLocalSetting('imageCount', count)}
                                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                                            localSettings.imageCount === count 
                                            ? 'bg-surface-highlight text-white shadow-lg ring-1 ring-white/10' 
                                            : 'text-white/40 hover:text-white'
                                        }`}
                                    >
                                        {count}
                                    </button>
                                ))}
                            </div>
                        </div>

                         {/* Aspect Ratio Selector */}
                        <div>
                             <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-3 pl-1">Ratio</p>
                             <div className="flex justify-between items-center bg-white/5 p-2 rounded-3xl border border-white/5 overflow-x-auto no-scrollbar gap-2">
                                {ASPECT_RATIOS.map((ratio) => {
                                    const isSelected = localSettings.width === ratio.width && localSettings.height === ratio.height;
                                    const w = ratio.width / (Math.max(ratio.width, ratio.height));
                                    const h = ratio.height / (Math.max(ratio.width, ratio.height));
                                    return (
                                        <button
                                            key={ratio.label}
                                            onClick={() => setAspectRatio(ratio.width, ratio.height)}
                                            className={`flex flex-col items-center justify-center gap-2 w-16 h-20 rounded-2xl transition-all shrink-0 ${
                                                isSelected 
                                                ? 'bg-surface-highlight text-white shadow-lg ring-1 ring-white/10' 
                                                : 'text-white/40 hover:text-white hover:bg-white/5'
                                            }`}
                                        >
                                            <div className={`flex items-center justify-center size-8`}>
                                                <div 
                                                    className={`border-2 transition-all rounded-sm ${isSelected ? 'border-white bg-white/20' : 'border-white/40'}`}
                                                    style={{ 
                                                        width: `${w * 20}px`, 
                                                        height: `${h * 20}px`
                                                    }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-bold">{ratio.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                         {/* Visual Style Selector */}
                        {availableStyles.length > 0 && (
                            <div>
                                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-3 pl-1">Style</p>
                                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                     <div 
                                        onClick={() => updateLocalSetting('activeStyle', '')}
                                        className={`relative shrink-0 w-24 h-32 rounded-xl overflow-hidden cursor-pointer border-2 transition-all group ${localSettings.activeStyle === '' ? 'border-primary ring-2 ring-primary/20' : 'border-white/10 hover:border-white/30'}`}
                                    >
                                        <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors flex items-center justify-center">
                                            <span className="material-symbols-outlined text-white/30 text-3xl">block</span>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                            <span className={`text-xs font-bold block text-center ${localSettings.activeStyle === '' ? 'text-primary' : 'text-white/60'}`}>None</span>
                                        </div>
                                    </div>

                                    {availableStyles.map((style) => (
                                        <div 
                                            key={style.id}
                                            onClick={() => updateLocalSetting('activeStyle', style.id)}
                                            className={`relative shrink-0 w-24 h-32 rounded-xl overflow-hidden cursor-pointer border-2 transition-all group ${localSettings.activeStyle === style.id ? 'border-primary ring-2 ring-primary/20' : 'border-white/10 hover:border-white/30'}`}
                                        >
                                            <img src={style.image} alt={style.label} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${localSettings.activeStyle === style.id ? 'opacity-100' : 'opacity-60 group-hover:opacity-80'}`} loading="lazy" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />
                                            <div className="absolute bottom-0 left-0 right-0 p-2">
                                                <span className={`text-xs font-bold block text-center truncate ${localSettings.activeStyle === style.id ? 'text-white' : 'text-white/80'}`}>{style.label}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Models & Other Settings (Simplified for cleaner drawer) */}
                        <div>
                             <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-3 pl-1">Configuration</p>
                             <div className="flex flex-col gap-3">
                                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                    {AVAILABLE_MODELS.map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => {
                                                updateLocalSetting('model', m.id);
                                                updateLocalSetting('activeStyle', '');
                                            }}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all shrink-0 ${localSettings.model === m.id ? 'bg-primary/20 border-primary text-white' : 'bg-white/5 border-transparent text-white/60 hover:bg-white/10'}`}
                                        >
                                            <span className="text-xs font-medium">{m.name}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div 
                                        onClick={() => updateLocalSetting('enhance', !localSettings.enhance)}
                                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 active:bg-white/10 transition-colors cursor-pointer"
                                    >
                                        <span className="text-xs font-medium text-white">Enhance</span>
                                        <div className={`w-8 h-4 rounded-full relative transition-colors ${localSettings.enhance ? 'bg-primary' : 'bg-white/10'}`}>
                                            <div className={`absolute top-0.5 left-0.5 size-3 bg-white rounded-full transition-transform ${localSettings.enhance ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </div>
                                    </div>
                                    <div 
                                        onClick={() => updateLocalSetting('safe', !localSettings.safe)}
                                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 active:bg-white/10 transition-colors cursor-pointer"
                                    >
                                        <span className="text-xs font-medium text-white">Safe</span>
                                        <div className={`w-8 h-4 rounded-full relative transition-colors ${localSettings.safe ? 'bg-primary' : 'bg-white/10'}`}>
                                            <div className={`absolute top-0.5 left-0.5 size-3 bg-white rounded-full transition-transform ${localSettings.safe ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
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
                                src={currentImages[fullscreenIndex]}
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
                        onClick={() => handleDownload(currentImages[fullscreenIndex])}
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
                            className="absolute bottom-0 left-0 right-0 bg-[#192233] border-t border-white/10 rounded-t-[2rem] p-6 pb-28 z-30 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
                            
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Prompt</h4>
                                    <p className="text-sm text-white leading-relaxed font-medium bg-black/20 p-3 rounded-xl border border-white/5 max-h-32 overflow-y-auto">
                                        {decodeURIComponent(currentImages[fullscreenIndex].split('/prompt/')[1]?.split('?')[0] || prompt)}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Direct Link</h4>
                                    <div className="flex items-center gap-2 bg-black/20 p-2 rounded-xl border border-white/5">
                                        <span className="text-xs text-white/60 truncate flex-1 font-mono">
                                            {currentImages[fullscreenIndex]}
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
                                     {(() => {
                                         const info = getInfoFromUrl(currentImages[fullscreenIndex]);
                                         return (
                                            <>
                                                <div>
                                                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Seed</h4>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-white font-mono">{info.seed}</span>
                                                        <button onClick={() => { navigator.clipboard.writeText(info.seed as string); showToast("Seed Copied"); }} className="text-white/30 hover:text-white">
                                                            <span className="material-symbols-outlined text-[14px]">content_copy</span>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Model</h4>
                                                    <span className="px-2 py-0.5 rounded bg-white/10 text-xs font-bold text-white uppercase">{info.model}</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Size</h4>
                                                    <span className="text-sm text-white">{info.width} x {info.height}</span>
                                                </div>
                                            </>
                                         )
                                     })()}
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
