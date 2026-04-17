import React, { useState } from 'react';
import StarRating from './StarRating';
import { useOrders } from './hooks/useOrders';

const OrderList = ({ token, updateFlag, currentUserName }) => {
    const {
        orders,
        loading,
        fetchOrderDetail,
        cancelOrder,
        loadReviews,
        submitReview,
        updateReview,
        deleteReview,
    } = useOrders(token, updateFlag);

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [reviewsMap, setReviewsMap] = useState({});
    const [reviewText, setReviewText] = useState('');
    const [reviewRating, setReviewRating] = useState(5);
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [editReviewText, setEditReviewText] = useState('');
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [targetCancelOrderId, setTargetCancelOrderId] = useState(null);
    const [cancelReason, setCancelReason] = useState('');

    const renderStars = (rating) => {
        const n = Math.max(0, Math.min(5, Number(rating) || 0));
        return '★'.repeat(n) + '☆'.repeat(5 - n);
    };

    const handleOpenDetail = async (orderId) => {
        try {
            const detail = await fetchOrderDetail(orderId);
            setSelectedOrder(detail);
        } catch {
            alert('상세 정보 로드 실패');
        }
    };

    const handleToggleReview = async (pId) => {
        if (selectedProductId === pId) {
            setSelectedProductId(null);
            return;
        }
        setSelectedProductId(pId);
        const reviews = await loadReviews(pId);
        setReviewsMap(prev => ({ ...prev, [pId]: reviews ?? [] }));
    };

    const handleReviewSubmit = async (pId) => {
        if (!reviewText.trim()) return;
        await submitReview(pId, reviewText, reviewRating);
        setReviewText('');
        setReviewRating(5);
        const reviews = await loadReviews(pId);
        setReviewsMap(prev => ({ ...prev, [pId]: reviews ?? [] }));
    };

    const handleReviewUpdate = async (reviewId, pId) => {
        if (!editReviewText.trim()) return;
        await updateReview(reviewId, editReviewText, reviewRating);
        setEditingReviewId(null);
        const reviews = await loadReviews(pId);
        setReviewsMap(prev => ({ ...prev, [pId]: reviews ?? [] }));
    };

    const handleReviewDelete = async (reviewId, pId) => {
        if (!window.confirm('삭제하시겠습니까?')) return;
        await deleteReview(reviewId);
        const reviews = await loadReviews(pId);
        setReviewsMap(prev => ({ ...prev, [pId]: reviews ?? [] }));
    };

    const handleCancelSubmit = async () => {
        if (!cancelReason.trim()) {
            alert('주문 취소 사유를 입력해주세요.');
            return;
        }
        if (!window.confirm('정말로 이 주문을 취소하시겠습니까?')) return;
        try {
            await cancelOrder(targetCancelOrderId, cancelReason);
            alert('주문이 취소되었습니다.');
            setCancelModalOpen(false);
            setCancelReason('');
            setSelectedOrder(null);
        } catch (err) {
            alert('취소 실패: ' + err.message);
        }
    };

    if (!token) return <div style={{ padding: '20px' }}>로그인이 필요합니다.</div>;

    return (
        <div style={containerStyle}>
            <h3>나의 주문 내역</h3>
            {loading ? <p>로딩 중...</p> : (
                <div style={gridStyle}>
                    {orders.map(order => (
                        <div key={`order-${order.id}`} onClick={() => handleOpenDetail(order.id)} style={cardStyle}>
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
                        <h2 style={{ margin: '0 0 20px 0' }}>주문 상세</h2>
                        <div style={scrollAreaStyle}>
                            {selectedOrder.orderItems?.map((item, idx) => {
                                const pId = String(item.productId);
                                return (
                                    <div key={`item-${item.id ?? idx}`} style={itemBoxStyle}>
                                        <div style={itemInfoStyle}>
                                            <span>{item.productName} ({item.quantity}개)</span>
                                            <button onClick={() => handleToggleReview(pId)} style={reviewOpenBtnStyle}>
                                                리뷰관리
                                            </button>
                                        </div>

                                        {selectedProductId === pId && (
                                            <div style={reviewSectionStyle}>
                                                <div style={{ marginBottom: '10px' }}>
                                                    <StarRating rating={reviewRating} setRating={setReviewRating} />
                                                </div>
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
                                                        return (
                                                            <div key={rev.id ? `rev-${rev.id}` : `rev-idx-${pId}-${index}`} style={reviewItemStyle}>
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
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                                        <div>
                                                                            <div style={{ color: '#ffc107', fontSize: '14px', marginBottom: '2px' }}>
                                                                                {renderStars(rev.rating)}
                                                                            </div>
                                                                            <span><strong>{rev.username}</strong>: {rev.content}</span>
                                                                        </div>
                                                                        {rev.username === currentUserName && (
                                                                            <div style={{ display: 'flex', gap: '3px' }}>
                                                                                <button onClick={() => { setEditingReviewId(rev.id); setEditReviewText(rev.content); }} style={editBtnStyle}>수정</button>
                                                                                <button onClick={() => handleReviewDelete(rev.id, pId)} style={delBtnStyle}>삭제</button>
                                                                            </div>
                                                                        )}
                                                                    </div>
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
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {selectedOrder.status !== 'CANCELED' && (
                                    <button
                                        onClick={() => { setTargetCancelOrderId(selectedOrder.id); setCancelModalOpen(true); }}
                                        style={{ ...closeBtnStyle, background: '#ff4d4f' }}
                                    >
                                        주문 취소
                                    </button>
                                )}
                                <button onClick={() => { setSelectedOrder(null); setSelectedProductId(null); }} style={closeBtnStyle}>
                                    닫기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {cancelModalOpen && (
                <div style={{ ...modalOverlayStyle, zIndex: 1100 }}>
                    <div style={modalContentStyle}>
                        <h3 style={{ marginTop: 0, color: '#ff4d4f' }}>주문 취소</h3>
                        <p style={{ fontSize: '14px', marginBottom: '10px' }}>취소 사유를 입력해 주세요.</p>
                        <textarea
                            style={{ width: '100%', height: '80px', padding: '10px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc', resize: 'none' }}
                            placeholder="예: 단순 변심, 배송 지연 등"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => setCancelModalOpen(false)} style={{ ...closeBtnStyle, background: '#666' }}>닫기</button>
                            <button onClick={handleCancelSubmit} style={{ ...submitBtnStyle, background: '#ff4d4f' }}>취소 완료</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

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
