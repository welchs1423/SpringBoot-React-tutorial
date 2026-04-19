import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/apiClient';

export function useNotifications(isLoggedIn) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);

    const fetchUnreadCount = useCallback(async () => {
        if (!isLoggedIn) { setUnreadCount(0); return; }
        try {
            const data = await apiClient.get('/notifications/unread-count');
            setUnreadCount(data?.count ?? 0);
        } catch {
            setUnreadCount(0);
        }
    }, [isLoggedIn]);

    const fetchNotifications = useCallback(async () => {
        if (!isLoggedIn) return;
        try {
            const data = await apiClient.get('/notifications');
            setNotifications(data ?? []);
        } catch {
            setNotifications([]);
        }
    }, [isLoggedIn]);

    useEffect(() => {
        fetchUnreadCount();
        if (!isLoggedIn) return;
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [isLoggedIn, fetchUnreadCount]);

    const handleToggle = useCallback(async () => {
        const next = !open;
        setOpen(next);
        if (next) {
            await fetchNotifications();
            await fetchUnreadCount();
        }
    }, [open, fetchNotifications, fetchUnreadCount]);

    const markAllAsRead = useCallback(async () => {
        try {
            await apiClient.patch('/notifications/read-all');
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch { /* ignore */ }
    }, []);

    return { notifications, unreadCount, open, setOpen, handleToggle, markAllAsRead, fetchUnreadCount };
}
