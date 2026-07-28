import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';

// Track session ID in memory
let currentSessionId: string | null = null;
let pendingPing: NodeJS.Timeout | null = null;

export const useAnalytics = (user: any) => {
  const initialized = useRef(false);
  const prevUserIdRef = useRef<string | null>(user?.id || null);

  useEffect(() => {
    if (!supabase) return;

    const initSession = async () => {
      try {
        const { data, error } = await supabase
          .from('analytics_sessions')
          .insert([{
            user_id: user?.id || null,
            email: user?.email || null,
            user_agent: navigator.userAgent,
            country: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown'
          }])
          .select('id')
          .single();

        if (error) {
          if (error.code === '42P01') {
            console.info('Analytics tables (analytics_sessions) are not created yet in Supabase.');
          } else {
            console.warn('Failed to init analytics session:', error.message || error);
          }
          return;
        }

        if (data && data.id) {
          currentSessionId = data.id;

          // Start pinging every minute to update last_ping_at
          if (pendingPing) clearInterval(pendingPing);
          pendingPing = setInterval(async () => {
            if (!currentSessionId) return;
            await supabase
              .from('analytics_sessions')
              .update({ last_ping_at: new Date().toISOString() })
              .eq('id', currentSessionId);
          }, 60000);
        }
      } catch (err) {
        console.warn('Analytics error:', err);
      }
    };

    if (!initialized.current) {
      initialized.current = true;
      initSession();
    } else if (currentSessionId && user?.id !== prevUserIdRef.current) {
      // User logged in or out during session, update session record
      prevUserIdRef.current = user?.id || null;
      supabase
        .from('analytics_sessions')
        .update({
          user_id: user?.id || null,
          email: user?.email || null,
          last_ping_at: new Date().toISOString()
        })
        .eq('id', currentSessionId)
        .then(() => {});
    }

    return () => {
      if (pendingPing) clearInterval(pendingPing);
    };
  }, [user]);

  const trackEvent = useCallback(async (eventType: string, details: any = {}) => {
    if (!supabase) return;
    try {
      const enrichedDetails = {
        ...details,
        is_anonymous: !user,
        is_registered: !!user,
        user_email: user?.email || 'Anonymous',
        timestamp: new Date().toISOString()
      };

      const payload: any = {
        event_type: eventType,
        details: enrichedDetails,
        user_id: user?.id || null
      };

      if (currentSessionId) {
        payload.session_id = currentSessionId;
      }

      const { error } = await supabase.from('analytics_events').insert([payload]);
      if (error && error.code !== '42P01') {
        console.warn('Event tracking failed:', error.message || error);
      }
    } catch (e) {
      // Ignored gracefully
    }
  }, [user]);

  return { trackEvent };
};

