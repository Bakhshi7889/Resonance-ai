import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DownloadCloud, Smartphone, Share, PlusSquare, ArrowLeft, ExternalLink, RefreshCw, Layers, Download, PlusCircle, Trash2, Wand2, Terminal, Copy } from 'lucide-react';
import { AppSettings, AppRoute, AccountState } from '../types';
import { getAccountDetails, getEstimatedImagesLeft, getAuthUrl } from '../services/pollinations';
import { getLogs, clearLogs, LogEntry } from '../services/logger';

interface PreferencesProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  onNavigate: (route: AppRoute) => void;
  canInstall?: boolean;
  onInstallApp?: () => void;
}

export const Preferences: React.FC<PreferencesProps> = ({ settings, updateSettings, onNavigate, canInstall, onInstallApp }) => {
  const [accountState, setAccountState] = useState<AccountState>({ profile: null, balance: null, usage: [], isLoading: false, error: null });
  const [localLogs, setLocalLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const fetchDetails = useCallback(async () => {
    setAccountState(prev => ({ ...prev, isLoading: true }));
    const data = await getAccountDetails(settings.apiKey);
    setAccountState(data);
  }, [settings.apiKey]);

  const refreshLogs = () => {
      setLocalLogs(getLogs());
  };

  useEffect(() => {
    fetchDetails();
    refreshLogs();
  }, [fetchDetails]);

  const handleConnectExternal = () => {
    window.location.href = getAuthUrl(window.location.origin + window.location.pathname);
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
  
  const isManual = settings.apiKey && settings.apiKey.trim().length > 5;

  return (
    <div className="flex flex-col h-full bg-black text-white w-full overflow-y-auto no-scrollbar">
      {/* Widen the container from max-w-2xl to max-w-3xl for a more robust "app" feel */}
      <div className="max-w-3xl mx-auto w-full px-6 sm:px-10 pt-12 pb-40 space-y-12">
        <header className="flex items-center justify-between">
            <button onClick={() => onNavigate(AppRoute.GENERATOR)} className="size-11 rounded-full bg-white/5 backdrop-blur-[40px] border-[0.5px] border-white/12 flex items-center justify-center text-white/50 active:scale-90 transition-all">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-black uppercase tracking-tighter logo-text">Resonance</h1>
            <div className="size-11" />
        </header>

        {/* PWA Install Section - The "Real Install Thing" */}
        {canInstall && (
          <section className="space-y-4">
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

        <section className="space-y-4">
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
                          <span className="text-xl font-black text-white tracking-tighter">~{getEstimatedImagesLeft(accountState.balance)}</span>
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
                            onClick={fetchDetails}
                            className="py-4 rounded-2xl bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={14} className={accountState.isLoading ? 'animate-spin' : ''} />
                            FORCE SYNC
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <section className="space-y-4">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">Platform Matrix</p>
            <div className="bg-white/[0.03] backdrop-blur-[40px] rounded-[2.5rem] p-6 border-[0.5px] border-white/12 space-y-4">
                
                <div className="flex items-center justify-between px-2 pb-4 border-b border-white/5">
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

                <div className="flex items-center justify-between px-2">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">Style Studio</span>
                        <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">Manage Presets</span>
                    </div>
                    <button 
                        onClick={() => onNavigate(AppRoute.STYLE_LIBRARY)}
                        className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 flex items-center gap-2 hover:bg-primary/20 transition-all active:scale-95"
                    >
                        <Layers size={12} />
                        Open
                    </button>
                </div>
            </div>
        </section>

        <section className="space-y-4">
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
                            {localLogs.length > 0 ? localLogs.map((log) => (
                                <div key={log.id} className="break-all border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                    <span className={`font-bold ${log.level === 'error' ? 'text-red-400' : log.level === 'warn' ? 'text-amber-400' : 'text-blue-400'}`}>[{log.level.toUpperCase()}]</span> 
                                    <span className="text-white/30 ml-2">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                    <div className="mt-1">{log.message}</div>
                                    {log.details && <div className="mt-1 text-white/30 text-[9px] pl-2 border-l border-white/10">{log.details}</div>}
                                </div>
                            )) : (
                                <div className="text-center py-8 text-white/20 italic">System stable. No internal logs recorded.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>
      </div>
    </div>
  );
};