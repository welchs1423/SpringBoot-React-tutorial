// frontend/src/App.jsx

import React, { useState, useEffect } from 'react';

function App() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

  // 컴포넌트가 처음 렌더링되거나 'token' 값이 변경될 때마다 실행됩니다.
  useEffect(() => {
      const fetchProducts = async() => {
          try{
              const response = await fetch('/api/products');

              if(!response.ok){
                  throw new Error(`상품 목록 로드 실패: ${response.status}`);
              }
            const data = await response.json();
            setProducts(data);
            setError(null);
          }catch(err){
              console.error("상품 API 호출 중 오류:", err)
              setError(`상품 목록을 가져오는 데 실패했습니다: ${err.message}`);
          } finally {
            setLoading(false);
          }
      };
  fetchProducts();
  }, []); // 'token' 상태가 바뀔 때마다 useEffect 재실행

// --- 화면 렌더링 ---
  return (
    <div className="container">
      <h1>🛍️ 쇼핑몰 상품 목록</h1>

      {/* 상태별 메시지 출력 */}
      {loading && <p>상품 목록을 불러오는 중입니다...</p>}
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

      {/* 상품 목록 출력 */}
      {!loading && products.length === 0 && !error && (
        <p>등록된 상품이 없습니다. 관리자 계정으로 상품을 등록해주세요.</p>
      )}

      <div className="product-list">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <h3>{product.name}</h3>
            <p><strong>가격:</strong> {product.price.toLocaleString()} 원</p>
            <p><strong>재고:</strong> {product.stockQuantity}개</p>
            <p className="description">{product.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;