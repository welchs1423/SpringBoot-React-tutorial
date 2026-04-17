import React, { useEffect } from 'react';
import { useProducts } from './hooks/useProducts';

const ProductManager = ({ token }) => {
    const { products, loading, fetchProducts, deleteProduct } = useProducts();

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleDelete = async (productId) => {
        if (!window.confirm('이 상품을 삭제하시겠습니까? (이미지 파일도 함께 삭제됩니다)')) return;
        try {
            await deleteProduct(productId);
            await fetchProducts();
        } catch (err) {
            alert(err.message || '삭제 실패: 이 상품을 주문한 내역이 있어 삭제할 수 없습니다.');
        }
    };

    if (!token) return <div style={{ padding: '20px' }}>관리자 로그인이 필요합니다.</div>;

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h3>관리자 상품 관리</h3>
            </div>

            {loading ? <p>상품을 불러오는 중...</p> : (
                <div style={gridStyle}>
                    {products.map(product => (
                        <div key={product.id} style={cardStyle}>
                            <div style={imageBoxStyle}>
                                {product.imageUrl ? (
                                    <img src={product.imageUrl} alt={product.name} style={imageStyle} />
                                ) : (
                                    <span style={{ color: '#aaa' }}>No Image</span>
                                )}
                            </div>
                            <div style={infoStyle}>
                                <strong>{product.name}</strong>
                                <p style={{ margin: '5px 0', color: '#666' }}>
                                    {product.price.toLocaleString()}원 | 재고: {product.stockQuantity}개
                                </p>
                            </div>
                            <div style={actionStyle}>
                                <button onClick={() => handleDelete(product.id)} style={deleteBtnStyle}>삭제</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const containerStyle = { padding: '20px', maxWidth: '900px', margin: '0 auto' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' };
const cardStyle = { border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', color: '#333' };
const imageBoxStyle = { height: '150px', background: '#f5f5f5', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' };
const imageStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const infoStyle = { padding: '15px 15px 5px 15px', fontSize: '14px' };
const actionStyle = { display: 'flex', gap: '10px', padding: '10px 15px 15px 15px' };
const deleteBtnStyle = { flex: 1, padding: '8px', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' };

export default ProductManager;
