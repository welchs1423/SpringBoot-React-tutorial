import React, { useEffect } from 'react';

export function ToastNotification({ toasts, onRemove }) {
    return (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '320px' }}>
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onRemove }) {
    useEffect(() => {
        const timer = setTimeout(() => onRemove(toast.id), 4000);
        return () => clearTimeout(timer);
    }, [toast.id, onRemove]);

    return (
        <div style={{ background: '#1a73e8', color: '#fff', borderRadius: '10px', padding: '14px 18px', boxShadow: '0 4px 16px rgba(0,0,0,0.18)', fontSize: '14px', lineHeight: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', animation: 'slideIn 0.3s ease' }}>
            <div>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>새 알림</div>
                <div>{toast.message}</div>
            </div>
            <button onClick={() => onRemove(toast.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: '16px', padding: 0, lineHeight: 1, flexShrink: 0 }}>✕</button>
        </div>
    );
}
