import React, { useState } from 'react';
import { useProducts } from '../hooks/useProducts';

const inputStyle = {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    background: '#fff',
    color: '#333',
};

const ProductForm = ({ role, onCreated }) => {
    const { createProduct } = useProducts();
    const [formData, setFormData] = useState({
        name: '',
        price: 0,
        stockQuantity: 0,
        description: '',
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    if (role !== 'ROLE_ADMIN') {
        return (
            <div style={{ padding: '10px', background: '#ffeeba', borderRadius: '8px', color: '#856404', marginBottom: '20px' }}>
                상품 등록은 관리자만 가능합니다.
            </div>
        );
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'price' || name === 'stockQuantity' ? Number(value) : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        try {
            await createProduct(formData, selectedFile);
            setSuccess(true);
            setFormData({ name: '', price: 0, stockQuantity: 0, description: '' });
            setSelectedFile(null);
            const fileInput = document.getElementById('productFileInput');
            if (fileInput) fileInput.value = '';
            onCreated?.();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #ddd', color: '#333' }}>
            <h3 style={{ color: '#333', marginTop: 0 }}>새 상품 등록</h3>
            {error && <div style={{ color: 'red', marginBottom: '10px' }}>오류: {error}</div>}
            {success && <div style={{ color: 'green', marginBottom: '10px' }}>등록 완료</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>상품명</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} style={inputStyle} required />

                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>가격</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} style={inputStyle} required />

                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>재고</label>
                <input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} style={inputStyle} required />

                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>설명</label>
                <textarea name="description" value={formData.description} onChange={handleChange} style={{ ...inputStyle, height: '60px' }} />

                <input
                    type="file"
                    id="productFileInput"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    style={{ marginTop: '10px', color: '#333' }}
                />

                <button
                    type="submit"
                    style={{ padding: '12px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}
                >
                    상품 등록하기
                </button>
            </form>
        </div>
    );
};

export default ProductForm;
