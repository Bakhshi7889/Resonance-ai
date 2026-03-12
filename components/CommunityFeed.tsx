import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabase';
import { AppRoute, HistoryItem } from '../types';
import { Header } from './Header';
import { Sparkles, Globe, Heart, Share2, Info, User, X } from 'lucide-react';

interface CommunityFeedProps {
    onNavigate: (route: AppRoute) => void;
    user: any;
}

export const CommunityFeed: React.FC<CommunityFeedProps> = ({ onNavigate, user }) => {
    const [images, setImages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<any | null>(null);
    const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState<'recent' | 'top'>('recent');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const isDeveloper = user?.email === 'herobakhshi@gmail.com';

    const fetchFeed = async (reset = false) => {
        if (!supabase) return;
        setIsLoading(true);
        const currentPage = reset ? 0 : page;
        const pageSize = 20;
        
        let query = supabase
            .from('generations')
            .select('*, author:profiles(name, avatar_url)')
            .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);
        
        if (filter === 'recent') {
            query = query.order('created_at', { ascending: false });
        } else {
            query = query.order('likes_count', { ascending: false }).order('created_at', { ascending: false });
        }
        
        if (!isDeveloper) {
            query = query.eq('is_public', true);
        }
        
        const { data, error } = await query;
        
        if (error) {
            console.error('Resonance: Feed Fetch Error:', error);
        } else if (data) {
            if (reset) {
                setImages(data);
            } else {
                setImages(prev => [...prev, ...data]);
            }
            setHasMore(data.length === pageSize);
            setPage(currentPage + 1);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        const fetchLikes = async () => {
            if (!supabase || !user) return;
            const { data } = await supabase
                .from('likes')
                .select('generation_id')
                .eq('user_id', user.id);
            
            if (data) {
                setLikedIds(new Set(data.map(l => l.generation_id)));
            }
        };

        fetchFeed(true);
        fetchLikes();
    }, [isDeveloper, user, filter]);

    const handleLike = async (e: React.MouseEvent, generationId: string) => {
        e.stopPropagation();
        if (!supabase || !user) return;

        const isLiked = likedIds.has(generationId);
        
        if (isLiked) {
            const { error } = await supabase
                .from('likes')
                .delete()
                .eq('user_id', user.id)
                .eq('generation_id', generationId);
            
            if (!error) {
                setLikedIds(prev => {
                    const next = new Set(prev);
                    next.delete(generationId);
                    return next;
                });
            }
        } else {
            const { error } = await supabase
                .from('likes')
                .insert([{ user_id: user.id, generation_id: generationId }]);
            
            if (!error) {
                setLikedIds(prev => new Set(prev).add(generationId));
            }
        }
    };

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
                <div className="py-8 flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-primary">
                            <Globe size={16} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Global Resonance</span>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight">Public Feed</h2>
                    </div>

                    <div className="flex gap-2">
                        <button 
                            onClick={() => setFilter('recent')}
                            className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'recent' ? 'bg-white text-black shadow-glow' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                        >
                            Recent
                        </button>
                        <button 
                            onClick={() => setFilter('top')}
                            className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'top' ? 'bg-white text-black shadow-glow' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                        >
                            Top Rated
                        </button>
                    </div>
                </div>

                {images.length === 0 && !isLoading ? (
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
                    <>
                        <div className="columns-2 gap-4 space-y-4">
                            {images.map((img, idx) => (
                                <motion.div 
                                    key={`${img.id}-${idx}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx % 10 * 0.05 }}
                                    onClick={() => setSelectedImage(img)}
                                    className="relative break-inside-avoid rounded-2xl overflow-hidden border border-white/5 group cursor-pointer"
                                >
                                    <img src={img.url} className="w-full h-auto block" alt="community" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end gap-3">
                                        <div className="flex items-center gap-2">
                                            <div className="size-5 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10">
                                                {img.author?.avatar_url ? (
                                                    <img src={img.author.avatar_url} className="size-full object-cover" alt="avatar" />
                                                ) : (
                                                    <User size={10} className="text-white/40" />
                                                )}
                                            </div>
                                            <span className="text-[9px] font-bold text-white/80 truncate">
                                                {img.author?.name || 'Anonymous Creator'}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-white/90 line-clamp-2 font-medium italic">"{img.prompt}"</p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-3">
                                                <button 
                                                    onClick={(e) => handleLike(e, img.id)}
                                                    className={`transition-colors ${likedIds.has(img.id) ? 'text-red-500' : 'text-white/60 hover:text-red-500'}`}
                                                >
                                                    <Heart size={14} fill={likedIds.has(img.id) ? 'currentColor' : 'none'} />
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

                        {hasMore && (
                            <div className="py-12 flex justify-center">
                                <button 
                                    onClick={() => fetchFeed()}
                                    disabled={isLoading}
                                    className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
                                >
                                    {isLoading ? 'Syncing...' : 'Load More Transmissions'}
                                </button>
                            </div>
                        )}
                    </>
                )}

                {isLoading && images.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="size-10 rounded-full border-2 border-white/5 border-t-primary animate-spin" />
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Syncing with Cloud...</p>
                    </div>
                )}
            </div>

            {/* Image Details Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6"
                        onClick={() => setSelectedImage(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-lg bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="relative aspect-square">
                                <img src={selectedImage.url} className="size-full object-cover" alt="detail" />
                                <button 
                                    onClick={() => setSelectedImage(null)}
                                    className="absolute top-6 right-6 size-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                        {selectedImage.author?.avatar_url ? (
                                            <img src={selectedImage.author.avatar_url} className="size-full object-cover" alt="avatar" />
                                        ) : (
                                            <User size={20} className="text-white/20" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{selectedImage.author?.name || 'Anonymous Creator'}</p>
                                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Resonance Architect</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Neural Seed</p>
                                    <p className="text-sm text-white/80 leading-relaxed italic">"{selectedImage.prompt}"</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                        <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Model</p>
                                        <p className="text-xs font-bold text-white uppercase">{selectedImage.model}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                        <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Resolution</p>
                                        <p className="text-xs font-bold text-white">{selectedImage.width} × {selectedImage.height}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
