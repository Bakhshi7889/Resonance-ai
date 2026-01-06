import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSettings, AVAILABLE_MODELS, AppRoute, ASPECT_RATIOS } from '../types';

interface PreferencesProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  onNavigate: (route: AppRoute) => void;
}

export const Preferences: React.FC<PreferencesProps> = ({ settings, updateSettings, onNavigate }) => {
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
            <button className="flex items-center justify-center size-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
                <span className="material-symbols-outlined text-white text-[20px]">more_horiz</span>
            </button>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 space-y-6">
            
            {/* Hero Profile Capsule */}
            <div className="relative w-full rounded-[2.5rem] p-6 bg-glass-gradient backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden group">
                <div className="absolute inset-0 bg-glow-radial opacity-50 group-hover:opacity-70 transition-opacity duration-700"></div>
                <div className="relative flex flex-col items-center gap-4 z-10">
                    <div className="relative">
                        <div className="size-24 rounded-full p-1 bg-gradient-to-tr from-primary via-purple-500 to-transparent">
                            <div 
                                className="size-full rounded-full bg-cover bg-center border-2 border-[#101022]" 
                                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBm5vGavw39x7uwJE2zukXmb-9XtIEyhvd0iMQ-nAonUzeSyKad7OX8SeHlUTVqTeTmXn1RjIV_CAaUEBK80lq0NAqXw53Qw-K9aLKUjP7FA8fN2widU3YyuzoNDD_gaMTxnf4CfUlZGX4Kn8PFevw2T77skK7P7sb-F3_wWHHYKsuxAu2sGkWpQLSG-aZwpDKBOy3GlqlHO7ZBSt5JdNS9w6UFTjOgwqzILeiamkBbH16cGNEpmrtF8gxxeEWdH2MFJMzvky0yY8I')" }}
                            ></div>
                        </div>
                        <div className="absolute bottom-1 right-1 bg-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#101022] shadow-lg">PRO</div>
                    </div>
                    <div className="text-center space-y-1">
                        <h2 className="text-2xl font-bold text-white tracking-tight">Alex Creator</h2>
                        <p className="text-white/40 text-sm font-medium">alex.creator@example.com</p>
                    </div>
                    <div className="flex items-center gap-2 mt-2 px-5 py-2 rounded-full bg-black/30 border border-white/5 backdrop-blur-sm">
                        <span className="material-symbols-outlined text-primary text-[18px]">bolt</span>
                        <span className="text-sm font-bold text-white">450 Credits</span>
                    </div>
                </div>
            </div>

            {/* Fluid Settings Accordions */}
            <div className="space-y-4">
                
                {/* Section 1: Generation */}
                <details className="group open:bg-white/[0.03] open:ring-1 open:ring-white/10 transition-all duration-300 rounded-[2rem]">
                    <summary className="flex items-center justify-between w-full p-1 pl-6 pr-2 cursor-pointer bg-glass-surface backdrop-blur-lg border border-white/10 rounded-full h-16 hover:bg-white/10 transition-colors list-none select-none">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center size-10 rounded-full bg-primary/20 text-primary">
                                <span className="material-symbols-outlined text-[20px]">tune</span>
                            </div>
                            <span className="text-base font-medium text-white/90">Generation</span>
                        </div>
                        <div className="size-10 rounded-full bg-white/5 flex items-center justify-center group-open:rotate-180 transition-transform duration-300">
                            <span className="material-symbols-outlined text-white/50 text-[24px]">keyboard_arrow_down</span>
                        </div>
                    </summary>
                    <div className="p-6 pt-2 space-y-6">
                         
                         {/* Model Selector (New Addition to fit in) */}
                         <div className="space-y-3">
                            <p className="text-xs font-bold text-white/40 uppercase tracking-widest ml-2">Model Engine</p>
                            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                {AVAILABLE_MODELS.map((model) => (
                                    <div 
                                        key={model.id}
                                        onClick={() => updateSettings({ model: model.id })}
                                        className={`shrink-0 flex flex-col gap-2 w-20 cursor-pointer ${settings.model === model.id ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
                                    >
                                        <div className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${settings.model === model.id ? 'border-primary shadow-glow' : 'border-white/10'}`}>
                                            <img src={model.image} className="w-full h-full object-cover" alt={model.name} />
                                        </div>
                                        <p className="text-[10px] text-center font-bold truncate">{model.name.split(' ')[0]}</p>
                                    </div>
                                ))}
                            </div>
                         </div>

                        {/* Aspect Ratio Pills */}
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-white/40 uppercase tracking-widest ml-2">Aspect Ratio</p>
                            <div className="flex flex-wrap gap-2">
                                {ASPECT_RATIOS.slice(0, 3).map((ratio) => { // Showing subset to match design aesthetic or can show all
                                    const isActive = settings.width === ratio.width && settings.height === ratio.height;
                                    return (
                                        <button 
                                            key={ratio.label}
                                            onClick={() => updateSettings({ width: ratio.width, height: ratio.height })}
                                            className={`px-5 py-3 rounded-full border text-sm transition-all ${isActive ? 'bg-primary text-white border-primary/50 shadow-glow' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}
                                        >
                                            {ratio.label} {ratio.width === ratio.height ? 'Square' : 'Ratio'}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Slider for Guidance */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end px-2">
                                <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Guidance</p>
                                <span className="text-sm font-mono text-primary">{settings.guidance}</span>
                            </div>
                            <div className="relative h-12 w-full flex items-center bg-white/5 rounded-full px-4 border border-white/5 shadow-inner">
                                <input 
                                    type="range" 
                                    min="1" 
                                    max="20" 
                                    step="0.5" 
                                    value={settings.guidance}
                                    onChange={(e) => updateSettings({ guidance: parseFloat(e.target.value) })}
                                    className="w-full bg-transparent accent-primary cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                </details>

                {/* Section 2: App Preferences */}
                <details className="group open:bg-white/[0.03] open:ring-1 open:ring-white/10 transition-all duration-300 rounded-[2rem]">
                    <summary className="flex items-center justify-between w-full p-1 pl-6 pr-2 cursor-pointer bg-glass-surface backdrop-blur-lg border border-white/10 rounded-full h-16 hover:bg-white/10 transition-colors list-none select-none">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center size-10 rounded-full bg-purple-500/20 text-purple-400">
                                <span className="material-symbols-outlined text-[20px]">palette</span>
                            </div>
                            <span className="text-base font-medium text-white/90">Appearance</span>
                        </div>
                        <div className="size-10 rounded-full bg-white/5 flex items-center justify-center group-open:rotate-180 transition-transform duration-300">
                            <span className="material-symbols-outlined text-white/50 text-[24px]">keyboard_arrow_down</span>
                        </div>
                    </summary>
                    <div className="p-6 pt-2 space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-3xl bg-white/5 border border-white/5">
                            <div className="flex flex-col">
                                <span className="text-sm text-white font-medium">Dark Mode</span>
                                <span className="text-xs text-white/40">Use system preference</span>
                            </div>
                            <div className="relative w-12 h-7 rounded-full bg-primary flex items-center px-1 cursor-pointer transition-colors shadow-[0_0_10px_rgba(43,108,238,0.4)]">
                                <div className="size-5 bg-white rounded-full shadow-sm transform translate-x-5 transition-transform"></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-3xl bg-white/5 border border-white/5">
                            <div className="flex flex-col">
                                <span className="text-sm text-white font-medium">Haptic Feedback</span>
                                <span className="text-xs text-white/40">Vibrate on interactions</span>
                            </div>
                            <div className="relative w-12 h-7 rounded-full bg-white/10 flex items-center px-1 cursor-pointer transition-colors">
                                <div className="size-5 bg-white/50 rounded-full shadow-sm transition-transform"></div>
                            </div>
                        </div>
                    </div>
                </details>

                {/* Section 3: Subscription */}
                <details className="group open:bg-white/[0.03] open:ring-1 open:ring-white/10 transition-all duration-300 rounded-[2rem]">
                    <summary className="flex items-center justify-between w-full p-1 pl-6 pr-2 cursor-pointer bg-glass-surface backdrop-blur-lg border border-white/10 rounded-full h-16 hover:bg-white/10 transition-colors list-none select-none">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center size-10 rounded-full bg-emerald-500/20 text-emerald-400">
                                <span className="material-symbols-outlined text-[20px]">credit_card</span>
                            </div>
                            <span className="text-base font-medium text-white/90">Subscription</span>
                        </div>
                        <div className="size-10 rounded-full bg-white/5 flex items-center justify-center group-open:rotate-180 transition-transform duration-300">
                            <span className="material-symbols-outlined text-white/50 text-[24px]">keyboard_arrow_down</span>
                        </div>
                    </summary>
                    <div className="p-6 pt-2 pb-6">
                        <button className="w-full py-4 rounded-full bg-white text-black font-bold text-sm tracking-wide hover:bg-white/90 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                            Manage Plan
                        </button>
                    </div>
                </details>
            </div>

            {/* Sign Out */}
            <button 
                onClick={() => onNavigate(AppRoute.GENERATOR)}
                className="w-full mt-8 p-1 pl-6 pr-2 flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-full h-16 hover:bg-red-500/20 transition-colors group"
            >
                <span className="text-red-400 font-medium ml-2 group-hover:ml-4 transition-all">Sign Out</span>
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
                <span className="material-symbols-outlined block text-[24px]">person</span>
            </button>
        </nav>
      </div>
    </motion.div>
  );
};