import React from 'react';
import { motion } from 'framer-motion';
import { AppRoute } from '../types';
import { Header } from './Header';
import { Sparkles, Zap, ShieldCheck, Globe, Layers, MessageSquare, History } from 'lucide-react';

interface WhatsNewProps {
    onNavigate: (route: AppRoute) => void;
}

const UPDATES = [
    {
        id: 'v5.2',
        version: 'v5.2.0',
        date: 'March 26, 2026',
        title: 'Security & Stability',
        icon: <ShieldCheck className="text-blue-400" />,
        description: 'We\'ve improved session management and security.',
        features: [
            'Login Persistence: Your login status is now securely saved.',
            'API Key Update: Upgraded to a public key for enhanced security.'
        ]
    },
    {
        id: 'v5.1',
        version: 'v5.1.0',
        date: 'March 25, 2026',
        title: 'Neural Safety & Community Refinement',
        icon: <ShieldCheck className="text-blue-400" />,
        description: 'We\'ve implemented a multi-layer visual audit system for the Global Feed to ensure a safe and inspiring environment for all creators.',
        features: [
            'Visual Audit: Automated NSFW detection for all public shares.',
            'Feed Refresh: Cleared legacy content to start a new era of high-quality resonance.',
            'Creator Messaging: Connect directly with other neural artists.',
            'Interaction Overhaul: Improved Like/Dislike mechanics with real-time syncing.'
        ]
    },
    {
        id: 'v5.0',
        version: 'v5.0.0',
        date: 'March 15, 2026',
        title: 'The Resonance Evolution',
        icon: <Zap className="text-primary" />,
        description: 'A complete architectural overhaul bringing unprecedented speed and creative control.',
        features: [
            'Flux Engine: High-speed latent diffusion for near-instant results.',
            'Style Matrix: Layer and blend multiple neural styles seamlessly.',
            'IndexedDB Persistence: Your entire creative history, now stored locally for instant access.',
            'PWA Support: Install Resonance as a native app on any device.'
        ]
    }
];

export const WhatsNew: React.FC<WhatsNewProps> = ({ onNavigate }) => {
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full bg-black"
        >
            <Header 
                title="What's New" 
                leftIcon="arrow_back"
                onLeftClick={() => onNavigate(AppRoute.PREFERENCES)}
            />

            <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-32">
                <div className="py-8 flex flex-col gap-8">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-primary">
                            <Sparkles size={16} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Neural Evolution</span>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight">Latest Updates</h2>
                    </div>

                    <div className="space-y-12">
                        {UPDATES.map((update, idx) => (
                            <motion.div 
                                key={update.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="relative"
                            >
                                <div className="absolute -left-3 top-0 bottom-0 w-[1px] bg-white/5" />
                                
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                            {update.icon}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">{update.version} • {update.date}</p>
                                            <h3 className="text-lg font-bold text-white">{update.title}</h3>
                                        </div>
                                    </div>

                                    <p className="text-sm text-white/60 leading-relaxed">
                                        {update.description}
                                    </p>

                                    <ul className="space-y-3">
                                        {update.features.map((feature, fIdx) => (
                                            <li key={fIdx} className="flex gap-3 text-xs text-white/40">
                                                <div className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="pt-8 border-t border-white/5">
                        <button 
                            onClick={() => onNavigate(AppRoute.GENERATOR)}
                            className="w-full h-14 rounded-[2rem] bg-white text-black text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-glow"
                        >
                            Back to Synthesis
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
