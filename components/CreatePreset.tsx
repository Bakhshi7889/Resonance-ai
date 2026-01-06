import React from 'react';
import { motion } from 'framer-motion';
import { AppRoute } from '../types';
import { Header } from './Header';

interface CreatePresetProps {
  onNavigate: (route: AppRoute) => void;
}

export const CreatePreset: React.FC<CreatePresetProps> = ({ onNavigate }) => {
  return (
    <motion.div 
      className="flex flex-col h-full bg-background-dark w-full"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
    >
      <div className="w-full max-w-2xl mx-auto flex flex-col h-full">
        <Header 
            leftIcon="close"
            onLeftClick={() => onNavigate(AppRoute.PREFERENCES)}
            rightIcon="check"
            onRightClick={() => onNavigate(AppRoute.GENERATOR)}
            title="New Preset"
        />

        <main className="flex flex-col gap-6 p-5 overflow-y-auto no-scrollbar">
            <div className="flex flex-col gap-1">
                <input className="w-full bg-transparent border-none text-4xl font-bold text-white placeholder:text-white/20 focus:ring-0 px-0 py-2 tracking-tight" placeholder="Preset Name" type="text" autoFocus />
                <input className="w-full bg-transparent border-none text-base font-medium text-[#92a4c9] placeholder:text-white/10 focus:ring-0 px-0 py-0" placeholder="Add a short description..." type="text" />
            </div>

            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden group shadow-glow ring-1 ring-white/10">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://picsum.photos/800/600')" }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-background-dark/90 via-background-dark/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-full bg-primary/20 backdrop-blur-md border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider">Preview</span>
                        </div>
                        <p className="text-white/80 text-sm font-medium">Visualizing current vibe</p>
                    </div>
                    <button className="flex items-center justify-center size-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all active:scale-95">
                        <span className="material-symbols-outlined text-[20px]">refresh</span>
                    </button>
                </div>
            </div>

            {/* Accordion Style Details */}
            <div className="flex flex-col gap-4">
                <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest px-2">Configuration</h3>
                
                {[
                    { icon: 'neurology', label: 'Model Version', value: 'Flux Synthetic' },
                    { icon: 'aspect_ratio', label: 'Dimensions', value: '1024x1024 (1:1)' },
                    { icon: 'tune', label: 'Guidance', value: '7.5' },
                    { icon: 'auto_awesome', label: 'Magic Words', value: '3 Active' }
                ].map((item, idx) => (
                    <div key={idx} className="bg-surface-dark border border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-glass">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center size-8 rounded-full bg-white/5 text-white/80">
                                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-white text-base font-semibold">{item.label}</span>
                                <span className="text-[#92a4c9] text-xs font-medium">{item.value}</span>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-white/30">expand_more</span>
                    </div>
                ))}
            </div>
        </main>
      </div>
    </motion.div>
  );
};