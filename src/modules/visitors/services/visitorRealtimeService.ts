import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';

type RealtimeCallback = (payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRecord: any;
  oldRecord: any;
}) => void;

class VisitorRealtimeService {
  private channel: RealtimeChannel | null = null;
  private subscribers: Set<RealtimeCallback> = new Set();
  private isSubscribed = false;
  private reconnectTimer: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 4;

  init() {
    if (this.channel || typeof window === 'undefined') return;

    try {
      this.channel = supabase
        .channel('realtime:visitors-management')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'visitors' },
          (payload) => {
            this.handleDatabaseChange(payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.isSubscribed = true;
            this.reconnectAttempts = 0;
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            this.isSubscribed = false;
            this.scheduleReconnect();
          }
        });
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      // Quiet backoff after max retries
      return;
    }
    this.reconnectAttempts++;
    const delay = Math.min(5000 * Math.pow(2, this.reconnectAttempts - 1), 30000);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.channel) {
        try {
          supabase.removeChannel(this.channel);
        } catch {}
        this.channel = null;
      }
      this.init();
    }, delay);
  }

  private handleDatabaseChange(payload: any) {
    const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
    const newRecord = payload.new;
    const oldRecord = payload.old;

    // Notify all active React subscribers
    this.subscribers.forEach(cb => {
      try {
        cb({ eventType, newRecord, oldRecord });
      } catch (err) {
        console.warn('[visitorRealtime] Subscriber callback warning:', err);
      }
    });
  }

  subscribe(callback: RealtimeCallback): () => void {
    this.subscribers.add(callback);
    if (!this.channel) {
      this.init();
    }
    return () => {
      this.subscribers.delete(callback);
    };
  }

  unsubscribeAll() {
    this.subscribers.clear();
    if (this.channel) {
      try {
        supabase.removeChannel(this.channel);
      } catch {}
      this.channel = null;
      this.isSubscribed = false;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
  }
}

export const visitorRealtimeService = new VisitorRealtimeService();
