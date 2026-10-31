import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';
import { visitorNotificationService } from './visitorNotificationService';

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
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            this.isSubscribed = true;
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            this.isSubscribed = false;
            this.scheduleReconnect();
          }
        });
    } catch (e) {
      console.warn('Realtime subscription initialization error:', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.channel) {
        try {
          supabase.removeChannel(this.channel);
        } catch {}
        this.channel = null;
      }
      this.init();
    }, 5000);
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
        console.error('Realtime subscriber callback error:', err);
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
  }
}

export const visitorRealtimeService = new VisitorRealtimeService();
