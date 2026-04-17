import { useState, useCallback } from 'react';
import { apiClient } from '../api/apiClient';

const DUMMY_OUT_OF_STOCK = {
    id: 999,
    name: '[품절테스트] 품절된 상품',
    price: 10000,
    stockQuantity: 0,
    description: '재고가 0개인 상품입니다.',
    imageUrl: null,
};

export function useProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiClient.get('/products');
            setProducts([...(data ?? []), DUMMY_OUT_OF_STOCK]);
        } catch (err) {
            setError(err.message ?? '상품 목록 로드 중 오류 발생');
        } finally {
            setLoading(false);
        }
    }, []);

    const createProduct = useCallback(async (formData, file) => {
        let imageUrl = '';
        if (file) {
            const fd = new FormData();
            fd.append('file', file);
            const uploadResult = await apiClient.upload('/upload', fd);
            imageUrl = uploadResult.imageUrl ?? '';
        }
        return apiClient.post('/products', { ...formData, imageUrl });
    }, []);

    const deleteProduct = useCallback(async (productId) => {
        await apiClient.delete(`/products/${productId}`);
    }, []);

    return { products, loading, error, fetchProducts, createProduct, deleteProduct };
}
