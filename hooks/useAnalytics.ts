import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';

// Track session ID in memory
let currentSessionId: string | null = null;
let pendingPing: NodeJS.Timeout | null = null;

export const useAnalytics = (user: any) => {
  const initialized = useRef(false);

  useEffect(() => {
    if (!supabase) return;
    if (initialized.current) return;
    initialized.current = true;

    const initSession = async () => {
      try {
        const { data, error } = await supabase
          .from('analytics_sessions')
          .insert([{
            user_id: user?.id || null,
            email: user?.email || null,
            user_agent: navigator.userAgent,
            country: Intl.DateTimeFormat().resolvedOptions().timeZone // basic locale proxy
          }])
          .select('id')
          .single();

        if (error) {
            console.error('Failed to init analytics session', error);
            return;
        }

        if (data && data.id) {
          currentSessionId = data.id;

          // Start pinging every minute to update last_ping_at
          pendingPing = setInterval(async () => {
            if (!currentSessionId) return;
            await supabase
              .from('analytics_sessions')
              .update({ last_ping_at: new Date().toISOString() })
              .eq('id', currentSessionId);
          }, 60000);
        }
      } catch (err) {
        console.error('Analytics error:', err);
      }
    };

    initSession();

    return () => {
      if (pendingPing) clearInterval(pendingPing);
    };
  }, [user]);

  const trackEvent = useCallback(async (eventType: string, details: any = {}) => {
    if (!currentSessionId || !supabase) return;
    try {
      await supabase.from('analytics_events').insert([{
        session_id: currentSessionId,
        user_id: user?.id || null,
        event_type: eventType,
        details
      }]);
    } catch (e) {
      console.error('Event tracking failed', e);
    }
  }, [user]);

  return { trackEvent };
};
