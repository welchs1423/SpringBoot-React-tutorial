import React, { useState, useEffect, useCallback } from 'react';

// API 기본 URL과 JWT 토큰을 가져오는 함수는 외부에 정의되어 있다고 가정합니다.
const API_BASE_URL = 'http://localhost:8080';

// ⭐️ getToken 함수는 로그인 상태에서 JWT 토큰을 반환한다고 가정합니다. ⭐️
const getToken = () => localStorage.getItem('token');

const CartList = (props) => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalPrice, setTotalPrice] = useState(0);

    const [orderInfo, setOrderInfo] = useState({
        receiverName: '',
        address: '',
        phoneNumber: '',
        memo: '',
        paymentMethod: 'CARD', // 기본값
        // deliveryAddressSeq는 신규 주소이므로 따로 관리하지 않음 (payload에서 null 처리)
    });

    // 입력 필드 변경 핸들러
    const handleOrderInfoChange = (e) =>{
        const {name, value} = e.target;
        setOrderInfo(prevInfo => ({
            ...prevInfo,
            [name]: value
        }));
    };

    // 장바구니 목록을 불러오는 함수
    const fetchCart = async () => {
        setLoading(true);
        const token = getToken();
        if(!token){
            //alert('로그인이 필요합니다.');
            setCartItems([]);
            setTotalPrice(0);
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/cart`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if(response.ok){
                const data = await response.json();
                setCartItems(data);
                // 총 가격 계산
                const total = data.reduce((sum, item) => sum + (item.productPrice * item.quantity), 0);
                setTotalPrice(total);
            } else {
                setCartItems([]);
                setTotalPrice(0);
                // 장바구니가 비어있는 경우일 수 있음
                // console.error("장바구니 로드 실패:", await response.text());
            }
        } catch (error) {
            console.error('Network error:', error);
            alert('장바구니 목록을 불러오는 데 실패했습니다,');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, [props.isLoggedIn]);

    // 수량 변경 처리 함수
    const handleUpdateQuantity = async (itemId, newQuantity) => {
        const token = getToken();
        if (newQuantity < 1) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/cart/${itemId}`,{
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ quantity: newQuantity })
            });

            if(response.ok){
                fetchCart();    // 성공하면 목록 새로고침
            } else {
                alert('수량 변경에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error updating quantity:', error);
        }
    };

    // 상품 제거 처리 함수
    const handleRemoveItem = async (itemId) => {
        const token = getToken();
        if(!window.confirm('장바구니에서 상품을 삭제하시겠습니까?')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/cart/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if(response.ok){
                alert('상품이 장바구니에서 삭제되었습니다.');
                fetchCart();    // 성공하면 목록 새로고침
            } else {
                alert('상품 삭제에 실패했습니다.');
            }
        } catch (error){
            console.error('Error removing item:', error);
        }
    };

    const handlePlaceOrder = async () => {
        if (!orderInfo.receiverName || !orderInfo.address || !orderInfo.phoneNumber) {
            alert('수령인 이동, 주소, 연락처는 필수 입력 항목입니다.');
            return;
        }

        const token = getToken();
        if(!token){
            alert('로그인이 필요합니다.');
            return;
        }

        // 백엔드 OrderRequest DTO 구조에 맞게 데이터 준비
        const orderPayload = {
            // 신규 주소 입력 방식이므로 SEQ는 null로 전송
            deliveryAddressSeq: null,
            ...orderInfo
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderPayload),
            });

            if(response.ok){
                // 주문 성공
                alert('주문이 성공적으로 완료되었습니다! 장바구니가 비워집니다.');

                // 프론트엔드 상태 업데이트 (장바구니 비우기)
                fetchCart();
            } else if(response.status === 409){
                // 409 Conflict: 재고부족, 비즈니스 로직 오류
                const errorText = await response.text();
                alert(`주문 실패 (재고 부족 등): ${errorText}`);
            } else {
                // 기타 오류
                alert('주문 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
                console.error('Order API error:', await response.text());
            }
        } catch (error) {
            console.error('Network Error:', error);
            alert('네트워크 오류로 주문에 실패했습니다.');
        }
    };

    if(loading) return <div>로딩 중...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto'}}>
            <h1>장바구니</h1>

            {cartItems.length === 0 ? (
                <p>장바구니에 담긴 상품이 없습니다.</p>
            ) : (
                <>
                {/* 장바구니 목록 렌더링 */}
                <ul style={{listStyle: 'none', padding: 0}}>
                    {cartItems.map(item => (
                        <li key={item.id} style={{
                            border: '1px solid #eee',
                            padding: '15px',
                            marginBottom: '10px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems:'center'
                        }}>
                            <div>
                                <h3 style={{ margin : 0}}>{item.productPrice}</h3>
                                <p style={{margin:'5px 0'}}> 가격: {item.productPrice.toLocaleString()}원 </p>
                                <p style={{margin:'5px 0'}}>
                                    수량:
                                    <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} style ={{margin: '0 5px'}}>-</button>
                                    {item.quantity}
                                    <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} style ={{margin: '0 5px'}}>+</button>
                                </p>
                            </div>
                            <div style={{textAlign:'right'}}>
                                <p style={{fontWeight:'bold'}}>합계:{(item.productPrice * item.quantity).toLocaleString()}원</p>
                                <button onClick={() => handleRemoveItem(item.id)} style={{padding: '5px 10px', backgroundColor: 'red', color: 'white', border:'none', cursor:'pointer'}}>삭제</button>
                            </div>
                        </li>
                    ))}
                </ul>

                {/* [추가] 주문 정보 입력 폼 섹션 */}
                <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px'}}>
                    <h2>배송 및 결제 정보</h2>

                    {/* 수령인 이름 */}
                    <div style={{ marginBottom: '10px' }}>
                        <label>수령인 이름:</label>
                        <input
                            type="text"
                            name="receiverName"
                            value={orderInfo.receiverName}
                            onChange={handleOrderInfoChange}
                            style={{width:'100%', padding:'8px', boxSizing: 'border-box'}}
                        />
                    </div>

                    {/* 배송지 주소 */}
                    <div style={{marginBottom: '10px'}}>
                        <label>배송지 주소:</label>
                        <input
                            type="text"
                            name="address"
                            value={orderInfo.address}
                            onChange={handleOrderInfoChange}
                            style={{width: '100%',padding:'8px','boxSizing':'border-box'}}
                        />
                    </div>

                    {/* 연락처 */}
                    <div style={{ marginBottom:'10px'}}>
                        <label>연락처:</label>
                        <input
                            type="text"
                            name="phoneNumber"
                            value={orderInfo.phoneNumber}
                            onChange={handleOrderInfoChange}
                            style={{width:'100%',padding:'8px',boxSizing:'border-box'}}
                        />
                    </div>

                    {/* 결제 수단 */}
                    <div style={{marginBottom: '10px'}}>
                        <label>결제 수단:</label>
                        <select
                            name="paymentMethod"
                            value={orderInfo.paymentMethod}
                            onChange={handleOrderInfoChange}
                            style={{width:'100%',padding:'8px',boxSizing:'border-box'}}
                        >
                            <option value="CARD">신용카드</option>
                            <option value="BANK_TRANSFER">계좌이체</option>
                            <option value="CASH">무통장입금</option>
                        </select>
                    </div>

                    {/* 요청사항 */}
                    <div style={{marginBottom: '20px'}}>
                        <label>배송 요청사항(선택):</label>
                        <input
                            type="text"
                            name="memo"
                            value={orderInfo.memo}
                            onChange={handleOrderInfoChange}
                            style={{width:'100%',padding:'8px',boxSizing:'border-box'}}
                        />
                    </div>

                    {/* 총 가격 표시 및 주문하기 버튼 */}
                    <div style={{borderTop:'2px solid #ccc',paddingTop: '10px', textAlign:'right'}}>
                        <h2 style={{margin:'0 0 10px 0'}}>총 결제 금액: {totalPrice.toLocaleString()}원</h2>
                        <button
                            onClick={handlePlaceOrder}
                            //장바구니가 비어있으면 버튼 비활성화
                            disabled={cartItems.length === 0}
                            style={{ width: '100%', padding: '15px', backgroundColor: 'green', color:'white', border: 'none', cursor:'pointer', fontSize:'18px', fontWeight:'bold'}}
                        >
                            주문하기
                        </button>
                    </div>
                </div>
            </>
        )}
    </div>
    );
};

export default CartList;