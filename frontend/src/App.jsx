// frontend/src/App.jsx (새로운 코드)

import React, { useState, useEffect } from 'react';
import AuthManager from './AuthManager'; // ⭐️ AuthManager 컴포넌트 import
import './App.css';

// ----------------------------------------------------------------------
// ⭐️ 상품 등록 폼 컴포넌트 (관리자 전용) - 토큰과 ROLE을 받도록 수정
// ----------------------------------------------------------------------
const ProductForm = ({ onProductCreated, currentToken, currentRole }) => {
    // 상품 등록 폼 상태 로직 (이전과 동일)
    const [formData, setFormData] = useState({
        name: '', price: 0, stockQuantity: 0, description: '',
    });
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // 상품 등록 권한이 있는지 체크
    const hasAdminRole = currentRole === 'ROLE_ADMIN';

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

        if (!currentToken || !hasAdminRole) {
            setSubmitError("❌ 관리자(ROLE_ADMIN) 권한이 있는 토큰이 필요합니다.");
            return;
        }

        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`, // ⭐️ 현재 로그인된 토큰 사용
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
                throw new Error(`상품 등록 실패: ${response.status} (알 수 없는 오류)`);
            }

            const newProduct = await response.json();
            setSubmitSuccess(true);
            setFormData({ name: '', price: 0, stockQuantity: 0, description: '' });
            onProductCreated(newProduct);

        } catch (err) {
            console.error("상품 등록 중 오류:", err);
            setSubmitError(err.message);
        }
    };

    if (!hasAdminRole) {
        return (
            <div style={{ border: '1px solid #ffcc00', padding: '15px', marginBottom: '30px', textAlign: 'center' }}>
                <p style={{ margin: 0, color: '#cc8800' }}>⚠️ 상품 등록/수정은 관리자(ROLE_ADMIN)만 가능합니다.</p>
            </div>
        );
    }

    return (
        <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '30px' }}>
            <h2>📦 새 상품 등록 (관리자 전용)</h2>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '10px' }}>

                <label>상품명:</label><input name="name" value={formData.name} onChange={handleChange} required />
                <label>가격:</label><input name="price" type="number" value={formData.price} onChange={handleChange} required min="0" />
                <label>재고:</label><input name="stockQuantity" type="number" value={formData.stockQuantity} onChange={handleChange} required min="0" />
                <label>설명:</label><textarea name="description" value={formData.description} onChange={handleChange} style={{ resize: 'vertical' }} />

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
// ⭐️ 메인 App 컴포넌트
// ----------------------------------------------------------------------
function App() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ⭐️⭐️ 인증 상태를 App 컴포넌트에서 관리 ⭐️⭐️
    const [userToken, setUserToken] = useState(null);
    const [userRole, setUserRole] = useState(null);

    // 상품 목록을 가져오는 함수 (변동 없음)
    const fetchProducts = async () => { /* ... 생략 ... */
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

    // 로그인 성공 시 AuthManager에서 호출
    const handleLoginSuccess = (token, role) => {
        setUserToken(token);
        setUserRole(role);
    };

    // 로그아웃 시 AuthManager에서 호출
    const handleLogout = () => {
        setUserToken(null);
        setUserRole(null);
    };

    // 상품 등록 성공 시 목록 업데이트
    const handleProductCreated = (newProduct) => {
        setProducts(prev => [...prev, newProduct]);
    };


    // --- 화면 렌더링 ---
    return (
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <h1>🛍️ 쇼핑몰 상품 관리 및 목록</h1>

            {/* ⭐️ 1. 인증 관리 컴포넌트 */}
            <AuthManager
                onLoginSuccess={handleLoginSuccess}
                onLogout={handleLogout}
            />

            {/* ⭐️ 2. 상품 등록 폼 (로그인 & 관리자 권한 시 표시) */}
            <ProductForm
                onProductCreated={handleProductCreated}
                currentToken={userToken}
                currentRole={userRole}
            />

            {/* 3. 상품 목록 영역 */}
            <hr style={{ margin: '30px 0' }}/>
            <h3>📝 등록된 상품 목록</h3>

            {/* ... 상품 목록 조회 로직 (기존과 동일) ... */}
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