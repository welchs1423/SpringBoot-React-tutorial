import React, { useState, useEffect, useCallback, useMemo } from 'react';
import CartList from './CartList';
import OrderList from './OrderList';
import AuthManager from './AuthManager';
import CheckoutTest from './CheckoutTest';
import AdminDashboard from './AdminDashboard';
import { useAuth } from './hooks/useAuth';
import { useProducts } from './hooks/useProducts';
import { apiClient } from './api/apiClient';
import './App.css';

function App() {
    const { token, role, username, isLoggedIn, login, register, logout } = useAuth();
    const { products, loading, error, fetchProducts } = useProducts();
    const [view, setView] = useState('main');
    const [searchTerm, setSearchTerm] = useState('');
    const [cartMessage, setCartMessage] = useState(null);
    const [cartUpdateFlag, setCartUpdateFlag] = useState(0);
    const [reviewPanelId, setReviewPanelId] = useState(null);
    const [reviewsCache, setReviewsCache] = useState({});

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // 토스페이먼츠 결제 완료 리다이렉트 처리
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const paymentKey = params.get('paymentKey');
        const orderId = params.get('orderId');
        const amount = params.get('amount');

        if (!paymentKey || !orderId || !amount) return;

        apiClient.post('/payment/confirm', {
            paymentKey,
            orderId,
            amount: Number(amount),
        })
            .then(() => {
                alert('결제가 최종 승인되었습니다.');
                setCartUpdateFlag(f => f + 1);
                setView('orders');
            })
            .catch((err) => {
                alert('결제 승인 중 오류가 발생했습니다.\n이유: ' + err.message);
            })
            .finally(() => {
                window.history.replaceState({}, document.title, '/');
            });
    }, []);

    const handleLogout = useCallback(() => {
        logout();
        setView('main');
    }, [logout]);

    const handleAddToCart = useCallback(async (productId) => {
        if (!isLoggedIn) {
            setCartMessage({ type: 'error', text: '로그인이 필요합니다.' });
            setTimeout(() => setCartMessage(null), 3000);
            return;
        }
        try {
            await apiClient.post('/cart', { productId, quantity: 1 });
            setCartUpdateFlag(prev => prev + 1);
            setCartMessage({ type: 'success', text: '장바구니에 담겼습니다.' });
        } catch (err) {
            setCartMessage({ type: 'error', text: err.message });
        }
        setTimeout(() => setCartMessage(null), 3000);
    }, [isLoggedIn]);

    const handleToggleReviews = useCallback(async (productId) => {
        const pid = String(productId);
        if (reviewPanelId === pid) {
            setReviewPanelId(null);
            return;
        }
        setReviewPanelId(pid);
        if (!reviewsCache[pid]) {
            try {
                const data = await apiClient.get(`/reviews/product/${productId}`);
                setReviewsCache(prev => ({ ...prev, [pid]: data ?? [] }));
            } catch {
                setReviewsCache(prev => ({ ...prev, [pid]: [] }));
            }
        }
    }, [reviewPanelId, reviewsCache]);

    const filteredProducts = useMemo(
        () => products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
        [products, searchTerm]
    );

    const navBtn = (target, label, isAdmin = false) => (
        <button onClick={() => setView(target)} style={navBtnStyle(view === target, isAdmin)}>
            {label}
        </button>
    );

    return (
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                <h1 style={{ margin: 0 }}>React-Spring Mall</h1>
                <nav style={{ display: 'flex', gap: '10px' }}>
                    {navBtn('main', '홈 (쇼핑)')}
                    {isLoggedIn && navBtn('orders', '내 주문/리뷰')}
                    {isLoggedIn && navBtn('admin', '상품 관리', true)}
                    {navBtn('checkout', '결제 테스트')}
                </nav>
            </div>

            {/* App이 useAuth의 단일 인스턴스를 소유하고 AuthManager에 props로 전달 */}
            <AuthManager
                isLoggedIn={isLoggedIn}
                role={role}
                username={username}
                onLogin={login}
                onRegister={register}
                onLogout={handleLogout}
            />

            {view === 'admin' && (
                <AdminDashboard role={role} onProductChanged={fetchProducts} />
            )}

            {view === 'orders' && (
                <OrderList token={token} updateFlag={cartUpdateFlag} currentUserName={username} />
            )}

            {view === 'checkout' && <CheckoutTest />}

            {view === 'main' && (
                <>
                    <CartList
                        token={token}
                        isLoggedIn={isLoggedIn}
                        onOrderSuccess={() => setCartUpdateFlag(f => f + 1)}
                        cartUpdateFlag={cartUpdateFlag}
                    />

                    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
                        <input
                            type="text"
                            placeholder="상품 이름 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                        />
                    </div>

                    <h3>전체 상품 목록</h3>

                    {loading && <div style={{ textAlign: 'center', padding: '20px' }}>상품을 불러오는 중입니다...</div>}
                    {error && <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>{error}</div>}

                    {!loading && !error && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                            {filteredProducts.map(product => (
                                <div key={`prod-${product.id}`} className="product-card" style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '12px', background: '#fff', color: '#333' }}>
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }}
                                        />
                                    ) : (
                                        <div style={{ width: '100%', height: '200px', backgroundColor: '#eee', borderRadius: '8px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                                            이미지 없음
                                        </div>
                                    )}
                                    <h4>{product.name}</h4>
                                    <p>{product.price.toLocaleString()}원</p>
                                    <p style={{ color: product.stockQuantity > 0 ? 'green' : 'red' }}>
                                        {product.stockQuantity > 0 ? `재고: ${product.stockQuantity}` : '품절'}
                                    </p>
                                    <button
                                        disabled={product.stockQuantity <= 0}
                                        onClick={() => handleAddToCart(product.id)}
                                        style={{ width: '100%', padding: '10px', backgroundColor: product.stockQuantity > 0 ? '#007bff' : '#ccc', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                    >
                                        {product.stockQuantity > 0 ? '담기' : '품절된 상품'}
                                    </button>
                                    <button
                                        onClick={() => handleToggleReviews(product.id)}
                                        style={{ width: '100%', marginTop: '8px', padding: '8px', backgroundColor: '#f8f9fa', color: '#495057', border: '1px solid #dee2e6', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                                    >
                                        {reviewPanelId === String(product.id) ? '리뷰 닫기' : '리뷰 보기'}
                                    </button>
                                    {reviewPanelId === String(product.id) && (() => {
                                        const revs = reviewsCache[String(product.id)] ?? [];
                                        const avg = revs.length > 0
                                            ? (revs.reduce((s, r) => s + r.rating, 0) / revs.length).toFixed(1)
                                            : null;
                                        return (
                                            <div style={{ marginTop: '10px', padding: '10px', background: '#f9f9f9', borderRadius: '8px', fontSize: '13px' }}>
                                                <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#ffc107' }}>
                                                    {avg ? `평균 별점: ${'★'.repeat(Math.round(avg))}${'☆'.repeat(5 - Math.round(avg))} (${avg})` : '리뷰 없음'}
                                                    {revs.length > 0 && <span style={{ color: '#666', fontWeight: 'normal', marginLeft: '6px' }}>({revs.length}개)</span>}
                                                </div>
                                                <div style={{ display: 'grid', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                                                    {revs.map((rev, i) => (
                                                        <div key={rev.id ?? i} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '6px', padding: '8px' }}>
                                                            <div style={{ color: '#ffc107', fontSize: '12px' }}>{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</div>
                                                            <div><strong style={{ fontSize: '12px' }}>{rev.username}</strong><span style={{ marginLeft: '6px', color: '#333' }}>{rev.content}</span></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {cartMessage && (
                <div style={{ position: 'fixed', bottom: '20px', right: '20px', padding: '15px 25px', backgroundColor: cartMessage.type === 'error' ? '#ff4d4d' : '#28a745', color: '#fff', borderRadius: '8px', zIndex: 9999 }}>
                    {cartMessage.text}
                </div>
            )}
        </div>
    );
}

const navBtnStyle = (isActive, isAdmin = false) => ({
    padding: '8px 16px',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: 'bold',
    background: isActive ? (isAdmin ? '#dc3545' : '#007bff') : '#e9ecef',
    color: isActive ? '#fff' : '#495057',
    transition: 'all 0.2s',
});

export default App;
