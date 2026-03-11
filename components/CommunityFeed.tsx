import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabase';
import { AppRoute, HistoryItem } from '../types';
import { Header } from './Header';
import { Sparkles, Globe, Heart, Share2 } from 'lucide-react';

interface CommunityFeedProps {
    onNavigate: (route: AppRoute) => void;
    user: any;
}

export const CommunityFeed: React.FC<CommunityFeedProps> = ({ onNavigate, user }) => {
    const [images, setImages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const isDeveloper = user?.email === 'herobakhshi@gmail.com';

    useEffect(() => {
        const fetchFeed = async () => {
            if (!supabase) return;
            
            let query = supabase
                .from('generations')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);
            
            // If not developer, only show public ones
            if (!isDeveloper) {
                query = query.eq('is_public', true);
            }
            
            const { data, error } = await query;
            
            if (!error && data) setImages(data);
            setIsLoading(false);
        };
        fetchFeed();
    }, [isDeveloper]);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full bg-black"
        >
            <Header 
                title="Community" 
                leftIcon="arrow_back"
                onLeftClick={() => onNavigate(AppRoute.GENERATOR)}
            />

            <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-32">
                <div className="py-8 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-primary">
                        <Globe size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Global Resonance</span>
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Public Feed</h2>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="size-10 rounded-full border-2 border-white/5 border-t-primary animate-spin" />
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Syncing with Cloud...</p>
                    </div>
                ) : images.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
                        <div className="size-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center text-white/10">
                            <Sparkles size={40} strokeWidth={1} />
                        </div>
                        <div className="space-y-2">
                            <p className="text-white font-bold">The feed is quiet...</p>
                            <p className="text-xs text-white/30 max-w-[200px] mx-auto">Be the first to share your neural creations with the world!</p>
                        </div>
                    </div>
                ) : (
                    <div className="columns-2 gap-4 space-y-4">
                        {images.map((img) => (
                            <motion.div 
                                key={img.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="relative break-inside-avoid rounded-2xl overflow-hidden border border-white/5 group"
                            >
                                <img src={img.url} className="w-full h-auto block" alt="community" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end gap-2">
                                    <p className="text-[10px] text-white/90 line-clamp-2 font-medium italic">"{img.prompt}"</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-3">
                                            <button className="text-white/60 hover:text-primary transition-colors">
                                                <Heart size={14} />
                                            </button>
                                            <button className="text-white/60 hover:text-primary transition-colors">
                                                <Share2 size={14} />
                                            </button>
                                        </div>
                                        <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">{img.model}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};
