import React, { useState } from 'react';
import { useCart } from './hooks/useCart';

const CartList = ({ token, cartUpdateFlag, onOrderSuccess }) => {
    const { cartItems, loading, totalPrice, updateQuantity, removeItem, placeOrder } = useCart(token, cartUpdateFlag);
    const [orderInfo, setOrderInfo] = useState({
        receiverName: '',
        address: '',
        phoneNumber: '',
        memo: '',
        paymentMethod: 'CARD',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setOrderInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleRemoveItem = async (itemId) => {
        if (!window.confirm('장바구니에서 상품을 삭제하시겠습니까?')) return;
        try {
            await removeItem(itemId);
        } catch (err) {
            alert('삭제 실패: ' + err.message);
        }
    };

    const handleUpdateQuantity = async (itemId, newQuantity) => {
        try {
            await updateQuantity(itemId, newQuantity);
        } catch (err) {
            alert('수량 변경 실패: ' + err.message);
        }
    };

    const handlePlaceOrder = async () => {
        if (!orderInfo.receiverName || !orderInfo.address || !orderInfo.phoneNumber) {
            alert('수령인 이름, 주소, 연락처는 필수 입력 항목입니다.');
            return;
        }
        try {
            await placeOrder(orderInfo);
            alert('주문이 완료되었습니다. 장바구니가 비워집니다.');
            onOrderSuccess?.();
        } catch (err) {
            alert('주문 실패: ' + err.message);
        }
    };

    if (loading) return <div>로딩 중...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>장바구니</h1>

            {cartItems.length === 0 ? (
                <p>장바구니에 담긴 상품이 없습니다.</p>
            ) : (
                <>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {cartItems.map(item => (
                            <li key={item.id} style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0 }}>{item.productName}</h3>
                                    <p style={{ margin: '5px 0' }}>가격: {item.productPrice.toLocaleString()}원</p>
                                    <p style={{ margin: '5px 0' }}>
                                        수량:
                                        <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} style={{ margin: '0 5px' }}>-</button>
                                        {item.quantity}
                                        <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} style={{ margin: '0 5px' }}>+</button>
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontWeight: 'bold' }}>합계: {(item.productPrice * item.quantity).toLocaleString()}원</p>
                                    <button onClick={() => handleRemoveItem(item.id)} style={{ padding: '5px 10px', backgroundColor: 'red', color: 'white', border: 'none', cursor: 'pointer' }}>
                                        삭제
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
                        <h2>배송 및 결제 정보</h2>

                        {[
                            { label: '수령인 이름', name: 'receiverName', type: 'text' },
                            { label: '배송지 주소', name: 'address', type: 'text' },
                            { label: '연락처', name: 'phoneNumber', type: 'text' },
                            { label: '배송 요청사항(선택)', name: 'memo', type: 'text' },
                        ].map(({ label, name, type }) => (
                            <div key={name} style={{ marginBottom: '10px' }}>
                                <label>{label}:</label>
                                <input
                                    type={type}
                                    name={name}
                                    value={orderInfo[name]}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                                />
                            </div>
                        ))}

                        <div style={{ marginBottom: '10px' }}>
                            <label>결제 수단:</label>
                            <select name="paymentMethod" value={orderInfo.paymentMethod} onChange={handleChange} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}>
                                <option value="CARD">신용카드</option>
                                <option value="BANK_TRANSFER">계좌이체</option>
                                <option value="CASH">무통장입금</option>
                            </select>
                        </div>

                        <div style={{ borderTop: '2px solid #ccc', paddingTop: '10px', textAlign: 'right' }}>
                            <h2 style={{ margin: '0 0 10px 0' }}>총 결제 금액: {totalPrice.toLocaleString()}원</h2>
                            <button
                                onClick={handlePlaceOrder}
                                disabled={cartItems.length === 0}
                                style={{ width: '100%', padding: '15px', backgroundColor: 'green', color: 'white', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
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
