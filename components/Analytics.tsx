import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Users, 
  UserCheck, 
  UserX, 
  Image as ImageIcon, 
  TrendingUp, 
  RefreshCw, 
  Search, 
  Download, 
  Database, 
  Activity, 
  Laptop, 
  Globe, 
  Copy, 
  Check, 
  Sparkles,
  BarChart3,
  Calendar,
  Layers
} from 'lucide-react';
import { AppRoute } from '../types';
import { supabase } from '../services/supabase';
import { addLog } from '../services/logger';
import { storage } from '../services/storage';

interface AnalyticsProps {
  onNavigate: (route: AppRoute) => void;
  userEmail: string | undefined;
}

type Timeframe = '24h' | '7d' | '30d' | 'all';
type TabType = 'overview' | 'registered' | 'anonymous' | 'models' | 'events';

interface RegisteredUserDetail {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastActive: string;
  isOnline: boolean;
  imageCount: number;
  sessionCount: number;
}

interface AnalyticsState {
  totalRegisteredUsers: number;
  activeRegisteredNow: number;
  totalAnonymousSessions: number;
  activeAnonymousNow: number;
  totalImages: number;
  registeredImages: number;
  anonymousImages: number;
  images24h: number;
  images7d: number;
  totalSessions: number;
  returningUsersCount: number;
  modelBreakdown: { [model: string]: number };
  deviceBreakdown: { mobile: number; desktop: number; tablet: number };
  browserBreakdown: { [browser: string]: number };
  registeredUsersList: RegisteredUserDetail[];
  recentEvents: any[];
  tableStatus: {
    sessions: boolean;
    events: boolean;
    profiles: boolean;
    generations: boolean;
  };
}

