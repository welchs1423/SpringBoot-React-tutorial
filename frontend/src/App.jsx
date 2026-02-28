import React, { useState, useEffect } from 'react';
import CartList from './CartList';
import OrderList from './OrderList';
import AuthManager from './AuthManager';
import ProductManager from './ProductManager';
import CheckoutTest from './CheckoutTest';
import './App.css';

const API_BASE_URL = 'http://localhost:8080';

// 📦 상품 등록 폼 (관리자 권한 체크 로직 포함)
const ProductForm = ({ onProductCreated, currentToken, currentRole }) => {
    const [formData, setFormData] = useState({ name: '', price: 0, stockQuantity: 0, description: '' });
    const [selectedFile, setSelectedFile] = useState(null);
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

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError(null); 
        setSubmitSuccess(false);

        let uploadedImageUrl = '';

        try {
            if (selectedFile) {
                const fileData = new FormData();
                fileData.append('file', selectedFile);

                const uploadRes = await fetch(`${API_BASE_URL}/api/upload`, {
                    method: 'POST',
                    body: fileData,
                });

                if (!uploadRes.ok) throw new Error("이미지 업로드 실패");
                const uploadResult = await uploadRes.json();
                uploadedImageUrl = uploadResult.imageUrl;
            }

            const productData = {
                ...formData,
                imageUrl: uploadedImageUrl
            };

            const response = await fetch(`${API_BASE_URL}/api/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` },
                body: JSON.stringify(productData),
            });

            if (!response.ok) {
                const errorMsg = await response.text();
                throw new Error(errorMsg || "상품 등록에 실패했습니다.");
            }
            const newProduct = await response.json();
            alert("🎉 상품이 성공적으로 등록되었습니다!");

            setFormData({ name: '', price: 0, stockQuantity: 0, description: '' });

            setSelectedFile(null);

            const fileInput = document.getElementById('fileInput');
            if(fileInput) fileInput.value = "";
            
            onProductCreated();
        } catch (err) { setSubmitError(err.message); }
    };

    if (!hasAdminRole) return <div className="admin-notice" style={{ padding: '10px', background: '#ffeeba', borderRadius: '8px', color: '#856404', marginBottom: '20px' }}>⚠️ 상품 등록은 관리자만 가능합니다.</div>;

    return (
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #ddd', color: '#333' }}>
            <h3 style={{ color: '#333', marginTop: 0 }}>📦 새 상품 등록</h3>
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
                    id="fileInput"
                    onChange={(e) => setSelectedFile(e.target.files[0])} 
                    style={{ marginTop: '10px', color: '#333' }} 
                />
                
                <button type="submit" style={{ padding: '12px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
                    🚀 상품 등록하기
                </button>
            </form>
        </div>
    );
};

function App() {
    const [view, setView] = useState('main'); // 🟢 최상단 화면 탭 상태 관리 추가
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userToken, setUserToken] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [currentUserName, setCurrentUserName] = useState(null);
    const [cartMessage, setCartMessage] = useState(null);
    const [cartUpdateFlag, setCartUpdateFlag] = useState(0);

    // 상품 목록 가져오기
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/products`);
            let data = [];
            if (response.ok) {
                data = await response.json();
            }

            const testData = [
                ...data,
                { id: 999, name: "[품절테스트] 품절된 상품", price: 10000, stockQuantity: 0, description: "재고가 0개인 상품입니다.", imageUrl: null }
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
        setView('main'); // 로그아웃 시 메인 화면으로 이동
    };

useEffect(() => {
        const savedToken = sessionStorage.getItem('token');
        const savedRole = sessionStorage.getItem('role');
        const savedName = sessionStorage.getItem('username');
        if (savedToken) {
            setUserToken(savedToken);
            setUserRole(savedRole);
            setCurrentUserName(savedName);
        }
        fetchProducts();

        // 툐스 결제 성공 URL 파라미터 가로채기
        const urlParams = new URLSearchParams(window.location.search);
        const paymentKey = urlParams.get("paymentKey");
        const orderId = urlParams.get("orderId");
        const amount = urlParams.get("amount");

        if (paymentKey && orderId && amount) {
            console.log("결제 성공 데이터:", { paymentKey, orderId, amount });
            alert("결제 가승인 성공! 금액: " + amount + "원\n이제 백엔드 최종 승인 로직을 탑재할 차례입니다.");
            
            // 처리 후 지저분한 URL을 깔끔하게 정리해줍니다.
            window.history.replaceState({}, document.title, "/");
        }
    }, []);

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
            {/* 🟢 최상단 네비게이션 (탭 메뉴) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                <h1 style={{ margin: 0 }}>🛍️ React-Spring Mall</h1>
                <nav style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setView('main')} style={navBtnStyle(view === 'main')}>🏠 홈 (쇼핑)</button>
                    {userToken && (
                        <button onClick={() => setView('orders')} style={navBtnStyle(view === 'orders')}>📦 내 주문/리뷰</button>
                    )}
                    {userToken && (
                        <button onClick={() => setView('admin')} style={navBtnStyle(view === 'admin', true)}>⚙️ 상품 관리(관리자)</button>
                    )}
                    <button onClick={() => setView('checkout')} style={navBtnStyle(view === 'checkout')}>💳 결제 테스트</button>
                </nav>
            </div>

            <AuthManager
                onLoginSuccess={(token, role, username) => {
                    setUserToken(token);
                    setUserRole(role);
                    setCurrentUserName(username);
                    sessionStorage.setItem('token', token);
                    sessionStorage.setItem('role', role);
                    sessionStorage.setItem('username', username);
                }}
                onLogout={handleLogout}
            />

            {/* 🟢 화면 전환 로직 */}
            {view === 'admin' && (
                <>
                    <ProductForm 
                        onProductCreated={() => {
                            console.log("새 상품 등록 감지!");
                            fetchProducts(); // App의 products 상태 업데이트
                        }} 
                        currentToken={userToken} 
                        currentRole={userRole} 
                    />
                    <ProductManager 
                        key={products.length} 
                        userToken={userToken} 
                    />
                </>
            )}

            {view === 'orders' && (
                <OrderList userToken={userToken} updateFlag={cartUpdateFlag} currentUserName={currentUserName} />
            )}

            {view === 'main' && (
                <>
                    <CartList userToken={userToken} isLoggedIn={!!userToken} onOrderSuccess={() => setCartUpdateFlag(f => f + 1)} cartUpdateFlag={cartUpdateFlag} />

                    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
                        <input
                            type="text"
                            placeholder="상품 이름 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                        />
                    </div>

                    <h3>📝 전체 상품 목록</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                        {filteredProducts.map(product => (
                            <div key={`prod-${product.id}`} className="product-card" style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '12px', background: '#fff', color: '#333' }}>
                                {product.imageUrl ? (
                                    <img src={`${API_BASE_URL}${product.imageUrl}`} alt={product.name} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '200px', backgroundColor: '#eee', borderRadius: '8px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>이미지 없음</div>
                                )}
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
                </>
            )}

            {view === 'checkout' && (
                <CheckoutTest />
            )}

            {/* 장바구니 알림 모달 */}
            {cartMessage && (
                <div style={{ position: 'fixed', bottom: '20px', right: '20px', padding: '15px 25px', backgroundColor: cartMessage.type === 'error' ? '#ff4d4d' : '#28a745', color: '#fff', borderRadius: '8px', zIndex: 9999 }}>
                    {cartMessage.text}
                </div>
            )}
        </div>
    );
}

const inputStyle = { padding: '10px', borderRadius: '6px', border: '1px solid #ccc', background: '#fff', color: '#333' };

// 🟢 네비게이션 버튼 스타일 헬퍼
const navBtnStyle = (isActive, isAdmin = false) => ({
    padding: '8px 16px',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: 'bold',
    background: isActive ? (isAdmin ? '#dc3545' : '#007bff') : '#e9ecef',
    color: isActive ? '#fff' : '#495057',
    transition: 'all 0.2s'
});

export default App;