import { useState, useEffect, useRef, useCallback } from 'react';
import { getApiUrl, getAuthHeaders } from '../context/AuthContext';

export interface NotificationItem {
  _id: string;
  recipientId: string;
  recipientRole: string;
  title: string;
  message: string;
  type: string;
  relatedBookingId?: any;
  relatedPostId?: any;
  read: boolean;
  createdAt: string;
}

export function useNotifications(recipientId: string | undefined, recipientRole: string) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const fetchNotifications = useCallback(async () => {
    if (!recipientId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${getApiUrl()}/api/notifications?recipientId=${recipientId}&recipientRole=${recipientRole}&limit=50`,
        { headers: getAuthHeaders() }
      );
      const data = await res.json();
      if (data?.data) setNotifications(data.data);
    } catch {}
    setLoading(false);
  }, [recipientId, recipientRole]);

  const fetchUnreadCount = useCallback(async () => {
    if (!recipientId) return;
    try {
      const res = await fetch(
        `${getApiUrl()}/api/notifications/unread-count?recipientId=${recipientId}&recipientRole=${recipientRole}`,
        { headers: getAuthHeaders() }
      );
      const data = await res.json();
      if (typeof data?.count === 'number') setUnreadCount(data.count);
    } catch {}
  }, [recipientId, recipientRole]);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    intervalRef.current = setInterval(() => {
      fetchUnreadCount();
    }, 15000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNotifications, fetchUnreadCount]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`${getApiUrl()}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllAsRead = async () => {
    if (!recipientId) return;
    try {
      await fetch(`${getApiUrl()}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, recipientRole })
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  return { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead };
}
