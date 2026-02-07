import React, { useState, useEffect } from 'react';
import CartList from './CartList';
import OrderList from './OrderList';
import AuthManager from './AuthManager';
import './App.css';

const API_BASE_URL = '';

// 📦 상품 등록 폼 (관리자 권한 체크 로직 포함)
const ProductForm = ({ onProductCreated, currentToken, currentRole }) => {
    const [formData, setFormData] = useState({ name: '', price: 0, stockQuantity: 0, description: '' });
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // 테스트 편의를 위해 ROLE_ADMIN이거나 토큰이 있으면 일단 허용 (나중에 엄격하게 수정 가능)
    const hasAdminRole = currentRole === 'ROLE_ADMIN' || currentToken;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'price' || name === 'stockQuantity' ? Number(value) : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError(null); setSubmitSuccess(false);
        try {
            const response = await fetch(`${API_BASE_URL}/api/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` },
                body: JSON.stringify(formData),
            });
            if (!response.ok) throw new Error("상품 등록 실패");
            const newProduct = await response.json();
            setSubmitSuccess(true);
            setFormData({ name: '', price: 0, stockQuantity: 0, description: '' });
            onProductCreated(newProduct);
        } catch (err) { setSubmitError(err.message); }
    };

    if (!hasAdminRole) return <div className="admin-notice">⚠️ 상품 등록은 관리자만 가능합니다.</div>;

    return (
        <div className="product-form-container" style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '30px' }}>
            <h2>📦 새 상품 등록</h2>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '10px' }}>
                <label>상품명:</label><input name="name" value={formData.name} onChange={handleChange} required />
                <label>가격:</label><input name="price" type="number" value={formData.price} onChange={handleChange} required />
                <label>재고:</label><input name="stockQuantity" type="number" value={formData.stockQuantity} onChange={handleChange} required />
                <label>설명:</label><textarea name="description" value={formData.description} onChange={handleChange} />
                <div style={{ gridColumn: '1 / 3', textAlign: 'right' }}><button type="submit">등록하기</button></div>
            </form>
            {submitSuccess && <p style={{ color: 'green' }}>✅ 등록 성공!</p>}
        </div>
    );
};

function App() {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userToken, setUserToken] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [cartMessage, setCartMessage] = useState(null);
    const [cartUpdateFlag, setCartUpdateFlag] = useState(0);

    // 상품 목록 가져오기 + 더미 데이터 삽입
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/products`);
            let data = [];
            if (response.ok) {
                data = await response.json();
            }

            // 🛠️ 테스트용 품절 상품 강제 삽입 (3번 케이스 확인용)
            const testData = [
                ...data,
                { id: 999, name: "[품절테스트] 품절된 상품", price: 10000, stockQuantity: 0, description: "재고가 0개인 상품입니다." }
            ];
            setProducts(testData);
            setError(null);
        } catch (err) {
            setError("상품 목록 로드 중 오류 발생");
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async (productId) => {
        if (!userToken) {
            setCartMessage({ type: 'error', text: '❌ 로그인이 필요합니다.' });
            setTimeout(() => setCartMessage(null), 3000);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/cart`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
                body: JSON.stringify({ productId, quantity: 1 }),
            });
            if (response.ok) {
                setCartUpdateFlag(prev => prev + 1);
                setCartMessage({ type: 'success', text: '✅ 장바구니에 담겼습니다!' });
            }
        } catch (e) { console.error(e); }
        setTimeout(() => setCartMessage(null), 3000);
    };

    const handleLogout = () => {
        sessionStorage.clear();
        setUserToken(null); setUserRole(null);
        alert("로그아웃 되었습니다.");
    };

    useEffect(() => {
        const savedToken = sessionStorage.getItem('token');
        const savedRole = sessionStorage.getItem('role');
        if (savedToken) {
            setUserToken(savedToken);
            setUserRole(savedRole);
        }
        fetchProducts();
    }, []);

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <h1>🛍️ 쇼핑몰 서비스</h1>
            <AuthManager
                onLoginSuccess={(token, role) => {
                    setUserToken(token); setUserRole(role);
                    sessionStorage.setItem('token', token);
                    sessionStorage.setItem('role', role);
                }}
                onLogout={handleLogout}
            />

            <ProductForm onProductCreated={(p) => setProducts([...products, p])} currentToken={userToken} currentRole={userRole} />

            <hr />
            <CartList userToken={userToken} isLoggedIn={!!userToken} onOrderSuccess={() => setCartUpdateFlag(f => f+1)} cartUpdateFlag={cartUpdateFlag} />
            <OrderList userToken={userToken} updateFlag={cartUpdateFlag} userRole={userRole} />

            <hr />
            {/* 🔍 검색창 영역 */}
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
                <input
                    type="text"
                    placeholder="상품 이름 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        boxSizing: 'border-box'
                    }}
                />
                {searchTerm && filteredProducts.length === 0 && (
                    <p style={{ marginTop: '10px', color: '#666' }}>🔍 "{searchTerm}"에 대한 검색 결과가 없습니다.</p>
                )}
            </div>

            <h3>📝 등록된 상품 목록</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {filteredProducts.map(product => (
                    <div key={product.id} className="product-card" style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '12px' }}>
                        <h4>{product.name}</h4>
                        <p>{product.price.toLocaleString()}원</p>
                        <p style={{ color: product.stockQuantity > 0 ? 'green' : 'red' }}>
                            {product.stockQuantity > 0 ? `재고: ${product.stockQuantity}` : "품절"}
                        </p>
                        <button
                            disabled={product.stockQuantity <= 0}
                            onClick={() => handleAddToCart(product.id)}
                            style={{ width: '100%', padding: '10px', backgroundColor: product.stockQuantity > 0 ? '#007bff' : '#ccc', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        >
                            {product.stockQuantity > 0 ? '🛒 담기' : '품절된 상품'}
                        </button>
                    </div>
                ))}
            </div>

            {cartMessage && (
                <div style={{ position: 'fixed', bottom: '20px', right: '20px', padding: '15px 25px', backgroundColor: cartMessage.type === 'error' ? '#ff4d4d' : '#28a745', color: '#fff', borderRadius: '8px' }}>
                    {cartMessage.text}
                </div>
            )}
        </div>
    );
}

export default App;