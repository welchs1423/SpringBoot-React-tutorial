// frontend/src/App.jsx

import React, { useState, useEffect } from 'react';
import './App.css';

// ----------------------------------------------------------------------
// ⭐️ 상품 등록 폼 컴포넌트 (관리자 기능)
// ----------------------------------------------------------------------
const ProductForm = ({ onProductCreated, adminToken }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    stockQuantity: 0,
    description: '',
  });
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stockQuantity' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!adminToken) {
        setSubmitError("관리자 토큰이 없어 상품을 등록할 수 없습니다.");
        return;
    }

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // ⭐️ 관리자 토큰 사용 (Authorization 헤더)
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.status === 401) {
          throw new Error("401 Unauthorized: 토큰이 유효하지 않거나 만료되었습니다.");
      }
      if (response.status === 403) {
          throw new Error("403 Forbidden: 권한이 없습니다. 관리자(ROLE_ADMIN) 토큰인지 확인하세요.");
      }
      if (!response.ok) {
          throw new Error(`상품 등록 실패: ${response.status}`);
      }

      const newProduct = await response.json();
      setSubmitSuccess(true);
      setFormData({ name: '', price: 0, stockQuantity: 0, description: '' }); // 폼 초기화
      onProductCreated(newProduct); // App 컴포넌트로 새 상품 정보 전달

    } catch (err) {
      console.error("상품 등록 중 오류:", err);
      setSubmitError(err.message);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '30px' }}>
      <h2>📦 새 상품 등록 (관리자 전용)</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '10px' }}>

        <label>상품명:</label>
        <input name="name" value={formData.name} onChange={handleChange} required />

        <label>가격:</label>
        <input name="price" type="number" value={formData.price} onChange={handleChange} required min="0" />

        <label>재고:</label>
        <input name="stockQuantity" type="number" value={formData.stockQuantity} onChange={handleChange} required min="0" />

        <label>설명:</label>
        <textarea name="description" value={formData.description} onChange={handleChange} style={{ resize: 'vertical' }} />

        <div style={{ gridColumn: '1 / 3', textAlign: 'right' }}>
            <button type="submit">상품 등록하기</button>
        </div>
      </form>

      {submitError && <p style={{ color: 'red', marginTop: '10px' }}>오류: {submitError}</p>}
      {submitSuccess && <p style={{ color: 'green', marginTop: '10px' }}>✅ 상품 등록 성공!</p>}
    </div>
  );
};


// ----------------------------------------------------------------------
// ⭐️ 메인 App 컴포넌트 (목록 및 폼 통합)
// ----------------------------------------------------------------------
function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ⭐️⭐️ 관리자 토큰 상태 (상품 등록에 사용) ⭐️⭐️
  const [adminToken, setAdminToken] = useState('');

  // 상품 목록을 가져오는 함수
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error(`상품 목록 로드 실패: ${response.status}`);
      }
      const data = await response.json();
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error("상품 API 호출 중 오류:", err);
      setError(`상품 목록을 가져오는 데 실패했습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 상품 등록 성공 시 호출되어 목록을 즉시 업데이트
  const handleProductCreated = (newProduct) => {
    setProducts(prev => [...prev, newProduct]);
  };


  // --- 화면 렌더링 ---
  return (
    <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>🛍️ 쇼핑몰 상품 관리 및 목록</h1>

      {/* 1. 관리자 토큰 입력 영역 */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #f0f0f0' }}>
        <h3>🔑 관리자 인증 (상품 등록/수정용)</h3>
        <p>로그인 토큰을 여기에 입력하면 상품 등록 폼이 활성화됩니다.</p>
        <input
          type="text"
          value={adminToken}
          onChange={(e) => setAdminToken(e.target.value)}
          placeholder="관리자 JWT 토큰 (Bearer 없이 토큰 값만)"
          style={{ width: '100%', padding: '8px' }}
        />
        {adminToken && <p style={{ color: 'blue', marginTop: '5px' }}>토큰 입력 완료. 상품 등록 테스트 가능.</p>}
      </div>

      {/* 2. 상품 등록 폼 (토큰이 있을 때만 표시) */}
      {adminToken && (
          <ProductForm
              onProductCreated={handleProductCreated}
              adminToken={adminToken}
          />
      )}

      {/* 3. 상품 목록 영역 */}
      <hr style={{ margin: '30px 0' }}/>
      <h3>📝 등록된 상품 목록</h3>

      {loading && <p>상품 목록을 불러오는 중입니다...</p>}
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

      <div className="product-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {!loading && products.length === 0 && !error && (
          <p>등록된 상품이 없습니다.</p>
        )}

        {products.map((product) => (
          <div key={product.id} style={{ border: '1px solid #ddd', padding: '15px' }}>
            <h4>{product.name} (ID: {product.id})</h4>
            <p><strong>가격:</strong> {product.price.toLocaleString()} 원</p>
            <p><strong>재고:</strong> {product.stockQuantity}개</p>
            <p style={{ fontSize: '0.9em', color: '#666' }}>{product.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;