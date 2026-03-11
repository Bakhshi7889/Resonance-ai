import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppRoute, DirectMessage } from '../types';
import { Header } from './Header';
import { Inbox, Mail, Clock, Trash2, CheckCircle, User } from 'lucide-react';
import { messageService } from '../services/messageService';

interface MessagesProps {
  onNavigate: (route: AppRoute) => void;
  user: any;
}

export const Messages: React.FC<MessagesProps> = memo(({ onNavigate, user }) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isDeveloper = user?.email === 'herobakhshi@gmail.com';

  useEffect(() => {
    if (!isDeveloper) {
        onNavigate(AppRoute.GENERATOR);
        return;
    }

    const fetchMessages = async () => {
        try {
            const data = await messageService.getMessages();
            setMessages(data);
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        } finally {
            setIsLoading(false);
        }
    };

    fetchMessages();
  }, [isDeveloper, onNavigate]);

  const handleMarkAsRead = async (id: string) => {
    try {
        await messageService.markAsRead(id);
        setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
    } catch (error) {
        console.error("Failed to mark as read:", error);
    }
  };

  return (
    <motion.div 
      className="flex flex-col h-full bg-black w-full"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      <div className="w-full max-w-3xl mx-auto flex flex-col h-full">
        <Header 
            leftIcon="arrow_back"
            onLeftClick={() => onNavigate(AppRoute.PREFERENCES)}
            title="Incoming Transmissions"
        />

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4 pb-32">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="size-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Syncing Neural Inbox...</span>
                </div>
            ) : messages.length > 0 ? (
                <div className="space-y-4">
                    {messages.map((msg) => (
                        <motion.div 
                            key={msg.id}
                            layout
                            className={`p-6 rounded-[2rem] border backdrop-blur-xl transition-all ${msg.is_read ? 'bg-white/[0.02] border-white/5 opacity-60' : 'bg-white/[0.05] border-primary/30 shadow-glow'}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
                                        <User size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-white">{msg.user_email}</span>
                                        <div className="flex items-center gap-2 text-[8px] text-white/30 uppercase font-black tracking-widest mt-1">
                                            <Clock size={10} />
                                            {new Date(msg.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                {!msg.is_read && (
                                    <button 
                                        onClick={() => handleMarkAsRead(msg.id)}
                                        className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                                        title="Mark as Read"
                                    >
                                        <CheckCircle size={16} />
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 gap-6 opacity-20">
                    <Inbox size={64} strokeWidth={1} />
                    <div className="text-center">
                        <p className="text-sm font-bold uppercase tracking-widest">Inbox Empty</p>
                        <p className="text-[10px] uppercase font-black tracking-widest mt-2">No transmissions detected</p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </motion.div>
  );
});

Messages.displayName = 'Messages';
