import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DownloadCloud, Smartphone, Share, PlusSquare, ArrowLeft, ExternalLink, RefreshCw, Layers, Download } from 'lucide-react';
import { AppSettings, AppRoute, AccountState } from '../types';
import { getAccountDetails, getEstimatedImagesLeft, getAuthUrl } from '../services/pollinations';

interface PreferencesProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  onNavigate: (route: AppRoute) => void;
  installAvailable?: boolean;
  onInstall?: () => void;
}

export const Preferences: React.FC<PreferencesProps> = ({ settings, updateSettings, onNavigate, installAvailable, onInstall }) => {
  const [accountState, setAccountState] = useState<AccountState>({ profile: null, balance: null, usage: [], isLoading: false, error: null });

  const fetchDetails = useCallback(async () => {
    setAccountState(prev => ({ ...prev, isLoading: true }));
    const data = await getAccountDetails(settings.apiKey);
    setAccountState(data);
  }, [settings.apiKey]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleConnectExternal = () => {
    window.location.href = getAuthUrl(window.location.origin + window.location.pathname);
  };

  const handleOpenPollinations = () => {
    window.open('https://enter.pollinations.ai', '_blank');
  };

  const isManual = settings.apiKey && settings.apiKey.trim().length > 5;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

  return (
    <div className="flex flex-col h-full bg-black text-white w-full overflow-y-auto no-scrollbar">
      <div className="max-w-2xl mx-auto w-full px-8 pt-12 pb-40 space-y-12">
        <header className="flex items-center justify-between">
            <button onClick={() => onNavigate(AppRoute.GENERATOR)} className="size-11 rounded-full bg-white/5 backdrop-blur-[40px] border-[0.5px] border-white/12 flex items-center justify-center text-white/50 active:scale-90 transition-all">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-black uppercase tracking-tighter logo-text">Resonance</h1>
            <div className="size-11" />
        </header>

        {/* PWA Installation Section */}
        {(!isStandalone || installAvailable) && (
          <section className="space-y-4">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">App Experience</p>
              <div className="bg-primary/10 backdrop-blur-[40px] rounded-[2.5rem] p-6 border-[0.5px] border-primary/20 space-y-4">
                  <div className="flex items-center justify-between px-2">
                      <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">Native Integration</span>
                          <span className="text-[9px] text-primary/60 uppercase font-black tracking-widest">Install for Full Immersion</span>
                      </div>
                      <button 
                          onClick={onInstall}
                          disabled={!installAvailable && isStandalone}
                          className={`text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-2xl flex items-center gap-2 transition-all active:scale-95 ${!installAvailable && isStandalone ? 'bg-white/5 text-white/20' : 'bg-primary text-white shadow-glow'}`}
                      >
                          <Download size={14} />
                          {isStandalone ? 'Installed' : 'Install App'}
                      </button>
                  </div>
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
                <div className="flex items-center justify-between px-2">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">Style Studio</span>
                        <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">Generate Custom Presets</span>
                    </div>
                    <button 
                        className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 flex items-center gap-2"
                    >
                        <Layers size={12} />
                        Active
                    </button>
                </div>
            </div>
        </section>

        <section className="space-y-4">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">Execution Stream</p>
            <div className="bg-white/[0.03] backdrop-blur-[40px] rounded-[2.5rem] p-6 border-[0.5px] border-white/12 space-y-3">
                {accountState.usage && accountState.usage.length > 0 ? accountState.usage.map((entry, i) => (
                    <div key={i} className="flex items-center justify-between py-3.5 px-3 border-b border-white/5 last:border-0 hover:bg-white/[0.04] rounded-2xl transition-all">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-white/80 uppercase tracking-tighter">{entry.model || 'Synthetic'}</span>
                        <span className="text-[9px] text-white/20 uppercase font-black tracking-tighter mt-1">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <span className="text-xs font-mono font-black text-red-500/80">-${entry.cost_usd.toFixed(4)}</span>
                    </div>
                )) : <p className="text-[10px] text-white/10 text-center py-10 uppercase font-black tracking-[0.4em]">No Telemetry Logs</p>}
            </div>
        </section>
      </div>
    </div>
  );
};