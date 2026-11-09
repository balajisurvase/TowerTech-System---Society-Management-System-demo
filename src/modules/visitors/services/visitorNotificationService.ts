import { VisitorNotification } from '../types/visitor';
import { toast } from 'sonner';

type NotificationListener = (notifications: VisitorNotification[]) => void;

class VisitorNotificationService {
  private listeners: Set<NotificationListener> = new Set();
  private storageKey = 'towertech_visitor_notifications';

  private getAllStored(): VisitorNotification[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveAll(notifications: VisitorNotification[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(notifications));
      this.notifyListeners();
    } catch (e) {
      console.warn('Failed to save notifications to localStorage:', e);
    }
  }

  private notifyListeners() {
    const all = this.getAllStored();
    this.listeners.forEach(listener => listener(all));
  }

  subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    listener(this.getAllStored());
    return () => {
      this.listeners.delete(listener);
    };
  }

  getNotifications(userId?: string): VisitorNotification[] {
    const all = this.getAllStored();
    if (!userId) return all;
    return all.filter(n => n.recipient_user_id === userId || n.recipient_user_id === 'all');
  }

  getUnreadCount(userId?: string): number {
    return this.getNotifications(userId).filter(n => n.delivery_status !== 'read').length;
  }

  addNotification(notification: {
    recipient_user_id: string;
    visitor_id: string | number;
    title: string;
    message: string;
    category?: string;
    showToast?: boolean;
    toastType?: 'info' | 'success' | 'warning' | 'error';
  }): VisitorNotification {
    const newNotif: VisitorNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      recipient_user_id: notification.recipient_user_id,
      visitor_id: notification.visitor_id,
      title: notification.title,
      message: notification.message,
      category: notification.category || 'visitor',
      delivery_status: 'delivered',
      created_at: new Date().toISOString()
    };

    const existing = this.getAllStored();
    const updated = [newNotif, ...existing].slice(0, 50); // keep last 50
    this.saveAll(updated);

    if (notification.showToast !== false) {
      const type = notification.toastType || 'info';
      if (type === 'success') {
        toast.success(notification.title, { description: notification.message });
      } else if (type === 'warning' || type === 'error') {
        toast.error(notification.title, { description: notification.message });
      } else {
        toast.info(notification.title, { description: notification.message });
      }
    }

    return newNotif;
  }

  markAsRead(id: string) {
    const all = this.getAllStored();
    const updated = all.map(n => n.id === id ? { ...n, delivery_status: 'read' as const, read_at: new Date().toISOString() } : n);
    this.saveAll(updated);
  }

  markAllAsRead(userId?: string) {
    const all = this.getAllStored();
    const updated = all.map(n => {
      if (!userId || n.recipient_user_id === userId || n.recipient_user_id === 'all') {
        return { ...n, delivery_status: 'read' as const, read_at: new Date().toISOString() };
      }
      return n;
    });
    this.saveAll(updated);
  }

  clearAll() {
    this.saveAll([]);
  }
}

export const visitorNotificationService = new VisitorNotificationService();