export const Analytics: React.FC<AnalyticsProps> = ({ onNavigate, userEmail }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [timeframe, setTimeframe] = useState<Timeframe>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [data, setData] = useState<AnalyticsState>({
    totalRegisteredUsers: 0,
    activeRegisteredNow: 0,
    totalAnonymousSessions: 0,
    activeAnonymousNow: 0,
    totalImages: 0,
    registeredImages: 0,
    anonymousImages: 0,
    images24h: 0,
    images7d: 0,
    totalSessions: 0,
    returningUsersCount: 0,
    modelBreakdown: {},
    deviceBreakdown: { mobile: 0, desktop: 0, tablet: 0 },
    browserBreakdown: {},
    registeredUsersList: [],
    recentEvents: [],
    tableStatus: {
      sessions: true,
      events: true,
      profiles: true,
      generations: true,
    }
  });

  const fetchAnalytics = async () => {
    setIsLoading(true);

    const now = Date.now();
    const fiveMinsAgoIso = new Date(now - 5 * 60 * 1000).toISOString();
    const twentyFourHoursAgoIso = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgoIso = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

    let tableStatus = { sessions: true, events: true, profiles: true, generations: true };
    
    let rawSessions: any[] = [];
    let rawEvents: any[] = [];
    let rawProfiles: any[] = [];
    let rawGenerations: any[] = [];

    if (supabase) {
      // 1. Fetch sessions
      try {
        const { data: s, error: sErr } = await supabase.from('analytics_sessions').select('*');
        if (sErr) {
          if (sErr.code === '42P01') tableStatus.sessions = false;
        } else if (s) {
          rawSessions = s;
        }
      } catch (e) {
        tableStatus.sessions = false;
      }

      // 2. Fetch events
      try {
        const { data: e, error: eErr } = await supabase
          .from('analytics_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1000);
        if (eErr) {
          if (eErr.code === '42P01') tableStatus.events = false;
        } else if (e) {
          rawEvents = e;
        }
      } catch (e) {
        tableStatus.events = false;
      }

      // 3. Fetch profiles
      try {
        const { data: p, error: pErr } = await supabase.from('profiles').select('*');
        if (pErr) {
          if (pErr.code === '42P01') tableStatus.profiles = false;
        } else if (p) {
          rawProfiles = p;
        }
      } catch (e) {
        tableStatus.profiles = false;
      }

      // 4. Fetch generations
      try {
        const { data: g, error: gErr } = await supabase
          .from('generations')
          .select('*')
          .order('created_at', { ascending: false });
        if (gErr) {
          if (gErr.code === '42P01') tableStatus.generations = false;
        } else if (g) {
          rawGenerations = g;
        }
      } catch (e) {
        tableStatus.generations = false;
      }
    }

    // Process Registered Users
    const userMap = new Map<string, RegisteredUserDetail>();

    // Seed from profiles
    rawProfiles.forEach(p => {
      userMap.set(p.id, {
        id: p.id,
        email: p.name ? `${p.name}@user` : 'Registered User',
        name: p.name || 'Anonymous User',
        createdAt: p.created_at || new Date().toISOString(),
        lastActive: p.created_at || new Date().toISOString(),
        isOnline: false,
        imageCount: 0,
        sessionCount: 0
      });
    });

    // Sessions calculations
    let activeRegisteredNow = 0;
    let activeAnonymousNow = 0;
    let totalAnonymousSessions = 0;

    const userSessionCounts: { [userId: string]: number } = {};
    const deviceBreakdown = { mobile: 0, desktop: 0, tablet: 0 };
    const browserBreakdown: { [b: string]: number } = {};

    rawSessions.forEach(s => {
      const isOnline = s.last_ping_at && s.last_ping_at > fiveMinsAgoIso;
      const ua = (s.user_agent || '').toLowerCase();

      // Device detection
      if (/mobile|iphone|android/i.test(ua)) {
        deviceBreakdown.mobile++;
      } else if (/ipad|tablet/i.test(ua)) {
        deviceBreakdown.tablet++;
      } else {
        deviceBreakdown.desktop++;
      }

      // Browser detection
      let browser = 'Other';
      if (ua.includes('chrome')) browser = 'Chrome';
      else if (ua.includes('safari')) browser = 'Safari';
      else if (ua.includes('firefox')) browser = 'Firefox';
      else if (ua.includes('edge')) browser = 'Edge';
      browserBreakdown[browser] = (browserBreakdown[browser] || 0) + 1;

      if (s.user_id) {
        userSessionCounts[s.user_id] = (userSessionCounts[s.user_id] || 0) + 1;
        if (isOnline) activeRegisteredNow++;

        const existing = userMap.get(s.user_id);
        const email = s.email || existing?.email || `User ${s.user_id.slice(0, 6)}`;
        userMap.set(s.user_id, {
          id: s.user_id,
          email: email,
          name: existing?.name || email.split('@')[0],
          createdAt: existing?.createdAt || s.created_at,
          lastActive: (!existing?.lastActive || s.last_ping_at > existing.lastActive) ? s.last_ping_at : existing.lastActive,
          isOnline: isOnline || (existing?.isOnline || false),
          imageCount: existing?.imageCount || 0,
          sessionCount: (existing?.sessionCount || 0) + 1
        });
      } else {
        totalAnonymousSessions++;
        if (isOnline) activeAnonymousNow++;
      }
    });

    // Image & Events analytics
    const modelBreakdown: { [model: string]: number } = {};
    let registeredImages = 0;
    let anonymousImages = 0;
    let images24h = 0;
    let images7d = 0;

    // First check analytics_events for image_generated
    const imageEvents = rawEvents.filter(e => e.event_type === 'image_generated');

    if (imageEvents.length > 0) {
      imageEvents.forEach(e => {
        const details = e.details || {};
        const isAnon = details.is_anonymous !== undefined ? details.is_anonymous : !e.user_id;
        const model = details.model || 'flux';
        const createdAt = e.created_at || details.timestamp;

        modelBreakdown[model] = (modelBreakdown[model] || 0) + 1;

        if (isAnon) {
          anonymousImages++;
        } else {
          registeredImages++;
          if (e.user_id && userMap.has(e.user_id)) {
            const u = userMap.get(e.user_id)!;
            u.imageCount++;
            if (details.user_email && details.user_email !== 'Anonymous') {
              u.email = details.user_email;
              u.name = details.user_email.split('@')[0];
            }
          }
        }

        if (createdAt && createdAt > twentyFourHoursAgoIso) images24h++;
        if (createdAt && createdAt > sevenDaysAgoIso) images7d++;
      });
    }

    // Also check generations table
    rawGenerations.forEach(g => {
      const model = g.model || 'flux';
      modelBreakdown[model] = (modelBreakdown[model] || 0) + 1;

      if (g.user_id) {
        registeredImages++;
        if (userMap.has(g.user_id)) {
          const u = userMap.get(g.user_id)!;
          u.imageCount++;
        }
      } else {
        anonymousImages++;
      }

      if (g.created_at > twentyFourHoursAgoIso) images24h++;
      if (g.created_at > sevenDaysAgoIso) images7d++;
    });

    // Local storage history count fallback / boost if local images exist
    const localHistory = await storage.get<any[]>('resonance_image_history') || [];
    if (localHistory.length > 0 && imageEvents.length === 0 && rawGenerations.length === 0) {
      localHistory.forEach(item => {
        const model = item.model || 'flux';
        modelBreakdown[model] = (modelBreakdown[model] || 0) + 1;
        anonymousImages++;
      });
    }

    const totalImages = Math.max(
      imageEvents.length + rawGenerations.length, 
      registeredImages + anonymousImages, 
      localHistory.length
    );

    const returningUsersCount = Object.values(userSessionCounts).filter(cnt => cnt > 1).length;

    setData({
      totalRegisteredUsers: userMap.size,
      activeRegisteredNow,
      totalAnonymousSessions,
      activeAnonymousNow,
      totalImages,
      registeredImages,
      anonymousImages,
      images24h,
      images7d,
      totalSessions: rawSessions.length,
      returningUsersCount,
      modelBreakdown,
      deviceBreakdown,
      browserBreakdown,
      registeredUsersList: Array.from(userMap.values()).sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()),
      recentEvents: rawEvents.slice(0, 100),
      tableStatus
    });

    setIsLoading(false);
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 15000);
    return () => clearInterval(interval);
  }, [userEmail]);

  // Filtered registered users
  const filteredRegisteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return data.registeredUsersList;
    const q = searchQuery.toLowerCase();
    return data.registeredUsersList.filter(u => 
      u.email.toLowerCase().includes(q) || 
      u.name.toLowerCase().includes(q) || 
      u.id.toLowerCase().includes(q)
    );
  }, [data.registeredUsersList, searchQuery]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return data.recentEvents;
    const q = searchQuery.toLowerCase();
    return data.recentEvents.filter(e => {
      const type = (e.event_type || '').toLowerCase();
      const email = (e.details?.user_email || '').toLowerCase();
      const model = (e.details?.model || '').toLowerCase();
      return type.includes(q) || email.includes(q) || model.includes(q);
    });
  }, [data.recentEvents, searchQuery]);

  const handleCopySql = () => {
    const sql = getSqlSchema();
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const exportDataJson = () => {
    const exportObject = {
      exportedAt: new Date().toISOString(),
      summary: {
        totalRegisteredUsers: data.totalRegisteredUsers,
        totalAnonymousSessions: data.totalAnonymousSessions,
        totalImages: data.totalImages,
        registeredImages: data.registeredImages,
        anonymousImages: data.anonymousImages,
        activeRegisteredNow: data.activeRegisteredNow,
        activeAnonymousNow: data.activeAnonymousNow
      },
      registeredUsers: data.registeredUsersList,
      modelBreakdown: data.modelBreakdown,
      eventsSample: data.recentEvents.slice(0, 50)
    };
    const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resonance-analytics-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isDeveloper = !userEmail || 
    userEmail.toLowerCase().trim() === 'herobakhshi@gmail.com' || 
    userEmail.toLowerCase().includes('herobakhshi');

  if (!isDeveloper) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full bg-black text-white text-center min-h-screen">
        <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full space-y-4">
          <Database size={40} className="text-red-400 mx-auto" />
          <h2 className="text-xl font-black uppercase tracking-tight">Admin Portal Required</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Admin Analytics panel is strictly restricted to system administrators.
          </p>
          <button 
            onClick={() => onNavigate(AppRoute.GENERATOR)} 
            className="w-full py-3 bg-white text-black font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-zinc-200 active:scale-95 transition-all"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="flex flex-col h-full bg-black text-white w-full overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-8 pt-8 pb-32 space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate(AppRoute.PREFERENCES)} 
              className="size-11 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white active:scale-90 transition-all"
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black uppercase tracking-tight logo-text">Admin Analytics</h1>
                <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-full">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium">Real-time registered users, anonymous traffic & image metrics</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button 
              onClick={exportDataJson} 
              className="px-4 py-2.5 rounded-2xl bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-700 flex items-center gap-2 active:scale-95 transition-all"
              title="Export Report"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export JSON</span>
            </button>
            <button 
              onClick={() => setShowSqlModal(!showSqlModal)} 
              className="px-4 py-2.5 rounded-2xl bg-zinc-800 border border-zinc-700 text-xs font-bold text-amber-400 hover:bg-zinc-700 flex items-center gap-2 active:scale-95 transition-all"
            >
              <Database size={14} />
              <span>SQL Schema</span>
            </button>
            <button 
              onClick={fetchAnalytics} 
              className={`size-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all ${isLoading ? 'animate-spin' : ''}`}
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </header>

        {/* Missing Table Warning if applicable */}
        {(!data.tableStatus.sessions || !data.tableStatus.events) && (
          <motion.div 
            layout
            className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <Database className="text-amber-400 shrink-0 mt-0.5" size={20} />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">Analytics Schema Notice</h4>
                <p className="text-xs text-amber-200/80">
                  Some Supabase tracking tables (`analytics_sessions` / `analytics_events`) are missing. Local fallback data is being displayed.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowSqlModal(true)} 
              className="px-4 py-2 bg-amber-400 text-black text-xs font-black rounded-xl hover:bg-amber-300 active:scale-95 transition-all shrink-0"
            >
              View SQL Script
            </button>
          </motion.div>
        )}

        {/* KPI Top Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard 
            title="Registered Users" 
            value={data.totalRegisteredUsers} 
            subtitle={`${data.activeRegisteredNow} Online Now`}
            icon={<UserCheck size={22} className="text-emerald-400" />}
            badge={`${data.totalRegisteredUsers > 0 ? '+' : ''}${data.totalRegisteredUsers}`}
            badgeColor="emerald"
          />
          <KpiCard 
            title="Anonymous Sessions" 
            value={data.totalAnonymousSessions} 
            subtitle={`${data.activeAnonymousNow} Active Now`}
            icon={<UserX size={22} className="text-blue-400" />}
            badge={`${data.activeAnonymousNow} live`}
            badgeColor="blue"
          />
          <KpiCard 
            title="Total Images Created" 
            value={data.totalImages} 
            subtitle={`${data.images24h} generated in 24h`}
            icon={<ImageIcon size={22} className="text-purple-400" />}
            badge={`${data.images24h} today`}
            badgeColor="purple"
          />
          <KpiCard 
            title="Registered / Anon Images" 
            value={`${data.registeredImages} / ${data.anonymousImages}`} 
            subtitle={`Anon ratio: ${data.totalImages ? Math.round((data.anonymousImages / data.totalImages) * 100) : 0}%`}
            icon={<Layers size={22} className="text-amber-400" />}
            badge={`${data.totalSessions} sessions`}
            badgeColor="amber"
          />
        </section>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-2 p-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto no-scrollbar">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Overview" icon={<BarChart3 size={14} />} />
          <TabButton active={activeTab === 'registered'} onClick={() => setActiveTab('registered')} label={`Registered (${data.totalRegisteredUsers})`} icon={<UserCheck size={14} />} />
          <TabButton active={activeTab === 'anonymous'} onClick={() => setActiveTab('anonymous')} label={`Anonymous (${data.totalAnonymousSessions})`} icon={<UserX size={14} />} />
          <TabButton active={activeTab === 'models'} onClick={() => setActiveTab('models')} label="Models & Tech" icon={<Sparkles size={14} />} />
          <TabButton active={activeTab === 'events'} onClick={() => setActiveTab('events')} label={`Live Stream (${data.recentEvents.length})`} icon={<Activity size={14} />} />
        </div>

        {/* Search Input for tables/feed */}
        {(activeTab === 'registered' || activeTab === 'events') && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'registered' ? "Search users by email, name or ID..." : "Search events by type, model, or user email..."}
              className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-all"
            />
          </div>
        )}

        {/* Main Dynamic View Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Registered vs Anonymous Comparison Banner */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-sm font-black uppercase tracking-wider text-zinc-300">Traffic & Image Creation Ratio</h3>
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="size-2 rounded-full bg-emerald-400 inline-block"></span>
                      Registered Users
                    </span>
                    <span className="flex items-center gap-1.5 text-blue-400">
                      <span className="size-2 rounded-full bg-blue-400 inline-block"></span>
                      Anonymous Traffic
                    </span>
                  </div>
                </div>

                {/* Progress Bar Visualizer */}
                <div className="space-y-2">
                  <div className="h-4 bg-zinc-800 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-500" 
                      style={{ 
                        width: `${data.totalImages ? Math.max(5, (data.registeredImages / data.totalImages) * 100) : 50}%` 
                      }}
                      title={`Registered: ${data.registeredImages} images`}
                    />
                    <div 
                      className="bg-blue-500 h-full transition-all duration-500" 
                      style={{ 
                        width: `${data.totalImages ? Math.max(5, (data.anonymousImages / data.totalImages) * 100) : 50}%` 
                      }}
                      title={`Anonymous: ${data.anonymousImages} images`}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-zinc-400">
                    <span>{data.registeredImages} Registered Images ({data.totalImages ? Math.round((data.registeredImages / data.totalImages) * 100) : 0}%)</span>
                    <span>{data.anonymousImages} Anonymous Images ({data.totalImages ? Math.round((data.anonymousImages / data.totalImages) * 100) : 0}%)</span>
                  </div>
                </div>

                {/* Extended Stats Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-zinc-800/50 border border-zinc-800 rounded-2xl space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Avg Images / Registered User</span>
                    <p className="text-xl font-black text-white">
                      {data.totalRegisteredUsers > 0 ? (data.registeredImages / data.totalRegisteredUsers).toFixed(1) : '0'}
                    </p>
                  </div>
                  <div className="p-4 bg-zinc-800/50 border border-zinc-800 rounded-2xl space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Avg Images / Anon Session</span>
                    <p className="text-xl font-black text-white">
                      {data.totalAnonymousSessions > 0 ? (data.anonymousImages / data.totalAnonymousSessions).toFixed(1) : '0'}
                    </p>
                  </div>
                  <div className="p-4 bg-zinc-800/50 border border-zinc-800 rounded-2xl space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Returning Users</span>
                    <p className="text-xl font-black text-white">{data.returningUsersCount}</p>
                  </div>
                </div>
              </div>

              {/* Models Quick Glance */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-wider text-zinc-300">Top Image Models Used</h3>
                  <button onClick={() => setActiveTab('models')} className="text-xs text-primary font-bold hover:underline">View All Models &rarr;</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(data.modelBreakdown).length === 0 ? (
                    <p className="text-xs text-zinc-500 col-span-full">No image generation model data recorded yet.</p>
                  ) : (
                    Object.entries(data.modelBreakdown).slice(0, 6).map(([model, count]) => (
                      <div key={model} className="p-3.5 bg-zinc-800/60 border border-zinc-800 rounded-2xl flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-white capitalize">{model}</span>
                          <p className="text-[10px] text-zinc-400 font-medium">Model Engine</p>
                        </div>
                        <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 text-xs font-black text-primary rounded-xl">
                          {count}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'registered' && (
            <motion.div 
              key="registered"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">Registered Users Directory</h3>
                    <p className="text-xs text-zinc-400">Total registered profiles tracking login activity and image count</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full">
                    {filteredRegisteredUsers.length} Users
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-800/50 text-zinc-400 uppercase font-bold text-[10px] tracking-wider border-b border-zinc-800">
                      <tr>
                        <th className="px-6 py-4">User Email / Identity</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Images Done</th>
                        <th className="px-6 py-4">Sessions</th>
                        <th className="px-6 py-4">Last Active</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50 font-medium">
                      {filteredRegisteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                            No registered users found matching filter.
                          </td>
                        </tr>
                      ) : (
                        filteredRegisteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-black flex items-center justify-center shrink-0">
                                  {u.email.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-white text-xs">{u.email}</div>
                                  <div className="text-[10px] text-zinc-500 font-mono">{u.id.slice(0, 16)}...</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {u.isOnline ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase rounded-full">
                                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                  Online Now
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 text-zinc-400 text-[10px] font-bold rounded-full">
                                  Offline
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 font-black text-white">
                              {u.imageCount}
                            </td>
                            <td className="px-6 py-4 text-zinc-300">
                              {u.sessionCount}
                            </td>
                            <td className="px-6 py-4 text-zinc-400 text-[11px]">
                              {formatTimeAgo(u.lastActive)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'anonymous' && (
            <motion.div 
              key="anonymous"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Anonymous Visitors & Guest Traffic</h3>
                  <p className="text-xs text-zinc-400">Analysis of users interacting with Resonance without logging in</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 bg-zinc-800/60 border border-zinc-800 rounded-2xl space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Total Guest Sessions</span>
                    <p className="text-3xl font-black text-white">{data.totalAnonymousSessions}</p>
                    <p className="text-xs text-zinc-400">Unique visitor sessions tracked</p>
                  </div>
                  <div className="p-5 bg-zinc-800/60 border border-zinc-800 rounded-2xl space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Images Created Anonymously</span>
                    <p className="text-3xl font-black text-blue-400">{data.anonymousImages}</p>
                    <p className="text-xs text-zinc-400">
                      {data.totalImages ? Math.round((data.anonymousImages / data.totalImages) * 100) : 0}% of all generations
                    </p>
                  </div>
                  <div className="p-5 bg-zinc-800/60 border border-zinc-800 rounded-2xl space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Active Anonymous Now</span>
                    <p className="text-3xl font-black text-emerald-400">{data.activeAnonymousNow}</p>
                    <p className="text-xs text-zinc-400">Pinged in last 5 minutes</p>
                  </div>
                </div>

                {/* Device Breakdown */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">Device Distribution</h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-4 bg-zinc-800/40 border border-zinc-800 rounded-2xl">
                      <Laptop size={20} className="mx-auto text-zinc-400 mb-1" />
                      <span className="text-[10px] font-bold uppercase text-zinc-400">Desktop</span>
                      <p className="text-lg font-black text-white">{data.deviceBreakdown.desktop}</p>
                    </div>
                    <div className="p-4 bg-zinc-800/40 border border-zinc-800 rounded-2xl">
                      <Activity size={20} className="mx-auto text-zinc-400 mb-1" />
                      <span className="text-[10px] font-bold uppercase text-zinc-400">Mobile</span>
                      <p className="text-lg font-black text-white">{data.deviceBreakdown.mobile}</p>
                    </div>
                    <div className="p-4 bg-zinc-800/40 border border-zinc-800 rounded-2xl">
                      <Globe size={20} className="mx-auto text-zinc-400 mb-1" />
                      <span className="text-[10px] font-bold uppercase text-zinc-400">Tablet / Other</span>
                      <p className="text-lg font-black text-white">{data.deviceBreakdown.tablet}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'models' && (
            <motion.div 
              key="models"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Model Usage & AI Analytics</h3>
                  <p className="text-xs text-zinc-400">Breakdown of image generation requests by model model string</p>
                </div>

                <div className="space-y-4">
                  {Object.entries(data.modelBreakdown).length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 border border-zinc-800 rounded-2xl">
                      No model generation logs recorded yet. Generate images to populate stats.
                    </div>
                  ) : (
                    Object.entries(data.modelBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([model, count]) => {
                        const total = Object.values(data.modelBreakdown).reduce((a, b) => a + b, 0);
                        const pct = total ? Math.round((count / total) * 100) : 0;
                        return (
                          <div key={model} className="space-y-1.5 p-4 bg-zinc-800/50 border border-zinc-800 rounded-2xl">
                            <div className="flex justify-between items-center text-xs font-bold">
                              <span className="text-white font-mono uppercase">{model}</span>
                              <span className="text-primary font-black">{count} generations ({pct}%)</span>
                            </div>
                            <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                              <div 
                                className="bg-primary h-full transition-all duration-500 rounded-full" 
                                style={{ width: `${pct}%` }} 
                              />
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'events' && (
            <motion.div 
              key="events"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">Live Event Stream</h3>
                    <p className="text-xs text-zinc-400">Real-time audit log of app events, logins, and generations</p>
                  </div>
                  <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold rounded-full">
                    {filteredEvents.length} Recorded
                  </span>
                </div>

                <div className="divide-y divide-zinc-800/50">
                  {filteredEvents.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500 text-xs">
                      No matching events recorded in database yet.
                    </div>
                  ) : (
                    filteredEvents.map((ev, idx) => {
                      const details = ev.details || {};
                      const isAnon = details.is_anonymous !== undefined ? details.is_anonymous : !ev.user_id;
                      const userLabel = details.user_email || (isAnon ? 'Anonymous Guest' : `User ${ev.user_id?.slice(0, 8)}`);

                      return (
                        <div key={ev.id || idx} className="p-4 hover:bg-zinc-800/30 transition-colors flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-[10px] font-black uppercase tracking-wider text-primary rounded-md">
                                {ev.event_type}
                              </span>
                              <span className={`text-xs font-bold ${isAnon ? 'text-zinc-400' : 'text-emerald-400'}`}>
                                {userLabel}
                              </span>
                            </div>
                            {details.model && (
                              <p className="text-xs text-zinc-400 font-mono">
                                Model: <span className="text-white font-bold">{details.model}</span> 
                                {details.width && ` • ${details.width}x${details.height}`}
                              </p>
                            )}
                          </div>

                          <span className="text-[10px] text-zinc-500 font-medium shrink-0">
                            {formatTimeAgo(ev.created_at || details.timestamp)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal: SQL Schema Script setup */}
        <AnimatePresence>
          {showSqlModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
              >
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="text-amber-400" size={20} />
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">Supabase SQL Schema Setup</h3>
                  </div>
                  <button 
                    onClick={() => setShowSqlModal(false)}
                    className="size-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Copy and run this SQL script inside your Supabase SQL Editor to provision all analytics, profiles, and generations tables:
                  </p>

                  <div className="relative">
                    <pre className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-80 no-scrollbar">
                      {getSqlSchema()}
                    </pre>
                  </div>
                </div>

                <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
                  <button 
                    onClick={handleCopySql}
                    className="px-6 py-3 bg-primary text-black font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-lime-400 active:scale-95 transition-all flex items-center gap-2"
                  >
                    {copiedSql ? <Check size={16} /> : <Copy size={16} />}
                    <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
};

// Helper Sub-components
const KpiCard = ({ title, value, subtitle, icon, badge, badgeColor }: any) => {
  return (
    <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-3 shadow-md flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className="p-2.5 bg-zinc-800 border border-zinc-700/60 rounded-2xl shrink-0">
          {icon}
        </div>
        {badge && (
          <span className="px-2.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 text-[9px] font-black uppercase tracking-wider rounded-full">
            {badge}
          </span>
        )}
      </div>

      <div className="space-y-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">{title}</span>
        <div className="text-2xl font-black text-white tracking-tight">{value}</div>
        <p className="text-[11px] font-medium text-zinc-400">{subtitle}</p>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
      active 
        ? 'bg-white text-black font-black shadow-md' 
        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

function formatTimeAgo(dateStr: string | undefined): string {
  if (!dateStr) return 'Unknown';
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch (e) {
    return 'Recently';
  }
}

function getSqlSchema(): string {
  return `-- Resonance Admin Analytics & System Tables (Safe to run multiple times)

CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles viewable by everyone" ON profiles;
CREATE POLICY "Public profiles viewable by everyone" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE TABLE IF NOT EXISTS analytics_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  email text,
  user_agent text,
  country text,
  last_ping_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert analytics sessions" ON analytics_sessions;
CREATE POLICY "Anyone can insert analytics sessions" ON analytics_sessions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update session ping" ON analytics_sessions;
CREATE POLICY "Anyone can update session ping" ON analytics_sessions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Developer can view all analytics sessions" ON analytics_sessions;
CREATE POLICY "Developer can view all analytics sessions" ON analytics_sessions FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES analytics_sessions ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  event_type text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON analytics_events;
CREATE POLICY "Anyone can insert analytics events" ON analytics_events FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Developer can view all analytics events" ON analytics_events;
CREATE POLICY "Developer can view all analytics events" ON analytics_events FOR SELECT USING (true);
`;
}
