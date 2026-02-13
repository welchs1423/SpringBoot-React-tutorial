import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8080';

const OrderList = ({ userToken, updateFlag, currentUserName }) => {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reviewText, setReviewText] = useState("");
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [reviewsMap, setReviewsMap] = useState({});
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [editReviewText, setEditReviewText] = useState("");

    const fetchOrders = async () => {
        if (!userToken) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/orders`, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            if (response.ok) setOrders(await response.json());
        } catch (error) {
            console.error("주문 목록 로드 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrderDetails = async (orderId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            if (response.ok) setSelectedOrder(await response.json());
        } catch (error) {
            alert("상세 정보 로드 실패");
        }
    };

    const loadReviews = async (pId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/reviews/product/${pId}`, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            if (response.ok) {
                const data = await response.json();
                setReviewsMap(prev => ({ ...prev, [String(pId)]: data }));
            }
        } catch (error) {
            console.error("리뷰 로드 실패:", error);
        }
    };

    const handleReviewSubmit = async (pId) => {
        if (!reviewText.trim()) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/reviews`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ productId: pId, content: reviewText, rating: 5 })
            });
            if (response.ok) {
                setReviewText("");
                loadReviews(pId);
            }
        } catch (error) {
            console.error("리뷰 등록 실패:", error);
        }
    };

    const handleReviewUpdate = async (reviewId, pId) => {
        if (!editReviewText.trim()) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: editReviewText, rating: 5 })
            });
            if (response.ok) {
                setEditingReviewId(null);
                loadReviews(pId);
            }
        } catch (error) {
            console.error("리뷰 수정 실패:", error);
        }
    };

    const handleReviewDelete = async (reviewId, pId, userName) => {
        if (!window.confirm("삭제하시겠습니까?")) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: userName })
            });
            if (response.ok) loadReviews(pId);
        } catch (error) {
            console.error("삭제 실패:", error);
        }
    };

    useEffect(() => { fetchOrders(); }, [userToken, updateFlag]);

    if (!userToken) return <div style={{padding:'20px'}}>로그인이 필요합니다.</div>;

    return (
        <div style={containerStyle}>
            <h3>📦 나의 주문 내역</h3>
            {loading ? <p>로딩 중...</p> : (
                <div style={gridStyle}>
                    {orders.map(order => (
                        <div key={`order-${order.id}`} onClick={() => fetchOrderDetails(order.id)} style={cardStyle}>
                            <div style={cardHeaderStyle}>
                                <strong>주문번호: {order.id}</strong>
                                <span style={statusBadgeStyle(order.status)}>{order.status}</span>
                            </div>
                            <div style={cardBodyStyle}>결제금액: {order.totalPrice.toLocaleString()}원</div>
                        </div>
                    ))}
                </div>
            )}

            {selectedOrder && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h2 style={{margin:'0 0 20px 0'}}>주문 상세</h2>
                        <div style={scrollAreaStyle}>
                            {selectedOrder.orderItems?.map((item, idx) => {
                                const pId = String(item.productId);
                                return (
                                    <div key={`item-${item.id || idx}`} style={itemBoxStyle}>
                                        <div style={itemInfoStyle}>
                                            <span>{item.productName} ({item.quantity}개)</span>
                                            <button onClick={() => {
                                                setSelectedProductId(selectedProductId === pId ? null : pId);
                                                if (selectedProductId !== pId) loadReviews(pId);
                                            }} style={reviewOpenBtnStyle}>리뷰관리</button>
                                        </div>

                                        {selectedProductId === pId && (
                                            <div style={reviewSectionStyle}>
                                                <div style={inputGroupStyle}>
                                                    <input
                                                        value={reviewText}
                                                        onChange={e => setReviewText(e.target.value)}
                                                        placeholder="리뷰를 입력하세요"
                                                        style={inputStyle}
                                                    />
                                                    <button onClick={() => handleReviewSubmit(pId)} style={submitBtnStyle}>등록</button>
                                                </div>
                                                <div style={reviewListStyle}>
                                                    {reviewsMap[pId]?.map((rev, index) => {
                                                        const isEditing = editingReviewId === rev.id;
                                                        const reviewKey = rev.id ? `rev-${rev.id}` : `rev-idx-${pId}-${index}`;

                                                        return (
                                                            <div key={reviewKey} style={reviewItemStyle}>
                                                                {isEditing ? (
                                                                    <div style={{ display: 'flex', gap: '5px', width: '100%' }}>
                                                                        <input
                                                                            value={editReviewText}
                                                                            onChange={e => setEditReviewText(e.target.value)}
                                                                            style={{ ...inputStyle, fontSize: '12px' }}
                                                                        />
                                                                        <button onClick={() => handleReviewUpdate(rev.id, pId)} style={submitBtnStyle}>완료</button>
                                                                        <button onClick={() => setEditingReviewId(null)} style={{ ...delBtnStyle, background: '#666' }}>취소</button>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <span><strong>{rev.username}</strong>: {rev.content}</span>
                                                                        <div style={{ display: 'flex', gap: '3px' }}>
                                                                            {rev.username === currentUserName && (
                                                                                <>
                                                                                    <button onClick={() => {
                                                                                        setEditingReviewId(rev.id);
                                                                                        setEditReviewText(rev.content);
                                                                                    }} style={editBtnStyle}>수정</button>
                                                                                    <button onClick={() => handleReviewDelete(rev.id, pId, currentUserName)} style={delBtnStyle}>삭제</button>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div style={modalFooterStyle}>
                            <strong>총 합계: {selectedOrder.totalPrice.toLocaleString()}원</strong>
                            <button onClick={() => {
                                setSelectedOrder(null);
                                setSelectedProductId(null);
                            }} style={closeBtnStyle}>닫기</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Styles (동일) ---
const containerStyle = { padding: '20px', maxWidth: '800px', margin: '0 auto' };
const gridStyle = { display: 'grid', gap: '15px' };
const cardStyle = { padding: '15px', border: '1px solid #eee', borderRadius: '12px', cursor: 'pointer', background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };
const cardHeaderStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' };
const cardBodyStyle = { color: '#666', fontSize: '14px' };
const statusBadgeStyle = (s) => ({ padding: '3px 8px', borderRadius: '20px', fontSize: '12px', background: s === 'ORDERED' ? '#e3f2fd' : '#f5f5f5', color: s === 'ORDERED' ? '#1976d2' : '#888' });
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle = { background: '#fff', padding: '25px', borderRadius: '20px', width: '90%', color: '#333', maxWidth: '400px' };
const scrollAreaStyle = { maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' };
const itemBoxStyle = { borderBottom: '1px solid #f0f0f0', padding: '15px 0' };
const itemInfoStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const reviewSectionStyle = { marginTop: '10px', padding: '10px', background: '#f9f9f9', borderRadius: '8px' };
const inputGroupStyle = { display: 'flex', gap: '5px', marginBottom: '10px' };
const inputStyle = { flex: 1, padding: '5px', borderRadius: '4px', border: '1px solid #ddd' };
const submitBtnStyle = { padding: '5px 10px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const reviewListStyle = { fontSize: '13px', display: 'grid', gap: '5px' };
const reviewItemStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '5px', borderRadius: '4px', border: '1px solid #eee' };
const delBtnStyle = { background: '#ff4d4f', color: '#fff', border: 'none', padding: '2px 6px', borderRadius: '3px', fontSize: '11px', cursor: 'pointer' };
const editBtnStyle = { background: '#ffc107', color: '#000', border: 'none', padding: '2px 6px', borderRadius: '3px', fontSize: '11px', cursor: 'pointer' };
const modalFooterStyle = { display: 'flex', flexDirection: 'column', gap: '15px', borderTop: '1px solid #eee', paddingTop: '15px' };
const reviewOpenBtnStyle = { padding: '5px 10px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' };
const closeBtnStyle = { padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' };

export default OrderList;