import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DownloadCloud, Smartphone, Share, PlusSquare, ArrowLeft, ExternalLink, RefreshCw, Layers, Download, PlusCircle, Trash2, Wand2, Terminal, Copy, Globe, Trophy, Github, Mail, LogIn, LogOut, User, MessageSquare, Check, Send, Inbox } from 'lucide-react';
import { AppSettings, AppRoute, AccountState, DirectMessage } from '../types';
import { getAccountDetails, getEstimatedImagesLeft, getAuthUrl } from '../services/pollinations';
import { getLogs, clearLogs, LogEntry } from '../services/logger';
import { supabase } from '../services/supabase';
import { messageService } from '../services/messageService';

interface PreferencesProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  onNavigate: (route: AppRoute) => void;
  canInstall?: boolean;
  onInstallApp?: () => void;
  accountState: AccountState;
  refreshAccount: () => void;
}

export const Preferences: React.FC<PreferencesProps> = memo(({ settings, updateSettings, onNavigate, canInstall, onInstallApp, accountState, refreshAccount }) => {
  const [localLogs, setLocalLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isAccountExpanded, setIsAccountExpanded] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // Messaging state
  const [messageContent, setMessageContent] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const isDeveloper = accountState.user?.email === 'herobakhshi@gmail.com';

  const refreshLogs = useCallback(() => {
      const logs = getLogs();
      setLocalLogs(logs);
      if (logs.some(l => l.level === 'error')) {
          setShowLogs(true);
      }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!isDeveloper) return;
    try {
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('is_read', false);
        if (!error) setUnreadCount(count || 0);
    } catch (e) {
        console.error("Failed to fetch unread count", e);
    }
  }, [isDeveloper]);

  useEffect(() => {
    refreshLogs();
    
    // Get current user
    if (supabase && !accountState.user) {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user?.user_metadata?.display_name) {
                setDisplayName(user.user_metadata.display_name);
            }
        });
    } else if (accountState.user?.user_metadata?.display_name) {
        setDisplayName(accountState.user.user_metadata.display_name);
    }
  }, [refreshLogs, accountState.user]);

  useEffect(() => {
    if (isDeveloper) {
        fetchUnreadCount();
    }
  }, [isDeveloper, fetchUnreadCount]);

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !accountState.user) return;
    setIsSendingMessage(true);
    try {
        await messageService.sendMessage(
            accountState.user.id,
            accountState.user.email,
            messageContent
        );
        setMessageSent(true);
        setMessageContent('');
        setTimeout(() => setMessageSent(false), 3000);
    } catch (error) {
        console.error("Failed to send message:", error);
        alert("Failed to transmit message. Neural link unstable.");
    } finally {
        setIsSendingMessage(false);
    }
  };

  const getRedirectUrl = () => {
      // Prefer window.location.origin for dynamic redirects (works on Netlify, etc.)
      return window.location.origin;
  };

  const handleSocialLogin = async (provider: 'github' | 'discord') => {
      if (!supabase) return;
      setIsAuthLoading(true);
      try {
          const { error } = await supabase.auth.signInWithOAuth({
              provider,
              options: {
                  redirectTo: getRedirectUrl()
              }
          });
          if (error) throw error;
      } catch (err) {
          console.error('Auth Error:', err);
          alert('Authentication failed. Please try again.');
      } finally {
          setIsAuthLoading(false);
      }
  };

  const handleEmailLogin = async () => {
      if (!supabase || !authEmail) return;
      setIsAuthLoading(true);
      setOtpSent(false);
      try {
          const { error } = await supabase.auth.signInWithOtp({
              email: authEmail,
              options: {
                  emailRedirectTo: getRedirectUrl(),
              },
          });
          if (error) throw error;
          setOtpSent(true);
      } catch (err) {
          console.error('Auth Error:', err);
          alert('Authentication failed. Please try again.');
      } finally {
          setIsAuthLoading(false);
      }
  };

  const handleUpdateProfile = async () => {
      if (!supabase || !accountState.user) return;
      setIsUpdatingProfile(true);
      try {
          const { error } = await supabase.auth.updateUser({
              data: { display_name: displayName }
          });
          if (error) throw error;
          alert('Profile updated successfully');
      } catch (err) {
          console.error('Profile Update Error:', err);
          alert('Failed to update profile');
      } finally {
          setIsUpdatingProfile(false);
      }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !supabase || !accountState.user) return;

      const reader = new FileReader();
      reader.onloadend = async () => {
          const base64 = reader.result as string;
          setIsUpdatingProfile(true);
          try {
              const { error } = await supabase.auth.updateUser({
                  data: { avatar_url: base64 }
              });
              if (error) throw error;
          } catch (err) {
              console.error('Avatar Upload Error:', err);
              alert('Failed to upload avatar');
          } finally {
              setIsUpdatingProfile(false);
          }
      };
      reader.readAsDataURL(file);
  };

  const handleLogout = async () => {
      if (!supabase) return;
      await supabase.auth.signOut();
  };

  const handleConnectExternal = () => {
    window.location.href = getAuthUrl(getRedirectUrl());
  };

  const handleOpenPollinations = () => {
    window.open('https://enter.pollinations.ai', '_blank');
  };
  
  const handleCopyLogs = () => {
      const logText = localLogs.map(l => `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.level.toUpperCase()}] ${l.message} ${l.details || ''}`).join('\n');
      navigator.clipboard.writeText(logText).then(() => {
          alert("Logs copied to clipboard");
      });
  };

  const handleClearLogs = () => {
      clearLogs();
      setLocalLogs([]);
  };
  
  const isManual = settings.apiKey && settings.apiKey.trim().length > 5 && settings.apiKey !== 'sk_fH3vuxg5ULiDIzbVK7y6ejUg4eK1f0VF';

  return (
    <div className="flex flex-col h-full bg-black text-white w-full overflow-y-auto no-scrollbar">
      {/* Widen the container from max-w-2xl to max-w-3xl for a more robust "app" feel */}
      <div className="max-w-3xl mx-auto w-full px-6 sm:px-10 pt-12 pb-40 space-y-12 will-change-transform">
        <header className="flex items-center justify-between relative">
            <button onClick={() => onNavigate(AppRoute.GENERATOR)} className="size-11 rounded-full bg-white/5 backdrop-blur-[40px] border-[0.5px] border-white/12 flex items-center justify-center text-white/50 active:scale-90 transition-all">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-black uppercase tracking-tighter logo-text">Resonance</h1>
            
            {/* Tucked Account UI in Header */}
            <div className="relative">
                <button 
                    onClick={() => setIsAccountExpanded(!isAccountExpanded)}
                    className={`size-11 rounded-full border-[0.5px] transition-all duration-500 flex items-center justify-center overflow-hidden group ${isAccountExpanded ? 'border-primary shadow-glow scale-110' : 'border-white/15 hover:border-white/30 bg-white/5'}`}
                >
                    {accountState.user?.user_metadata?.avatar_url ? (
                        <img src={accountState.user.user_metadata.avatar_url} alt="Profile" className="size-full object-cover" />
                    ) : (
                        <div className="size-full flex items-center justify-center text-white/20 group-hover:text-white/40 transition-colors">
                            <User size={20} />
                        </div>
                    )}
                </button>

                <AnimatePresence>
                    {isAccountExpanded && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="absolute top-14 right-0 w-[320px] bg-black/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl z-[100] overflow-hidden"
                        >
                            {accountState.user ? (
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-2">Display Identity</label>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text"
                                                    value={displayName}
                                                    onChange={(e) => setDisplayName(e.target.value)}
                                                    placeholder="Neural Architect Name"
                                                    className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:ring-1 focus:ring-primary/40 transition-all"
                                                />
                                                <button 
                                                    onClick={handleUpdateProfile}
                                                    disabled={isUpdatingProfile}
                                                    className="px-4 rounded-2xl bg-white text-black text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-2">Avatar Matrix</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <label className="h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 text-white/60 hover:bg-white/10 transition-all cursor-pointer">
                                                    <Smartphone size={14} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Device</span>
                                                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                                                </label>
                                                <button 
                                                    onClick={() => onNavigate(AppRoute.GENERATOR)}
                                                    className="h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 text-white/60 hover:bg-white/10 transition-all"
                                                >
                                                    <Wand2 size={14} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Generate</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/5 flex flex-col items-center gap-4">
                                        <div className="text-center">
                                            <p className="text-xs font-bold text-white truncate max-w-[240px]">{accountState.user.email}</p>
                                            <p className="text-[8px] text-white/20 uppercase font-black tracking-widest mt-1">Primary Neural Link</p>
                                        </div>
                                        <button 
                                            onClick={handleLogout}
                                            className="w-full h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all"
                                        >
                                            <LogOut size={14} />
                                            Terminate Session
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <input 
                                                type="email"
                                                value={authEmail}
                                                onChange={(e) => setAuthEmail(e.target.value)}
                                                placeholder="Enter your email"
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-10 py-3 text-xs text-white focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-white/10"
                                            />
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                            <button 
                                                onClick={handleEmailLogin}
                                                disabled={isAuthLoading || !authEmail}
                                                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-primary text-white text-[8px] font-black uppercase tracking-widest disabled:opacity-50"
                                            >
                                                {isAuthLoading ? '...' : 'Send'}
                                            </button>
                                        </div>

                                        {otpSent && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 flex items-center gap-3"
                                            >
                                                <div className="size-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                                    <Check size={12} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Link Transmitted</span>
                                                    <span className="text-[7px] text-white/40 uppercase font-black tracking-widest">Check inbox/spam</span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    <div className="relative flex items-center justify-center">
                                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                                        <span className="relative px-3 bg-black text-[7px] font-black text-white/20 uppercase tracking-[0.4em]">Social Matrix</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            onClick={() => handleSocialLogin('github')}
                                            className="h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/10 transition-all active:scale-95"
                                        >
                                            <Github size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleSocialLogin('discord')}
                                            className="h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/10 transition-all active:scale-95"
                                        >
                                            <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </header>

        {/* PWA Install Section - The "Real Install Thing" */}
        {canInstall && (
          <section className="space-y-4 will-change-transform">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">App Architecture</p>
              <div className="bg-primary/10 backdrop-blur-[40px] rounded-[2.5rem] p-8 border-[0.5px] border-primary/20 flex items-center justify-between gap-6 shadow-glow">
                  <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-white tracking-tight">Install Resonance</span>
                      <span className="text-[10px] text-white/40 uppercase font-black tracking-widest leading-relaxed">Add to home screen for a full native experience.</span>
                  </div>
                  <button 
                      onClick={onInstallApp}
                      className="px-6 py-3.5 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-glow active:scale-95 transition-all shrink-0"
                  >
                      <PlusCircle size={16} />
                      Install
                  </button>
              </div>
          </section>
        )}

        {/* Community & Rankings */}
        <section className="space-y-4 will-change-transform">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">Global Resonance</p>
            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => onNavigate(AppRoute.COMMUNITY)}
                    className="bg-white/[0.03] backdrop-blur-[40px] rounded-[2rem] p-6 border-[0.5px] border-white/12 flex flex-col items-center gap-3 hover:bg-white/5 transition-all active:scale-95"
                >
                    <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Globe size={24} />
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-white">Public Feed</span>
                        <span className="text-[8px] text-white/30 uppercase font-black tracking-widest">Global Stream</span>
                    </div>
                </button>
                <button 
                    onClick={() => onNavigate(AppRoute.LEADERBOARD)}
                    className="bg-white/[0.03] backdrop-blur-[40px] rounded-[2rem] p-6 border-[0.5px] border-white/12 flex flex-col items-center gap-3 hover:bg-white/5 transition-all active:scale-95"
                >
                    <div className="size-12 rounded-2xl bg-yellow-400/10 flex items-center justify-center text-yellow-400">
                        <Trophy size={24} />
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-white">Leaderboard</span>
                        <span className="text-[8px] text-white/30 uppercase font-black tracking-widest">Top Architects</span>
                    </div>
                </button>
            </div>
        </section>

        {/* Community & Rankings */}
        <section className="space-y-4 will-change-transform">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">BYOP • Access Core</p>
            <div className="bg-white/[0.03] backdrop-blur-[40px] rounded-[3rem] p-8 border-[0.5px] border-white/15 space-y-8">
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center px-1">
                        <div className="flex flex-col">
                            <label className="text-[10px] text-white/30 uppercase font-black tracking-widest">Synthetic Key</label>
                            <div className="mt-1.5">
                                {!isManual ? (
                                    <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[8px] font-black uppercase tracking-widest text-blue-400">CORE ACTIVE</span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-[8px] font-black uppercase tracking-widest text-primary">MANUAL OVERRIDE</span>
                                )}
                            </div>
                        </div>
                        <button 
                            onClick={handleOpenPollinations}
                            className="text-[9px] text-primary font-black uppercase tracking-widest flex items-center gap-1.5 hover:underline"
                        >
                            GET KEY <ExternalLink size={12} />
                        </button>
                    </div>
                    <div className="relative">
                        <input 
                            type="password"
                            value={settings.apiKey}
                            onChange={(e) => updateSettings({ apiKey: e.target.value })}
                            placeholder={!isManual ? "pk_3GSNVF... (System Active)" : "Synthetic Token (pk_...)"}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm font-mono text-white focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all placeholder:text-white/10"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-8 pt-8 border-t border-white/5">
                    <div className="flex justify-between items-end px-1">
                        <div className="flex flex-col">
                          <span className="text-4xl font-black font-mono tracking-tighter text-blue-400">
                            ${accountState.balance?.toFixed(4) || '0.0000'}
                          </span>
                          <span className="text-[9px] text-white/30 uppercase font-black tracking-[0.2em] mt-2">Available Credits</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xl font-black text-white tracking-tighter">~{getEstimatedImagesLeft(accountState.balance, settings.model)}</span>
                          <span className="text-[9px] text-white/30 uppercase font-black tracking-widest mt-1">Render Potential</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={handleConnectExternal}
                            className="py-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] shadow-liquid active:scale-95 transition-all"
                        >
                            BYOP SYNC
                        </button>
                        <button 
                            onClick={refreshAccount}
                            className="py-4 rounded-2xl bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={14} className={accountState.isLoading ? 'animate-spin' : ''} />
                            FORCE SYNC
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <section className="space-y-4 will-change-transform">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">Platform Matrix</p>
            <div className="bg-white/[0.03] backdrop-blur-[40px] rounded-[2.5rem] p-6 border-[0.5px] border-white/12 space-y-4">
                
                <div className="flex items-center justify-between px-2">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">Custom Style</span>
                        <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">Create & Define</span>
                    </div>
                    <button 
                        onClick={() => onNavigate(AppRoute.CREATE_STYLE)}
                        className="text-[10px] font-black text-white uppercase tracking-widest bg-white/10 px-4 py-2 rounded-xl border border-white/20 flex items-center gap-2 hover:bg-white/20 transition-all active:scale-95"
                    >
                        <Wand2 size={12} />
                        Create
                    </button>
                </div>
            </div>
        </section>

        <section className="space-y-4 will-change-transform">
            <div className="flex items-center justify-between px-2">
                 <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Execution Stream</p>
                 <button 
                    onClick={() => { refreshLogs(); setShowLogs(!showLogs); }}
                    className="text-[9px] font-black text-white/30 uppercase tracking-widest flex items-center gap-1 hover:text-white"
                 >
                     <Terminal size={10} /> {showLogs ? 'Hide Logs' : 'Show Logs'}
                 </button>
            </div>
            
            <div className="bg-white/[0.03] backdrop-blur-[40px] rounded-[2.5rem] p-6 border-[0.5px] border-white/12 space-y-3">
                {accountState.usage && accountState.usage.length > 0 ? accountState.usage.map((entry, i) => (
                    <div key={i} className="flex items-center justify-between py-3.5 px-3 border-b border-white/5 last:border-0 hover:bg-white/[0.04] rounded-2xl transition-all">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-white/80 uppercase tracking-tighter">{entry.model || 'Synthetic'}</span>
                        <span className="text-[9px] text-white/20 uppercase font-black tracking-tighter mt-1">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <span className="text-xs font-mono font-black text-red-500/80">-${entry.cost_usd.toFixed(4)}</span>
                    </div>
                )) : <p className="text-[10px] text-white/10 text-center py-4 uppercase font-black tracking-[0.4em]">No Telemetry Logs</p>}

                {/* Internal Logs View */}
                {showLogs && (
                    <div className="mt-6 pt-6 border-t border-white/10 animate-in slide-in-from-top-2 fade-in">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">System Diagnostics</span>
                            <div className="flex gap-2">
                                <button onClick={handleCopyLogs} className="size-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all" title="Copy Logs">
                                    <Copy size={14} />
                                </button>
                                <button onClick={handleClearLogs} className="size-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-white/10 transition-all" title="Clear Logs">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="bg-black/40 rounded-xl p-4 font-mono text-[10px] text-white/60 max-h-[300px] overflow-y-auto border border-white/5 space-y-2">
                            {localLogs.length > 0 ? localLogs.map((log, idx) => (
                                <div key={log.id || idx} className="break-all border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                    <span className={`font-bold ${log.level === 'error' ? 'text-red-400' : log.level === 'warn' ? 'text-amber-400' : 'text-blue-400'}`}>[{log.level?.toUpperCase() || 'INFO'}]</span> 
                                    <span className="text-white/30 ml-2">{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}</span>
                                    <div className="mt-1">{log.message || 'No message'}</div>
                                    {log.details && (
                                        <div className="mt-1 text-white/30 text-[9px] pl-2 border-l border-white/10 overflow-hidden text-ellipsis">
                                            {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <div className="text-center py-8 text-white/20 italic">System stable. No internal logs recorded.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>

        {/* Contact Developer Section */}
        <section className="space-y-4 pb-12 will-change-transform">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">Neural Support</p>
            <div className="bg-white/[0.03] backdrop-blur-[40px] rounded-[2.5rem] p-8 border-[0.5px] border-white/12 space-y-8">
                <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-bold text-white">Direct Transmission</h4>
                    <p className="text-[10px] text-white/30 uppercase font-black tracking-widest leading-relaxed">Advice, suggestions, and bug reports.</p>
                </div>
                
                {/* Direct Message Form */}
                <div className="space-y-4">
                    <div className="relative">
                        <textarea 
                            value={messageContent}
                            onChange={(e) => setMessageContent(e.target.value)}
                            placeholder={accountState.user ? "Type your message to the developer..." : "Please login to send messages"}
                            disabled={!accountState.user || isSendingMessage}
                            className="w-full bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-white/10 min-h-[120px] resize-none"
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={!messageContent.trim() || isSendingMessage || !accountState.user}
                            className={`absolute bottom-4 right-4 size-10 rounded-xl flex items-center justify-center transition-all ${messageContent.trim() && !isSendingMessage ? 'bg-primary text-white shadow-glow' : 'bg-white/5 text-white/20'}`}
                        >
                            {isSendingMessage ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                        </button>
                    </div>
                    {messageSent && (
                        <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[10px] font-black text-emerald-400 uppercase tracking-widest text-center"
                        >
                            Message Transmitted Successfully
                        </motion.div>
                    )}
                </div>

                {isDeveloper && (
                    <div className="pt-6 border-t border-white/5">
                        <button 
                            onClick={() => onNavigate(AppRoute.MESSAGES)}
                            className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between px-6 hover:bg-white/10 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Inbox size={18} />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-xs font-bold text-white">Incoming Transmissions</span>
                                    <span className="text-[8px] text-white/30 uppercase font-black tracking-widest">Developer Inbox</span>
                                </div>
                            </div>
                            {unreadCount > 0 && (
                                <div className="bg-primary text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-glow">
                                    {unreadCount}
                                </div>
                            )}
                        </button>
                    </div>
                )}
                
                <div className="grid grid-cols-1 gap-3 pt-4">
                    <a href="mailto:nexacoreofficial@gmail.com" className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <Mail size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Email</span>
                            <span className="text-xs font-medium text-white/40">nexacoreofficial@gmail.com</span>
                        </div>
                    </a>
                    
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group">
                        <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                            <MessageSquare size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Discord</span>
                            <span className="text-xs font-medium text-white/40">_bakhshi</span>
                        </div>
                    </div>

                    <a href="https://github.com/bakhshi7889" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                        <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                            <Github size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">GitHub</span>
                            <span className="text-xs font-medium text-white/40">bakhshi7889</span>
                        </div>
                    </a>
                </div>
            </div>
        </section>
      </div>
    </div>
  );
});

Preferences.displayName = 'Preferences';