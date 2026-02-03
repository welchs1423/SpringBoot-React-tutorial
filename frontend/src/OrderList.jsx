import React, {useState, useEffect} from 'react';

const API_BASE_URL = '';
const getToken = () => localStorage.getItem('token');

const OrderList = ({userToken, updateFlag }) => {

    console.log("OrderList 컴포넌트 렌더링 됨! 토큰 값:", userToken);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        if(!userToken){
            console.log("토큰이 없어서 중단됨");
            setOrders([]);
            setLoading(false);
            return;
        }
        try {
            console.log("데이터 가지러 감...");
            const response = await fetch(`${API_BASE_URL}/api/orders`, {
                headers: {
                    'Authorization': `Bearer ${userToken}`
                }
            });

            const data = await response.json();
            console.log("서버에서 받은 데이터:", data);
            if(response.ok){
                setOrders(data);
            }
        } catch (error) {
            console.error("에러 발생:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log("useEffect 실행 시도 중...");
        fetchOrders();
    }, [userToken, updateFlag]);

    if(loading){
        return <div style ={{ padding: '20px', textAlign:'center'}}>주문 내역 로딩 중...</div>;
    }
    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto'}}>
            <h1>나의 주문 내역</h1>
        {orders.length === 0 ? (
            <p> 주문한 내역이 없습니다.</p>
        ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap:'20px'}}>
                {orders.map(order => (
                    /* 하나의 주문 카드 시작 */
                    <div key={order.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom:'10px', borderBottom:'1px solid #eee', paddingBottom: '10px'}}>
                            <span><strong>주문일:</strong> {new Date(order.orderDate).toLocaleString()}</span>
                            <span style ={{ color: 'green', fontWeight:'bold' }}>{order.status}</span>
                        </div>

                    <ul style= {{ listStyle: 'none', padding: 0 }}>
                        {order.orderItems.map((item, index) => (
                            <li key={index} style={{ marginBottom: '5px'}}>
                                {item.productName} - {item.quantity}개 ({item.orderPrice.toLocaleString()}원)
                            </li>
                        ))}
                    </ul>

                    <div style={{ textAlign: 'right', marginTop: '10px', borderTop:'1px dotted #eee'}}>
                        <span style={{ fontSize: '1.2rem', fontWeight:'bold'}}>
                            총 결제 금액: {order.totalPrice.toLocaleString()}원
                        </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color:'#666',marginTop: '5px'}}>
                        배송지: {order.address} ({order.receiverName})
                    </div>
                </div>
            ))}
        </div>
    )}
</div>

    );
};

export default OrderList;