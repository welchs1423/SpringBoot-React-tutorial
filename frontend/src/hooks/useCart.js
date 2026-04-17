import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../api/apiClient';

export function useCart(token, refreshFlag) {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const totalPrice = cartItems.reduce(
        (sum, item) => sum + item.productPrice * item.quantity,
        0
    );

    const fetchCart = useCallback(async () => {
        if (!token) {
            setCartItems([]);
            return;
        }
        setLoading(true);
        try {
            const data = await apiClient.get('/cart');
            setCartItems(data ?? []);
        } catch {
            setCartItems([]);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchCart();
    }, [fetchCart, refreshFlag]);

    const addToCart = useCallback(async (productId) => {
        await apiClient.post('/cart', { productId, quantity: 1 });
        await fetchCart();
    }, [fetchCart]);

    const updateQuantity = useCallback(async (itemId, newQuantity) => {
        if (newQuantity < 1) return;
        await apiClient.patch(`/cart/${itemId}`, { quantity: newQuantity });
        await fetchCart();
    }, [fetchCart]);

    const removeItem = useCallback(async (itemId) => {
        await apiClient.delete(`/cart/${itemId}`);
        await fetchCart();
    }, [fetchCart]);

    const placeOrder = useCallback(async (orderInfo) => {
        await apiClient.post('/orders', { deliveryAddressSeq: null, ...orderInfo });
        await fetchCart();
    }, [fetchCart]);

    return {
        cartItems,
        loading,
        totalPrice,
        addToCart,
        updateQuantity,
        removeItem,
        placeOrder,
        refetch: fetchCart,
    };
}
