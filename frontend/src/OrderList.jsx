import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8080';

const OrderList = ({ userToken, updateFlag, userRole, currentUsername }) => {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reviewText, setReviewText] = useState("");
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [reviewsMap, setReviewsMap] = useState({});

    const fetchOrders = async () => {
        if (!userToken) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/orders`, {
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                setOrders(data);
            }
        } catch (error) {
            console.error("주문 목록 로드 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrderDetails = async (orderId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '상세 정보를 가져오지 못했습니다.');
            }
            const data = await response.json();
            setSelectedOrder(data);
        } catch (error) {
            alert("조회 에러: " + error.message);
        }
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        if (!window.confirm(`주문 상태를 ${newStatus}로 변경하시겠습니까?`)) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) {
                alert("상태가 성공적으로 변경되었습니다.");
                setSelectedOrder(null);
                fetchOrders();
            }
        } catch (error) {
            console.error("상태 업데이트 에러:", error);
        }
    };

    const handleReviewSubmit = async (item) => {

        if(!userToken){
            alert("로그인 세션이 만료되었거나 권한이 없습니다.");
            return;
        }

        const pId = String(item.productId || item.id);

        if(!pId){
            alert("상품 ID 정보가 누락되었습니다. 백엔드 DTO를 확인해주세요!");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/reviews`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productId: pId,
                    content: reviewText,
                    rating: 5
                })
            });
            if (response.ok) {
                alert("리뷰가 등록되었습니다.");
                setReviewText("");
                loadReviews(pId);
            } else if(response.status === 401){
                alert("인증 오류가 발생했습니다.");
            }
        } catch (error) {
            console.error("리뷰 등록 요청 중 에러 :", error)
        }
    };

    const loadReviews = async (pId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/reviews/product/${pId}`, {
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setReviewsMap(prev => ({ ...prev, [String(pId)]: data }));
            }
        } catch (error) {
            console.error("리뷰 로드 실패:", error);
        }
    };

    const handleReviewDelete = async (reviewId, pId) => {
        if(!window.confirm("리뷰를 삭제하시겠습니까?")) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}`,{
                method:'DELETE',
                headers:{'Authorization':`Bearer ${userToken}`}
            });
            if(response.ok){
                alert("삭제되었습니다.");
                loadReviews(pId);   // 목록 새로고침
            }
        } catch (error){
            console.error("삭제 실패:",error);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [userToken, updateFlag]);

    if (!userToken) return <p>로그인 후 이용해주세요.</p>;

    return (
        <div style={{ marginTop: '20px', padding: '10px' }}>
            <h3>📦 나의 주문 내역</h3>
            {loading && <p>불러오는중...</p>}
            {orders.length === 0 && !loading ? (
                <p>주문 내역이 없습니다.</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {orders.map(order => (
                        <li key={order.id} onClick={() => fetchOrderDetails(order.id)} style={listItemStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span><strong>주문번호: {order.id}</strong></span>
                                <span style={statusBadgeStyle(order.status)}>{order.status}</span>
                            </div>
                            <div style={{ marginTop: '10px', fontSize: '14px', color: '#555' }}>
                                총 금액: <strong>{order.totalPrice.toLocaleString()}원</strong>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {selectedOrder && (
                <div style={modalOverlayStyle} onClick={() => setSelectedOrder(null)}>
                    <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                        <h2>주문 상세 내역</h2>
                        <hr />
                        <h4 style={{ marginTop: '10px' }}>주문 상품 목록</h4>
                        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', padding: '10px' }}>
                            {selectedOrder.orderItems && selectedOrder.orderItems.map(item => (
                                <React.Fragment key={item.id}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                                        <span>{item.productName} ({item.quantity}개)</span>
                                        <button
                                            onClick={() => {
                                                const pId = String(item.productId || item);
                                                setSelectedProductId(pId);
                                                loadReviews(pId);
                                            }}
                                            style={reviewOpenBtnStyle}
                                        >
                                            리뷰쓰기
                                        </button>
                                    </div>
                                    {String(selectedProductId) === String(item.productId || item) && (
                                        <div style={{ marginTop: '10px', background: '#f9f9f9', padding: '10px', borderRadius: '5px' }}>
                                            <textarea
                                                value={reviewText}
                                                onChange={(e) => setReviewText(e.target.value)}
                                                placeholder="리뷰를 작성해주세요."
                                                style={{ width: '90%', height: '50px' }}
                                            />
                                            <br />
                                            <button
                                                onClick={() => {
                                                    handleReviewSubmit(item);
                                                }}
                                                style={reviewSubmitBtnStyle}
                                            >
                                                등록
                                            </button>

                                            {/* 리뷰 리스트 영역 */}
                                            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                                                <h5 style={{ fontSize: '14px', marginBottom: '10px' }}>💬 상품평</h5>

                                                {(() => {
                                                    const pId = String(item.productId || item);
                                                    const productReviews = reviewsMap[pId];

                                                    return productReviews && productReviews.length > 0 ? (
                                                        productReviews.map((rev) => (
                                                            <div key={rev.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee', textAlign: 'left' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                    <strong>⭐ {rev.rating || 5}</strong>
                                                                    <span style={{ fontSize: '11px', color: '#888' }}>{rev.username || '익명'}</span>
                                                                </div>
                                                                <p style={{ margin: '5px 0', fontSize: '13px', color: '#333' }}>{rev.content}</p>
                                                                {rev.username === currentUsername && (
                                                                    <button onClick={() => handleReviewDelete(rev.id, pId)} style={deleteBtnStyle}>삭제</button>
                                                                )}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>
                                                            아직 작성된 리뷰가 없습니다.
                                                        </p>
                                                    );
                                                })() }
                                            </div>
                                            <button onClick={() => setSelectedProductId(null)} style={{ ...reviewSubmitBtnStyle, backgroundColor: '#999' }}>취소</button>
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                        <h3 style={{ textAlign: 'right' }}>합계: {selectedOrder.totalPrice.toLocaleString()}원</h3>

                        <div style={{ display:'flex', gap:'10px',marginBottom:'10px'}}>
                            {selectedOrder.status === 'ORDERED' && (
                                <button
                                    onClick={() => handleUpdateStatus(selectedOrder.id, 'CANCELLED')}
                                    style={cancelBtnStyle}
                                >
                                    주문 취소
                                </button>
                            )}

                            {selectedOrder.status === 'DELIVERED' && (
                                <button
                                    onClick={() => handleUpdateStatus(selectedOrder.id, 'RETURN_REQUESTED')}
                                    style={returnBtnStyle}
                                >
                                    반품 신청
                                </button>
                            )}
                        </div>

                        <button onClick={() => setSelectedOrder(null)} style={closeBtnStyle}>닫기</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const listItemStyle = { border: '1px solid #ddd', padding: '15px', marginBottom: '10px', cursor: 'pointer', borderRadius: '10px', backgroundColor: '#fff' };
const statusBadgeStyle = (status) => ({ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', backgroundColor: status === 'ORDERED' ? '#e3f2fd' : '#f5f5f5', color: status === 'ORDERED' ? '#1976d2' : '#666' });
const reviewOpenBtnStyle = { padding: '2px 8px', fontSize: '12px', cursor: 'pointer', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px' };
const reviewSubmitBtnStyle = { padding: '4px 12px', fontSize: '12px', cursor: 'pointer', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', marginRight: '5px' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '450px', color: '#333', textAlign: 'center' };
const closeBtnStyle = { width: '100%', padding: '12px', marginTop: '20px', backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' };
const cancelBtnStyle = {
    flex: 1, padding: '10px', backgroundColor: '#ff4d4f', color: 'white',
    border: 'none', borderRadius:'8px', cursor: 'pointer', fontWeight:'bold'
};
const returnBtnStyle = {
    flex: 1, padding: '10px', backgroundColor: '#faad14', color: 'white',
    border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
};
const deleteBtnStyle = {
    padding: '2px 6px', fontSize : '11px', backgroundColor: '#ff4d4f',
    color: 'white', border: 'none', borderRadius: '4px', cursor :'pointer', marginLeft:'10px'
};

export default OrderList;