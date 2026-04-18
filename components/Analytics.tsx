import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, MousePointer2, Image as ImageIcon, TrendingUp, RefreshCw } from 'lucide-react';
import { AppRoute } from '../types';
import { supabase } from '../services/supabase';
import { addLog } from '../services/logger';

interface AnalyticsProps {
  onNavigate: (route: AppRoute) => void;
  userEmail: string | undefined;
}

export const Analytics: React.FC<AnalyticsProps> = ({ onNavigate, userEmail }) => {
  const [stats, setStats] = useState({
    activeUsers: 0,
    peakConcurrency: 0,
    totalImages: 0,
    totalSessions: 0,
    recurringUsers: 0,
    anonymousSessions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    if (!supabase || userEmail !== 'herobakhshi@gmail.com') return;
    setIsLoading(true);
    try {
      // Get all sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('analytics_sessions')
        .select('*');

      if (sessionsError) throw sessionsError;

      // Get count of images generated (could use analytics_events or generations table)
      // Since generations is truncated, we will count 'image_generated' events
      const { count: imagesCount, error: eventsError } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'image_generated');

      if (eventsError) throw eventsError;

      if (sessions) {
        // Active users (pinged in last 5 minutes)
        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const activeUsersCount = sessions.filter(s => s.last_ping_at > fiveMinsAgo).length;

        // Recurring users (users with > 1 session, assuming grouping by user_id if not anonymous)
        const userGroups: { [key: string]: number } = {};
        sessions.forEach(s => {
          if (s.user_id) {
            userGroups[s.user_id] = (userGroups[s.user_id] || 0) + 1;
          }
        });
        const recurring = Object.values(userGroups).filter(count => count > 1).length;

        // Anonymous sessions
        const anonymous = sessions.filter(s => !s.user_id).length;

        // This is a naive peak concurrency calculation. Real one would require interval analysis.
        const peak = Math.max(activeUsersCount, Math.floor(sessions.length / 10)); // just a placeholder

        setStats({
          activeUsers: activeUsersCount,
          peakConcurrency: peak,
          totalImages: imagesCount || 0,
          totalSessions: sessions.length,
          recurringUsers: recurring,
          anonymousSessions: anonymous,
        });
      }
    } catch (e) {
      console.error('Analytics fetch error:', e);
      addLog('error', 'Analytics fetch failed', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [userEmail]);

  if (userEmail !== 'herobakhshi@gmail.com') {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full bg-black text-white/50 text-center">
        Access Denied. Admins only.
        <button onClick={() => onNavigate(AppRoute.GENERATOR)} className="mt-4 px-4 py-2 bg-white/10 rounded">Return Home</button>
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
      <div className="max-w-3xl mx-auto w-full px-6 sm:px-10 pt-12 pb-40 space-y-12">
        <header className="flex items-center justify-between relative">
            <button onClick={() => onNavigate(AppRoute.PREFERENCES)} className="size-11 rounded-full bg-white/5 backdrop-blur-[40px] border-[0.5px] border-white/12 flex items-center justify-center text-white/50 active:scale-90 transition-all">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-black uppercase tracking-tighter logo-text">Admin Analytics</h1>
            <div className="w-11 flex justify-end">
              <button onClick={fetchAnalytics} className={`text-white/50 hover:text-white ${isLoading ? 'animate-spin' : ''}`}>
                <RefreshCw size={20} />
              </button>
            </div>
        </header>

        <main className="grid grid-cols-2 gap-4">
          <StatCard title="Active Users" value={stats.activeUsers} icon={<Users size={24} className="text-emerald-400" />} />
          <StatCard title="Total Sessions" value={stats.totalSessions} icon={<MousePointer2 size={24} className="text-blue-400" />} />
          <StatCard title="Images Generated" value={stats.totalImages} icon={<ImageIcon size={24} className="text-purple-400" />} />
          <StatCard title="Returning Users" value={stats.recurringUsers} icon={<TrendingUp size={24} className="text-pink-400" />} />
        </main>

        <div className="p-6 bg-surface-dark border-[0.5px] border-white/10 rounded-[2rem] shadow-glass space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-white/50 mb-2">Deep Insights</h2>
          <div className="flex justify-between items-center py-2 border-b border-white/5">
            <span className="text-sm font-medium">Anonymous Sessions</span>
            <span className="font-mono">{stats.anonymousSessions}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/5">
            <span className="text-sm font-medium">Peak Concurrency (Est)</span>
            <span className="font-mono">{stats.peakConcurrency}</span>
          </div>
        </div>

        <div className="p-6 bg-red-500/10 border-[0.5px] border-red-500/30 rounded-[2rem] space-y-4">
            <h3 className="text-sm font-bold text-red-400">Database Tools</h3>
            <p className="text-xs text-red-300">Run the external SQL script to setup analytics or clear global images. Analytics is currently tracking your local usage since running the query.</p>
        </div>
      </div>
    </motion.div>
  );
};

const StatCard = ({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) => (
  <div className="p-6 bg-surface-dark border-[0.5px] border-white/10 rounded-[2rem] shadow-glass flex flex-col items-center justify-center text-center gap-3">
    {icon}
    <h3 className="text-[10px] font-black uppercase tracking-widest text-white/50">{title}</h3>
    <span className="text-3xl font-black">{value.toLocaleString()}</span>
  </div>
);
