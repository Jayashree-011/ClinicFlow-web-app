import api, { getCookie } from './client';

export interface Notification {
  notificationId: number;
  userId?: number;
  patientId?: number;
  entityId?: number;
  message: string;
  category: string;        // APPOINTMENT | PRESCRIPTION | LAB | BILLING | PHARMACY
  channel: 'SMS' | 'EMAIL' | 'PUSH';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  status: string;          // UNREAD | READ
  createdAt: string;
  readAt?: string;
}

export async function getMyNotifications(): Promise<Notification[]> {
  const userId = getCookie('userId');
  const role   = getCookie('role')?.toLowerCase() ?? '';

  if (!userId) return [];

  const endpoint = role === 'patient'
    ? `/notifications/patient/${userId}`
    : `/notifications/user/${userId}`;

  const res = await api.get<Notification[]>(endpoint);
  return res.data ?? [];
}

export async function getUnreadCount(): Promise<number> {
  const all = await getMyNotifications();
  return all.filter(n => n.status === 'UNREAD').length;
}

export async function markAsRead(notificationId: number): Promise<Notification> {
  const res = await api.post<Notification>(`/notifications/${notificationId}/read`);
  return res.data;
}

export async function markAllAsRead(notifications: Notification[]): Promise<void> {
  const unread = notifications.filter(n => n.status === 'UNREAD');
  await Promise.allSettled(unread.map(n => markAsRead(n.notificationId)));
}

export async function deleteNotification(notificationId: number): Promise<void> {
  await api.delete(`/notifications/${notificationId}`);
}
