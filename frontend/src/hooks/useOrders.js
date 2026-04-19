import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../api/apiClient';

export function useOrders(token, refreshFlag) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchOrders = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const data = await apiClient.get('/orders');
            setOrders(data ?? []);
        } catch (err) {
            console.error('주문 목록 로드 실패:', err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders, refreshFlag]);

    const fetchOrderDetail = useCallback(async (orderId) => {
        return apiClient.get(`/orders/${orderId}`);
    }, []);

    const cancelOrder = useCallback(async (orderId, reason) => {
        await apiClient.post(`/payment/cancel/${orderId}`, { cancelReason: reason });
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CANCELED' } : o));
    }, []);

    const loadReviews = useCallback(async (productId) => {
        return apiClient.get(`/reviews/product/${productId}`);
    }, []);

    const submitReview = useCallback(async (productId, content, rating, file) => {
        let imageUrl = '';
        if (file) {
            const fd = new FormData();
            fd.append('file', file);
            const result = await apiClient.upload('/files/upload', fd);
            imageUrl = result.imageUrl ?? '';
        }
        await apiClient.post('/reviews', { productId, content, rating, imageUrl });
    }, []);

    const updateReview = useCallback(async (reviewId, content, rating, file, existingImageUrl) => {
        let imageUrl = existingImageUrl ?? '';
        if (file) {
            const fd = new FormData();
            fd.append('file', file);
            const result = await apiClient.upload('/files/upload', fd);
            imageUrl = result.imageUrl ?? '';
        }
        await apiClient.put(`/reviews/${reviewId}`, { content, rating, imageUrl });
    }, []);

    const deleteReview = useCallback(async (reviewId) => {
        await apiClient.delete(`/reviews/${reviewId}`);
    }, []);

    const fetchAllOrdersAdmin = useCallback(async () => {
        return apiClient.get('/admin/orders');
    }, []);

    const deliverOrder = useCallback(async (orderId) => {
        await apiClient.patch(`/admin/orders/${orderId}/deliver`, {});
    }, []);

    return {
        orders,
        loading,
        fetchOrderDetail,
        cancelOrder,
        loadReviews,
        submitReview,
        updateReview,
        deleteReview,
        fetchAllOrdersAdmin,
        deliverOrder,
        refetch: fetchOrders,
    };
}
