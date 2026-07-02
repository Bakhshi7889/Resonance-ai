import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabase';
import { storage } from '../services/storage';
import { messageService } from '../services/messageService';
import { AppRoute, HistoryItem } from '../types';
import { Header } from './Header';
import { Sparkles, Globe, Heart, Share2, Info, User, X, ThumbsUp, MessageSquare, RefreshCw, Download, ExternalLink } from 'lucide-react';
import { downloadImage } from '../services/utils';

interface CommunityFeedProps {
    onNavigate: (route: AppRoute) => void;
    user: any;
}

export const CommunityFeed: React.FC<CommunityFeedProps> = ({ onNavigate, user }) => {
    const [images, setImages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<any | null>(null);
    const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState<'recent' | 'top' | 'mine'>('recent');

    const isDeveloper = user?.email === 'herobakhshi@gmail.com';

    const handleShare = async (e: React.MouseEvent, img: any) => {
        e.stopPropagation();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Resonance Creation',
                    text: `Check out this AI creation: "${img.prompt}"`,
                    url: img.url
                });
            } catch (err) {
                console.error("Share failed", err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(img.url);
                alert("Link copied to clipboard!");
            } catch (err) {
                alert("Failed to copy link.");
            }
        }
    };

    const handleDownload = async (e: React.MouseEvent, img: any) => {
        e.stopPropagation();
        const filename = `resonance-${img.id.substring(0, 8)}.jpg`;
        await downloadImage(img.url, filename);
    };

    const fetchFeed = async (forceRefresh = false) => {
        if (!supabase) return;
        setIsLoading(true);
        
        if (forceRefresh) {
            setImages([]);
            await storage.remove('community_feed_images');
        }

        let query = supabase
            .from('generations')
            .select('*, author:profiles(name, avatar_url)');
        
        if (filter === 'top') {
            query = query.order('likes_count', { ascending: false });
        } else if (filter === 'mine' && user) {
            query = query.eq('user_id', user.id);
            query = query.order('created_at', { ascending: false });
        } else {
            query = query.order('created_at', { ascending: false });
        }
        
        if (!isDeveloper) {
            query = query.eq('is_public', true);
            // Only show images that passed the visual audit
            query = query.eq('visual_audit_passed', true);
        }
        
        let { data, error } = await query;
        
        // Fallback if profiles table doesn't exist yet
        if (error && error.message.includes('profiles')) {
            console.warn('Profiles table not found, falling back to basic query.');
            let fallbackQuery = supabase
                .from('generations')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (!isDeveloper) {
                fallbackQuery = fallbackQuery.eq('is_public', true);
                fallbackQuery = fallbackQuery.eq('visual_audit_passed', true);
            }
            
            const fallbackResult = await fallbackQuery;
            data = fallbackResult.data;
            error = fallbackResult.error;
        }
        
        if (error) {
            console.error('Resonance: Feed Fetch Error:', error);
        } else if (data) {
            setImages(data);
            storage.set('community_feed_images', data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        const loadInitial = async () => {
            const cached = await storage.get<any[]>('community_feed_images');
            if (cached) {
                setImages(cached);
            }
            fetchFeed();
        };

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

        loadInitial();
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
            
            if (error) {
                console.error("Failed to delete like:", error);
            }
            
            // Proceed even if delete fails (e.g. table doesn't exist)
            setLikedIds(prev => {
                const next = new Set(prev);
                next.delete(generationId);
                return next;
            });
            // Decrement likes_count in generations table
            const { error: rpcError } = await supabase.rpc('decrement_likes', { row_id: generationId });
            if (rpcError) {
                console.warn("RPC decrement_likes failed, falling back to direct update:", rpcError);
                const img = images.find(i => i.id === generationId);
                if (img) {
                    await supabase.from('generations').update({ likes_count: Math.max(0, (img.likes_count || 1) - 1) }).eq('id', generationId);
                }
            }
            // Refresh local state for the image if it's in the list
            setImages(prev => prev.map(img => 
                img.id === generationId ? { ...img, likes_count: Math.max(0, (img.likes_count || 1) - 1) } : img
            ));
        } else {
            const { error } = await supabase
                .from('likes')
                .insert([{ user_id: user.id, generation_id: generationId }]);
            
            if (error) {
                console.error("Failed to insert like:", error);
            }
            
            // Proceed even if insert fails (e.g. table doesn't exist)
            setLikedIds(prev => new Set(prev).add(generationId));
            // Increment likes_count in generations table
            const { error: rpcError } = await supabase.rpc('increment_likes', { row_id: generationId });
            if (rpcError) {
                console.warn("RPC increment_likes failed, falling back to direct update:", rpcError);
                const img = images.find(i => i.id === generationId);
                if (img) {
                    await supabase.from('generations').update({ likes_count: (img.likes_count || 0) + 1 }).eq('id', generationId);
                }
            }
            // Refresh local state for the image if it's in the list
            setImages(prev => prev.map(img => 
                img.id === generationId ? { ...img, likes_count: (img.likes_count || 0) + 1 } : img
            ));
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

                    <div className="flex gap-2 items-center">
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
                        {user && (
                            <button 
                                onClick={() => setFilter('mine')}
                                className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'mine' ? 'bg-white text-black shadow-glow' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                            >
                                My Shared
                            </button>
                        )}
                        <button 
                            onClick={() => fetchFeed(true)}
                            className="ml-auto size-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-90"
                        >
                            <RefreshCw size={16} />
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
                                    <img src={img.url} className="w-full h-auto block bg-white/5" alt="community" loading="lazy" decoding="async" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-300 gap-3">
                                        <div className="flex items-center gap-2">
                                            <div className="size-5 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                                                {img.author?.avatar_url ? (
                                                    <img src={img.author.avatar_url} className="size-full object-cover" alt="avatar" />
                                                ) : (
                                                    <User size={10} className="text-white/40" />
                                                )}
                                            </div>
                                            <div className="flex flex-col flex-1 overflow-hidden">
                                                <span className="text-[9px] font-bold text-white/80 truncate">
                                                    {img.author?.name || 'Anonymous Creator'}
                                                </span>
                                                <span className="text-[8px] font-medium text-white/40 truncate">
                                                    {new Date(img.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {new Date(img.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
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
                                                <button 
                                                    onClick={(e) => handleShare(e, img)}
                                                    className="text-white/60 hover:text-primary transition-colors"
                                                >
                                                    <Share2 size={14} />
                                                </button>
                                                <button 
                                                    onClick={(e) => handleDownload(e, img)}
                                                    className="text-white/60 hover:text-primary transition-colors"
                                                >
                                                    <Download size={14} />
                                                </button>
                                            </div>
                                            <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">{img.model}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        
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
                                <img 
                                    src={selectedImage.url} 
                                    className="size-full object-cover" 
                                    alt="detail" 
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <div className="absolute top-6 right-6 flex gap-2">
                                    <button 
                                        onClick={(e) => handleDownload(e, selectedImage)}
                                        className="size-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                                    >
                                        <Download size={20} />
                                    </button>
                                    <button 
                                        onClick={() => setSelectedImage(null)}
                                        className="size-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                 <div className="absolute top-6 left-6 flex gap-2">
                                    <button 
                                        onClick={(e) => handleLike(e, selectedImage.id)}
                                        className={`size-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center transition-colors ${likedIds.has(selectedImage.id) ? 'text-primary' : 'text-white/60 hover:text-primary'}`}
                                    >
                                        <ThumbsUp size={20} fill={likedIds.has(selectedImage.id) ? "currentColor" : "none"} />
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(selectedImage.url, '_blank');
                                        }}
                                        className="size-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                                    >
                                        <ExternalLink size={20} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                            {selectedImage.author?.avatar_url ? (
                                                <img src={selectedImage.author.avatar_url} className="size-full object-cover" alt="avatar" />
                                            ) : (
                                                <User size={16} className="text-white/20" />
                                            )}
                                        </div>
                                        <p className="text-xs font-bold text-white">{selectedImage.author?.name || 'Anonymous Creator'}</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (selectedImage.user_id === user?.id) {
                                                alert("You cannot message yourself.");
                                                return;
                                            }
                                            const msg = prompt(`Send a message to ${selectedImage.author?.name || 'Anonymous'}:`);
                                            if (msg && msg.trim()) {
                                                messageService.sendMessage(
                                                    user?.id || 'anonymous',
                                                    user?.email || 'anonymous',
                                                    `Regarding image "${selectedImage.prompt.substring(0, 30)}...": ${msg}`
                                                ).then(() => alert("Message sent to creator.")).catch(() => alert("Failed to send message."));
                                            }
                                        }}
                                        className="text-white/60 hover:text-primary transition-colors"
                                    >
                                        <MessageSquare size={20} />
                                    </button>
                                </div>
                                
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Neural Seed</p>
                                    <p className="text-xs text-white/80 leading-relaxed italic line-clamp-3">"{selectedImage.prompt}"</p>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-center">
                                        <p className="text-[7px] font-bold text-white/30 uppercase tracking-widest">Model</p>
                                        <p className="text-[9px] font-bold text-white uppercase truncate">{selectedImage.model}</p>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-center">
                                        <p className="text-[7px] font-bold text-white/30 uppercase tracking-widest">Resolution</p>
                                        <p className="text-[9px] font-bold text-white truncate">{selectedImage.width} × {selectedImage.height}</p>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-center">
                                        <p className="text-[7px] font-bold text-white/30 uppercase tracking-widest">Synthesized</p>
                                        <p className="text-[9px] font-bold text-white truncate">
                                            {selectedImage.created_at ? new Date(selectedImage.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent'}
                                        </p>
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
