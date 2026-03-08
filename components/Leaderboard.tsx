import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ArrowLeft, Heart, User, Medal, Crown, Sparkles } from 'lucide-react';
import { AppRoute } from '../types';
import { supabase } from '../services/supabase';

interface LeaderboardItem {
    id: string;
    user_id: string;
    user_email?: string;
    prompt: string;
    url: string;
    likes_count: number;
    rank: number;
}

export const Leaderboard: React.FC<{ onNavigate: (route: AppRoute) => void }> = ({ onNavigate }) => {
    const [items, setItems] = useState<LeaderboardItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeframe, setTimeframe] = useState<'month' | 'all'>('month');

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setIsLoading(true);
            try {
                if (!supabase) return;

                // Mocking leaderboard data for now since we don't have a real 'likes' system yet
                // In a real app, you'd query a view or a table that aggregates likes
                const { data, error } = await supabase
                    .from('generations')
                    .select('*')
                    .eq('is_public', true)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (error) throw error;

                // Add fake likes for demonstration if they don't exist
                const formattedData = (data || []).map((item, index) => ({
                    ...item,
                    likes_count: Math.floor(Math.random() * 500) + (20 - index) * 10,
                    rank: index + 1
                })).sort((a, b) => b.likes_count - a.likes_count)
                  .map((item, index) => ({ ...item, rank: index + 1 }));

                setItems(formattedData);
            } catch (err) {
                console.error('Leaderboard Error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, [timeframe]);

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return <Crown className="text-yellow-400" size={24} />;
            case 2: return <Medal className="text-gray-300" size={22} />;
            case 3: return <Medal className="text-amber-600" size={20} />;
            default: return <span className="text-white/20 font-mono text-sm">#{rank}</span>;
        }
    };

    const getTierLabel = (likes: number) => {
        if (likes > 400) return { label: 'Grandmaster', color: 'text-purple-400' };
        if (likes > 200) return { label: 'Architect', color: 'text-blue-400' };
        return { label: 'Acolyte', color: 'text-emerald-400' };
    };

    return (
        <div className="min-h-screen bg-black text-white pb-20">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/5 px-6 py-6 flex items-center justify-between">
                <button 
                    onClick={() => onNavigate(AppRoute.PREFERENCES)}
                    className="size-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 active:scale-90 transition-all"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Neural Rankings</h1>
                    <div className="flex items-center gap-2">
                        <Trophy size={16} className="text-primary" />
                        <span className="text-sm font-bold tracking-tight">Hall of Resonance</span>
                    </div>
                </div>
                <div className="size-10" />
            </div>

            <div className="pt-32 px-6 max-w-2xl mx-auto">
                {/* Timeframe Switcher */}
                <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5 mb-10">
                    <button 
                        onClick={() => setTimeframe('month')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeframe === 'month' ? 'bg-primary text-white shadow-glow' : 'text-white/40'}`}
                    >
                        Monthly Best
                    </button>
                    <button 
                        onClick={() => setTimeframe('all')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeframe === 'all' ? 'bg-primary text-white shadow-glow' : 'text-white/40'}`}
                    >
                        All Time
                    </button>
                </div>

                {/* Top 3 Podium */}
                {!isLoading && items.length >= 3 && (
                    <div className="flex items-end justify-center gap-4 mb-12 h-64">
                        {/* 2nd Place */}
                        <div className="flex flex-col items-center flex-1">
                            <div className="relative mb-4">
                                <div className="size-16 rounded-full overflow-hidden border-2 border-gray-400/30">
                                    <img src={items[1].url} className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 size-8 rounded-full bg-gray-400 flex items-center justify-center text-black">
                                    <Medal size={16} />
                                </div>
                            </div>
                            <div className="w-full h-24 bg-white/5 rounded-t-2xl border-x border-t border-white/10 flex flex-col items-center justify-center p-2">
                                <span className="text-[8px] font-bold text-white/40 truncate w-full text-center">Architect</span>
                                <span className="text-xs font-black text-white/80">{items[1].likes_count}</span>
                            </div>
                        </div>

                        {/* 1st Place */}
                        <div className="flex flex-col items-center flex-1 scale-110">
                            <div className="relative mb-4">
                                <div className="size-20 rounded-full overflow-hidden border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.2)]">
                                    <img src={items[0].url} className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <Crown className="text-yellow-400 fill-yellow-400" size={24} />
                                </div>
                            </div>
                            <div className="w-full h-32 bg-primary/20 rounded-t-2xl border-x border-t border-primary/30 flex flex-col items-center justify-center p-2">
                                <span className="text-[8px] font-bold text-primary truncate w-full text-center">Grandmaster</span>
                                <span className="text-sm font-black text-white">{items[0].likes_count}</span>
                                <Sparkles size={12} className="text-primary mt-1 animate-pulse" />
                            </div>
                        </div>

                        {/* 3rd Place */}
                        <div className="flex flex-col items-center flex-1">
                            <div className="relative mb-4">
                                <div className="size-16 rounded-full overflow-hidden border-2 border-amber-600/30">
                                    <img src={items[2].url} className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 size-8 rounded-full bg-amber-600 flex items-center justify-center text-black">
                                    <Medal size={16} />
                                </div>
                            </div>
                            <div className="w-full h-20 bg-white/5 rounded-t-2xl border-x border-t border-white/10 flex flex-col items-center justify-center p-2">
                                <span className="text-[8px] font-bold text-white/40 truncate w-full text-center">Acolyte</span>
                                <span className="text-xs font-black text-white/80">{items[2].likes_count}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* List */}
                <div className="space-y-3">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                        ))
                    ) : (
                        items.slice(3).map((item) => {
                            const tier = getTierLabel(item.likes_count);
                            return (
                                <motion.div 
                                    key={item.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
                                >
                                    <div className="w-8 flex justify-center">
                                        {getRankIcon(item.rank)}
                                    </div>
                                    <div className="size-12 rounded-xl overflow-hidden bg-black/40 border border-white/10">
                                        <img src={item.url} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-white/80 truncate">User_{item.user_id.slice(0, 4)}</span>
                                            <span className={`text-[8px] font-black uppercase tracking-widest ${tier.color}`}>{tier.label}</span>
                                        </div>
                                        <p className="text-[10px] text-white/30 truncate mt-0.5 italic">"{item.prompt}"</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                                        <Heart size={12} className="text-red-500 fill-red-500/20" />
                                        <span className="text-xs font-black font-mono">{item.likes_count}</span>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
