import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8080';

const ProductManager = ({ userToken }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. 상품 목록 불러오기
    const fetchProducts = async () => {
        try {
            setLoading(true);
            // 전체 상품 조회 API (기존 ProductController에 매핑된 주소에 맞게 호출)
            const response = await fetch(`${API_BASE_URL}/api/products`);
            if (response.ok) {
                const data = await response.json();
                setProducts(data);
            }
        } catch (error) {
            console.error("상품 목록 로드 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (productId) => {
        if (!window.confirm("정말로 이 상품을 삭제하시겠습니까? (이미지 파일도 함께 영구 삭제됩니다)")) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                alert("상품이 깔끔하게 삭제되었습니다!");
                fetchProducts(); // 목록 새로고침
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(errorData.message || "삭제 실패: 이 상품을 주문한 내역이 있어 삭제할 수 없습니다.");
            }
        } catch (error) {
            console.error("삭제 에러:", error);
        }
    };

    // 컴포넌트 마운트 시 상품 목록 로드
    useEffect(() => {
        fetchProducts();
    }, []);

    if (!userToken) return <div style={{ padding: '20px' }}>관리자 로그인이 필요합니다.</div>;

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h3>⚙️ 관리자 상품 관리</h3>
                <button style={addBtnStyle}>+ 새 상품 등록 (준비 중)</button>
            </div>

            {loading ? <p>상품을 불러오는 중...</p> : (
                <div style={gridStyle}>
                    {products.map(product => (
                        <div key={product.id} style={cardStyle}>
                            {/* 상품 이미지 표시 (없으면 빈 박스) */}
                            <div style={imageBoxStyle}>
                                {product.imageUrl ? (
                                    <img 
                                        src={`${API_BASE_URL}${product.imageUrl}`} 
                                        alt={product.name} 
                                        style={imageStyle} 
                                    />
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
                                <button style={editBtnStyle}>수정</button>
                                <button 
                                    onClick={() => handleDelete(product.id)} 
                                    style={deleteBtnStyle}
                                >
                                    삭제
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- 깔끔한 인라인 스타일 ---
const containerStyle = { padding: '20px', maxWidth: '900px', margin: '0 auto' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' };
const cardStyle = { 
    border: '1px solid #eee', 
    borderRadius: '12px', 
    overflow: 'hidden', 
    background: '#fff', 
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    color: '#333'
};
const imageBoxStyle = { height: '150px', background: '#f5f5f5', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' };
const imageStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const infoStyle = { padding: '15px 15px 5px 15px', fontSize: '14px' };
const actionStyle = { display: 'flex', gap: '10px', padding: '10px 15px 15px 15px' };
const addBtnStyle = { padding: '8px 15px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' };
const editBtnStyle = { flex: 1, padding: '8px', background: '#ffc107', color: '#000', border: 'none', borderRadius: '5px', cursor: 'pointer' };
const deleteBtnStyle = { flex: 1, padding: '8px', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' };

export default ProductManager;