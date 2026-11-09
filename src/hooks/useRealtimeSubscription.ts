import { useEffect, useRef } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UseRealtimeSubscriptionOptions {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: string;
  filter?: string;
  onData: (payload: RealtimePostgresChangesPayload<any>) => void;
  enabled?: boolean;
}

export function useRealtimeSubscription({
  table,
  event = '*',
  schema = 'public',
  filter,
  onData,
  enabled = true
}: UseRealtimeSubscriptionOptions) {
  const callbackRef = useRef(onData);
  callbackRef.current = onData;

  useEffect(() => {
    if (!enabled) return;

    const channelName = `realtime_${table}_${Math.random().toString(36).substring(2, 9)}`;
    
    const channelConfig: any = {
      event,
      schema,
      table
    };

    if (filter) {
      channelConfig.filter = filter;
    }

    const channel: RealtimeChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        channelConfig,
        (payload: RealtimePostgresChangesPayload<any>) => {
          callbackRef.current(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Channel connected successfully
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, event, schema, filter, enabled]);
}
