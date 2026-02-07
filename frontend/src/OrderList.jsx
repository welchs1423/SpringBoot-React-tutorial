import React, {useState, useEffect} from 'react';

const API_BASE_URL = 'http://localhost:8080';

const OrderList = ({userToken, updateFlag, userRole }) => {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);   // 선택된 주문 상세 정보
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        if(!userToken) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/orders`, {
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type':'application/json'
                }
            });

            if(response.ok){
                const data = await response.json();
                setOrders(data);
            }
        } catch (error) {
            console.error("주문 목록 로드 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    // 특정 주문 상세 정보 가져오기(클릭 시 실행)
    const fetchOrderDetails = async (orderId) => {
        try{
            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                }
            });

            if (!response.ok) {
                // 서버에서 에러 응답(401, 403, 500 등)을 보낸 경우
                const errorData = await response.json();
                throw new Error(errorData.message || '상세 정보를 가져오지 못했습니다.');
            }

            const data = await response.json();
            setSelectedOrder(data); // 데이터 로드 성공 시 상세 팝업 오픈
        } catch (error) {
            console.error("상세 조회 에러:", error);
            alert("네트워크 연결을 확인해주세요. (원인: " + error.message + ")");
        }
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        if(!window.confirm(`주문 상태를 ${newStatus}로 변경하시겠습니까?`)) return;

        try{
            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                },
                body:JSON.stringify({status : newStatus})
            });

            if(response.ok){
                alert("상태가 성공적으로 변경되었습니다.");
                setSelectedOrder(null);
                fetchOrders();
            } else {
                alert("상태 변경에 실패했습니다.");
            }
        } catch (error) {
            console.error("상태 업데이트 에러:",error);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [userToken, updateFlag]);

    if(!userToken){
        return <p> 로그인 후 주문 내역을 확인하세요.</p>;
    }

    return (
        <div style={{ marginTop:'20px', padding:'10px'}}>
            <h3>📦 나의 주문 내역</h3>
            {loading && <p> 불러오는중...</p>}

        {orders.length === 0 && !loading ? (
            <p> 주문한 내역이 없습니다.</p>
        ) : (
            <ul style={{listStyle: 'none', padding: 0 }}>
                {orders.map(order => (
                    <li key={order.id}
                        onClick={() => fetchOrderDetails(order.id)} // 리스트 클릭 시 상세 호출
                        style={listItemStyle}>
                        <div style={{display:'flex',justifyContent:'space-between'}}>
                            <span><strong>주문번호: {order.id}</strong></span>
                            <span style={statusBadgeStyle(order.status)}>{order.status}</span>
                        </div>
                        <div style={{marginTop:'10px',fontSize:'14px',color:'#555'}}>
                            총 결제 금액: <strong>{order.totalPrice.toLocaleString()}원</strong>
                            <br />
                            <small style={{color:'#999'}}> 클릭하여 상세 보기 </small>
                        </div>
                    </li>
                ))}
            </ul>
        )}

        {/* 팝업(모달) 영역: selectedOrder가 있을 때만 렌더링 */}
        {selectedOrder && (
            <div style={modalOverlayStyle} onClick={() => setSelectedOrder(null)}>
                <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                    <h2 style={{ marginTop: 0}}>주문 상세 내역</h2>
                    <hr />
                    <div style={{ textAlign: 'left', marginBottom: '20px'}}>
                        <p><strong>수령인:</strong> {selectedOrder.receiverName}</p>
                        <p><strong>배송지:</strong> {selectedOrder.address}</p>
                        <p><strong>연락처:</strong> {selectedOrder.phoneNumber}</p>
                        <p><strong>결제수단:</strong> {selectedOrder.paymentMethod}</p>
                    </div>

                    <h4 style={{ marginTop: '10px'}}>주문 상품 목록</h4>
                    <div style={{maxHeight:'200px', overflowY:'auto', border:'1px solid #eee',padding:'10px'}}>
                        {selectedOrder.orderItems && selectedOrder.orderItems.map(item => (
                            <div key={item.id} style={{ display:'flex', justifyContent:'space-between',padding:'5px 0',borderBottom: '1px dashed #eee'}}>
                                <span>{item.productName} ({item.quantity}개)</span>
                                <span>{item.orderPrice.toLocaleString()}원</span>
                            </div>
                        ))}
                    </div>

                    <h3 style={{textAlign: 'right', marginTop:'20px'}}>
                        총 합계:{selectedOrder.totalPrice.toLocaleString()}원
                    </h3>

                    {userRole === 'ROLE_ADMIN' && selectedOrder.status === 'ORDERED' && (
                        <button
                            onClick={() => handleUpdateStatus(selectedOrder.id, 'COMPLETED')}
                            style={adminBtnStyle}
                        >
                            배송 완료 처리 (관리자)
                        </button>
                    )}

                    <button onClick={() => setSelectedOrder(null)} style={closeBtnStyle}>닫기</button>
                </div>
            </div>
        )}
    </div>
    );
};

const listItemStyle = {
  border:'1px solid #ddd',
  padding:'15px',
  marginBottom:'10px',
  cursor:'pointer',
  borderRadius:'10px',
  backgroundColor:'#fff',
  transition:'0.2s',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
};

const statusBadgeStyle = (status) => ({
    padding: '4px 8px',
    borderRadius:'4px',
    fontSize:'12px',
    fontWeight:'bold',
    backgroundColor: status === 'ORDERED'?'#e3f2fd':'#f5f5f5',
    color: status === 'ORDERED'?'#1976d2':'#666'
});

const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
};

const modalContentStyle = {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '15px',
    width: '90%',
    maxWidth: '450px',
    // 🌟 추가: 모든 글자색을 진한 회색으로 강제 지정
    color: '#333',
    // 🌟 오타 수정: rgba(0,0,0,0.2) - 마지막 콤마 보정
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    textAlign: 'center'
};

const closeBtnStyle = {
    width: '100%', padding:'12px', marginTop:'20px', backgroundColor:'#444', color:'white',
    border: 'none', borderRadius:'8px', cursor:'pointer', fontSize:'16px'
};

const adminBtnStyle = {
    width: '100%', padding: '12px', marginTop: '10px', backgroundColor:'#28a745', color:'white',
    border: 'none', borderRadius: '8px', cursor:'pointer', fontSize:'16px', fontWeight:'bold'
};

export default OrderList;