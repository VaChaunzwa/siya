import { apiService } from './apiService';
import authService from './authService';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'assignment' | 'delivery' | 'stop' | 'system' | 'dispatch';
  data?: any;
  createdAt: string;
  read: boolean;
  userId: string;
}

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];

  /**
   * Fetch notifications for the current user
   */
  async fetchNotifications(): Promise<Notification[]> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Fetch live notifications from API (no more mock data)
      const liveNotifications = await this.getLiveNotifications(user);
      
      this.notifications = liveNotifications;
      this.notifyListeners();
      
      return this.notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Get live notifications from API (replaces mock notifications)
   */
  private async getLiveNotifications(user: any): Promise<Notification[]> {
    try {
      // In production, this would make an actual API call to fetch live notifications
      // const response = await apiService.get(`/notifications?userId=${user.id}`);
      // return response.data;
      
      // For now, return empty array to remove mock/placeholder notifications
      // When backend API is ready, replace this with actual API call
      return [];
    } catch (error) {
      console.error('Error fetching live notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      // In production: await apiService.put(`/notifications/${notificationId}/read`);
      
      this.notifications = this.notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      );
      
      this.notifyListeners();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      // In production: await apiService.put('/notifications/mark-all-read');
      
      this.notifications = this.notifications.map(notification => ({
        ...notification,
        read: true
      }));
      
      this.notifyListeners();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  /**
   * Get unread notifications count
   */
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * Get all notifications
   */
  getNotifications(): Notification[] {
    return this.notifications;
  }

  /**
   * Get unread notifications
   */
  getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.read);
  }

  /**
   * Subscribe to notification updates
   */
  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of notification updates
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.notifications));
  }

  /**
   * Simulate real-time notifications (in production, this would be handled by push notifications or WebSocket)
   */
  startPolling(intervalMs: number = 30000): () => void {
    const interval = setInterval(() => {
      this.fetchNotifications();
    }, intervalMs);

    return () => clearInterval(interval);
  }

  // Helper methods for mock data
  private getRandomClientName(): string {
    const clients = [
      'ABC Corporation',
      'XYZ Industries',
      'Global Logistics Ltd',
      'Metro Supplies',
      'City Distribution',
      'Prime Retail Group',
      'Express Commerce',
      'Urban Solutions'
    ];
    return clients[Math.floor(Math.random() * clients.length)];
  }

  private getRandomTime(): string {
    const hours = Math.floor(Math.random() * 12) + 1;
    const minutes = Math.random() < 0.5 ? '00' : '30';
    const period = Math.random() < 0.5 ? 'AM' : 'PM';
    return `${hours}:${minutes} ${period}`;
  }
}

export const notificationService = new NotificationService();
export default notificationService;