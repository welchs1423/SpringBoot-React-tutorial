import React, { useState, useEffect } from 'react';
import CartList from './CartList';
import AuthManager from './AuthManager';
import './App.css';

const API_BASE_URL = ''; // 프록시 설정을 위해 비워둠

// ----------------------------------------------------------------------
// 📦 ProductForm 컴포넌트 (상품 등록/관리자 전용)
// ----------------------------------------------------------------------
const ProductForm = ({ onProductCreated, currentToken, currentRole }) => {
    const [formData, setFormData] = useState({
        name: '', price: 0, stockQuantity: 0, description: '',
    });
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // 상품 등록 권한 체크
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
            const response = await fetch(`${API_BASE_URL}/api/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`,
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
                const errorData = await response.json();
                throw new Error(`상품 등록 실패: ${errorData.message || response.status}`);
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
// 🛒 메인 App 컴포넌트
// ----------------------------------------------------------------------
function App() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userToken, setUserToken] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [cartMessage, setCartMessage] = useState(null); // 장바구니 메시지 상태
    const [cartUpdateFlag, setCartUpdateFlag] = useState(0);    // 장바구니 업데이트 플래그

    // 상품 목록을 가져오는 함수
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/products`);
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

    // ⭐️ 장바구니에 상품을 추가하는 함수 ⭐️
    const handleAddToCart = async (productId) => {
        setCartMessage(null);

        if (!userToken) {
            setCartMessage({ type: 'error', text: '❌ 장바구니에 담으려면 로그인이 필요합니다.' });
            // 3초 후 메시지 제거를 위해 return 전에 setTimeout 호출
            setTimeout(() => setCartMessage(null), 3000);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`,
                },
                body: JSON.stringify({ productId: productId, quantity: 1 }),
            });

            if (response.ok) {

                // 204 No Content 인 경우
                if(response.status === 204 || response.headers.get('Content-Length') === '0'){
                    console.log("장바구니 추가 성공 (본문 없음)");

                    setCartUpdateFlag(prev => prev + 1);

                    setCartMessage({
                       type: 'success',
                       text: ` 상품 ID ${productId}를 장바구니에 담았습니다!`
                    });

                    setTimeout(() => setCartMessage(null), 3000);
                    return;
                }

                const result = await response.json();

                setCartMessage({
                    type: 'success',
                    text: `✅ ${data.productName} (ID: ${productId}) 상품을 장바구니에 담았습니다! (총 ${data.quantity}개)`
                });
            } else if (response.status === 401 || response.status === 403) {
                setCartMessage({ type: 'error', text: '❌ 인증 오류: 로그인 상태를 확인해주세요.' });
            } else {
                const errorData = await response.json();
                throw new Error(data.message || `장바구니 추가 실패: ${response.status}`);
            }
        } catch (error) {
            setCartMessage({ type: 'error', text: `❌ 오류 발생: ${error.message}` });
        }

        // 성공/실패와 관계없이 3초 후 메시지 제거
        setTimeout(() => setCartMessage(null), 3000);
    };


    useEffect(() => {
        fetchProducts();
    }, []);

    const handleLoginSuccess = (token, role) => {
        setUserToken(token);
        setUserRole(role);
    };

    const handleLogout = () => {
        setUserToken(null);
        setUserRole(null);
    };

    const handleProductCreated = (newProduct) => {
        setProducts(prev => [...prev, newProduct]);
    };


    // --- 화면 렌더링 ---
    return (
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <h1>🛍️ 쇼핑몰 상품 관리 및 목록</h1>

            {/* 1. 인증 관리 컴포넌트 */}
            <AuthManager
                onLoginSuccess={handleLoginSuccess}
                onLogout={handleLogout}
            />

            {/* 2. 상품 등록 폼 (로그인 & 관리자 권한 시 표시) */}
            <ProductForm
                onProductCreated={handleProductCreated}
                currentToken={userToken}
                currentRole={userRole}
            />

            {/* 3. 상품 목록 영역 */}
            <hr style={{ margin: '30px 0' }}/>

            <h2> 내 장바구니 목록</h2>
            <CartList
                userToken={userToken}
                isLoggedIn={!!userToken}
                cartUpdateFlag={cartUpdateFlag}
            />
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
                        <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>{product.description}</p>

                        {/* ⭐️ 장바구니 추가 버튼 (로그인했을 때만 표시) ⭐️ */}
                        {userToken && (
                            <button onClick={() => handleAddToCart(product.id)}>
                                🛒 장바구니에 담기
                            </button>
                        )}
                        {/* 비로그인 시 표시 */}
                        {!userToken && (
                            <p style={{ fontSize: '0.9em', color: '#999' }}>장바구니는 로그인 후 이용 가능합니다.</p>
                        )}
                    </div>
                ))}
            </div>

            {/* ⭐️ 4. 장바구니 메시지 표시 영역 ⭐️ */}
            {cartMessage && (
                <div style={{
                    marginTop: '20px',
                    padding: '10px',
                    borderRadius: '4px',
                    color: cartMessage.type === 'error' ? 'white' : 'green', // 에러는 흰색 텍스트
                    backgroundColor: cartMessage.type === 'error' ? 'red' : '#e6ffe6', // 에러는 빨간색 배경
                    border: `1px solid ${cartMessage.type === 'error' ? 'red' : 'green'}`
                }}>
                    {cartMessage.text}
                </div>
            )}
        </div>
    );
}

export default App;