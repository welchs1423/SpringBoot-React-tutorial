import { useEffect, useRef } from 'react';

export function useSSE(isLoggedIn, onNotification) {
    const esRef = useRef(null);
    const callbackRef = useRef(onNotification);

    useEffect(() => {
        callbackRef.current = onNotification;
    }, [onNotification]);

    useEffect(() => {
        if (!isLoggedIn) {
            esRef.current?.close();
            esRef.current = null;
            return;
        }

        const token = sessionStorage.getItem('token');
        if (!token) return;

        const url = `/api/notifications/subscribe?token=${encodeURIComponent(token)}`;
        const es = new EventSource(url);
        esRef.current = es;

        es.addEventListener('notification', (e) => {
            try {
                const data = JSON.parse(e.data);
                callbackRef.current?.(data);
            } catch {
                // ignore
            }
        });

        es.onerror = () => {
            es.close();
            esRef.current = null;
        };

        return () => {
            es.close();
            esRef.current = null;
        };
    }, [isLoggedIn]);
}
