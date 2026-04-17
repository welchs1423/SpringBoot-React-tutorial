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

    const submitReview = useCallback(async (productId, content, rating) => {
        await apiClient.post('/reviews', { productId, content, rating });
    }, []);

    const updateReview = useCallback(async (reviewId, content, rating) => {
        await apiClient.put(`/reviews/${reviewId}`, { content, rating });
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
