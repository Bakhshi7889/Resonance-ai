
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AppSettings, AVAILABLE_MODELS, MODEL_STYLES, AppRoute } from '../types';
import { DEFAULT_KEY } from '../services/pollinations';

interface PreferencesProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  onNavigate: (route: AppRoute) => void;
}

export const Preferences: React.FC<PreferencesProps> = ({ settings, updateSettings, onNavigate }) => {
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);

  // Filter styles for current model
  const availableStyles = MODEL_STYLES.filter(s => s.model === settings.model);

  // Helper to append key to model preview images to avoid rate limits
  const getModelImage = (url: string) => {
    // Use user key or fallback to default key
    const effectiveKey = (settings.apiKey && settings.apiKey.trim().length > 0) 
        ? settings.apiKey.trim() 
        : DEFAULT_KEY;
        
    return `${url}&key=${effectiveKey}`;
  };

  return (
    <motion.div 
      className="flex flex-col h-full bg-[#05050A] text-white w-full"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      <div className="relative z-10 flex flex-col h-full w-full pb-24 max-w-3xl mx-auto">
        {/* Top App Bar */}
        <header className="flex items-center justify-between px-6 pt-8 pb-4">
            <button 
                onClick={() => onNavigate(AppRoute.GENERATOR)}
                className="flex items-center justify-center size-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors"
            >
                <span className="material-symbols-outlined text-white text-[20px]">arrow_back</span>
            </button>
            <h1 className="text-lg font-bold tracking-wide text-white/90">Settings</h1>
            <div className="size-10" /> 
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 space-y-6 pt-2">
            
            {/* Fluid Settings Accordions */}
            <div className="space-y-4">
                
                {/* Section 1: Default Configuration */}
                <details className="group open:bg-white/[0.03] open:ring-1 open:ring-white/10 transition-all duration-300 rounded-[2rem]" open>
                    <summary className="flex items-center justify-between w-full p-1 pl-6 pr-2 cursor-pointer bg-glass-surface backdrop-blur-lg border border-white/10 rounded-full h-16 hover:bg-white/10 transition-colors list-none select-none">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center size-10 rounded-full bg-primary/20 text-primary">
                                <span className="material-symbols-outlined text-[20px]">tune</span>
                            </div>
                            <span className="text-base font-medium text-white/90">Global Defaults</span>
                        </div>
                        <div className="size-10 rounded-full bg-white/5 flex items-center justify-center group-open:rotate-180 transition-transform duration-300">
                            <span className="material-symbols-outlined text-white/50 text-[24px]">keyboard_arrow_down</span>
                        </div>
                    </summary>
                    <div className="p-6 pt-2 space-y-6">
                         
                         {/* Model Selector */}
                         <div className="space-y-3">
                            <p className="text-xs font-bold text-white/40 uppercase tracking-widest ml-2">Default Model</p>
                            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                {AVAILABLE_MODELS.map((model) => (
                                    <div 
                                        key={model.id}
                                        onClick={() => {
                                            updateSettings({ model: model.id, activeStyle: '' });
                                        }}
                                        className={`shrink-0 flex flex-col gap-2 w-20 cursor-pointer ${settings.model === model.id ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
                                    >
                                        <div className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${settings.model === model.id ? 'border-primary shadow-glow' : 'border-white/10'}`}>
                                            <img src={getModelImage(model.image)} className="w-full h-full object-cover" alt={model.name} />
                                        </div>
                                        <p className="text-[10px] text-center font-bold truncate">{model.name.split(' ')[0]}</p>
                                    </div>
                                ))}
                            </div>
                         </div>

                         {/* Style Selector */}
                         <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-white/40 uppercase tracking-widest ml-2">Default Style</p>
                                <button 
                                    onClick={() => onNavigate(AppRoute.STYLE_LIBRARY)}
                                    className="text-xs font-bold text-primary hover:text-white transition-colors flex items-center gap-1 pr-2"
                                >
                                    Open Studio <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => updateSettings({ activeStyle: '' })}
                                    className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${settings.activeStyle === '' ? 'bg-white text-black border-white' : 'bg-transparent border-white/20 text-white/60 hover:border-white/40'}`}
                                >
                                    None
                                </button>
                                {availableStyles.map((style) => (
                                    <button
                                        key={style.id}
                                        onClick={() => updateSettings({ activeStyle: style.id })}
                                        className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${settings.activeStyle === style.id ? 'bg-primary border-primary text-white shadow-glow' : 'bg-transparent border-white/20 text-white/60 hover:border-white/40'}`}
                                    >
                                        {style.label}
                                    </button>
                                ))}
                            </div>
                         </div>
                    </div>
                </details>

                {/* Section 2: Subscription & API */}
                <details className="group open:bg-white/[0.03] open:ring-1 open:ring-white/10 transition-all duration-300 rounded-[2rem]" open>
                    <summary className="flex items-center justify-between w-full p-1 pl-6 pr-2 cursor-pointer bg-glass-surface backdrop-blur-lg border border-white/10 rounded-full h-16 hover:bg-white/10 transition-colors list-none select-none">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center size-10 rounded-full bg-emerald-500/20 text-emerald-400">
                                <span className="material-symbols-outlined text-[20px]">key</span>
                            </div>
                            <span className="text-base font-medium text-white/90">API Configuration</span>
                        </div>
                        <div className="size-10 rounded-full bg-white/5 flex items-center justify-center group-open:rotate-180 transition-transform duration-300">
                            <span className="material-symbols-outlined text-white/50 text-[24px]">keyboard_arrow_down</span>
                        </div>
                    </summary>
                    <div className="p-6 pt-4 space-y-4">
                         {/* API Key Input */}
                         <div className="space-y-2">
                             <div className="flex justify-between items-center px-1">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Pollinations API Key</label>
                             </div>
                             <div className="relative group">
                                 <input 
                                    type={isApiKeyVisible ? "text" : "password"}
                                    value={settings.apiKey} 
                                    placeholder="••••••••••••••••"
                                    onChange={(e) => updateSettings({ apiKey: e.target.value })}
                                    className="w-full bg-[#101622] border border-white/10 rounded-xl py-3 pl-4 pr-10 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono placeholder:text-white/20"
                                 />
                                 <button 
                                    onClick={() => setIsApiKeyVisible(!isApiKeyVisible)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                                 >
                                     <span className="material-symbols-outlined text-[18px]">
                                         {isApiKeyVisible ? 'visibility_off' : 'visibility'}
                                     </span>
                                 </button>
                             </div>
                             <p className="text-[10px] text-white/30 px-1">
                                Leave empty to use free tier.
                                <a href="https://enter.pollinations.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">Get a key</a>
                             </p>
                        </div>
                    </div>
                </details>
            </div>

            {/* Sign Out */}
            <button 
                onClick={() => onNavigate(AppRoute.GENERATOR)}
                className="w-full mt-8 p-1 pl-6 pr-2 flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-full h-16 hover:bg-red-500/20 transition-colors group"
            >
                <span className="text-red-400 font-medium ml-2 group-hover:ml-4 transition-all">Back to Studio</span>
                <div className="size-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                </div>
            </button>

            {/* Powered By */}
            <div className="flex flex-col items-center justify-center gap-2 pb-32 pt-6 opacity-60 hover:opacity-100 transition-opacity">
                 <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Powered by</p>
                 <a 
                    href="https://enter.pollinations.ai" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                >
                    <span className="text-xs font-bold text-white group-hover:text-primary transition-colors">pollinations.ai</span>
                    <span className="material-symbols-outlined text-[12px] text-white/50 group-hover:text-primary transition-colors">open_in_new</span>
                 </a>
            </div>
        </div>

        {/* Floating Glass Dock - Matches Design */}
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full px-2 py-2 flex gap-1 shadow-2xl z-50">
            <button 
                onClick={() => onNavigate(AppRoute.GENERATOR)}
                className="p-3 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
            >
                <span className="material-symbols-outlined block text-[24px]">home</span>
            </button>
            <button 
                onClick={() => onNavigate(AppRoute.HISTORY)}
                className="p-3 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
            >
                <span className="material-symbols-outlined block text-[24px]">grid_view</span>
            </button>
            <div className="w-px h-6 bg-white/10 my-auto mx-1"></div>
            <button 
                className="p-3 rounded-full bg-primary/20 text-primary shadow-[0_0_15px_rgba(43,108,238,0.3)] border border-primary/30 transition-all"
            >
                <span className="material-symbols-outlined block text-[24px]">settings</span>
            </button>
        </nav>
      </div>
    </motion.div>
  );
};
