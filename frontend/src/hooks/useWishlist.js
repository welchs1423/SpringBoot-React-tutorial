import { useState, useCallback, useRef } from 'react';
import { apiClient } from '../api/apiClient';

export function useWishlist(isLoggedIn) {
    const [wishlistedIds, setWishlistedIds] = useState(new Set());
    const [wishlistItems, setWishlistItems] = useState([]);
    const debounceTimers = useRef({});

    const fetchWishlist = useCallback(async () => {
        if (!isLoggedIn) {
            setWishlistedIds(new Set());
            setWishlistItems([]);
            return;
        }
        try {
            const data = await apiClient.get('/wishlist');
            const items = data ?? [];
            setWishlistItems(items);
            setWishlistedIds(new Set(items.map(item => item.productId)));
        } catch {
            setWishlistedIds(new Set());
            setWishlistItems([]);
        }
    }, [isLoggedIn]);

    const toggleWishlist = useCallback((productId) => {
        if (!isLoggedIn) return Promise.resolve(null);

        clearTimeout(debounceTimers.current[productId]);

        return new Promise((resolve) => {
            debounceTimers.current[productId] = setTimeout(async () => {
                try {
                    const result = await apiClient.post(`/wishlist/toggle/${productId}`, {});
                    const wishlisted = result?.wishlisted ?? false;
                    setWishlistedIds(prev => {
                        const next = new Set(prev);
                        if (wishlisted) next.add(productId);
                        else next.delete(productId);
                        return next;
                    });
                    if (!wishlisted) {
                        setWishlistItems(prev => prev.filter(item => item.productId !== productId));
                    } else {
                        apiClient.get('/wishlist').then(data => setWishlistItems(data ?? [])).catch(() => {});
                    }
                    resolve(wishlisted);
                } catch {
                    resolve(null);
                }
            }, 300);
        });
    }, [isLoggedIn]);

    return { wishlistedIds, wishlistItems, fetchWishlist, toggleWishlist };
}
