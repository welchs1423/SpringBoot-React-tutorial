import React, { useState, useEffect } from 'react';
import { useCart } from './hooks/useCart';
import { apiClient } from './api/apiClient';

const CartList = ({ token, cartUpdateFlag, onOrderSuccess }) => {
    const { cartItems, loading, totalPrice, updateQuantity, removeItem, placeOrder } = useCart(token, cartUpdateFlag);
    const [orderInfo, setOrderInfo] = useState({
        receiverName: '',
        address: '',
        phoneNumber: '',
        memo: '',
        paymentMethod: 'CARD',
        couponId: null,
        pointsToUse: 0,
    });
    const [coupons, setCoupons] = useState([]);
    const [userPoints, setUserPoints] = useState(0);

    useEffect(() => {
        if (!token) return;
        apiClient.get('/coupons/my').then(setCoupons).catch(() => setCoupons([]));
        apiClient.get('/user/profile').then(d => setUserPoints(d?.points ?? 0)).catch(() => {});
    }, [token, cartUpdateFlag]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setOrderInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleCouponChange = (e) => {
        const val = e.target.value;
        setOrderInfo(prev => ({ ...prev, couponId: val ? Number(val) : null }));
    };

    const handlePointsChange = (e) => {
        const val = Math.max(0, Math.min(Number(e.target.value), userPoints));
        setOrderInfo(prev => ({ ...prev, pointsToUse: val }));
    };

    const selectedCoupon = coupons.find(c => c.userCouponId === orderInfo.couponId);
    const couponDiscount = selectedCoupon
        ? selectedCoupon.type === 'FIXED'
            ? Math.min(selectedCoupon.discountValue, totalPrice)
            : Math.floor(totalPrice * selectedCoupon.discountValue / 100)
        : 0;
    const maxPoints = Math.min(userPoints, Math.max(0, totalPrice - couponDiscount));
    const pointsToUse = Math.min(orderInfo.pointsToUse, maxPoints);
    const finalAmount = Math.max(0, totalPrice - couponDiscount - pointsToUse);

    const handleRemoveItem = async (itemId) => {
        if (!window.confirm('장바구니에서 상품을 삭제하시겠습니까?')) return;
        try { await removeItem(itemId); } catch (err) { alert('삭제 실패: ' + err.message); }
    };

    const handleUpdateQuantity = async (itemId, newQuantity) => {
        try { await updateQuantity(itemId, newQuantity); } catch (err) { alert('수량 변경 실패: ' + err.message); }
    };

    const handlePlaceOrder = async () => {
        if (!orderInfo.receiverName || !orderInfo.address || !orderInfo.phoneNumber) {
            alert('수령인 이름, 주소, 연락처는 필수 입력 항목입니다.');
            return;
        }
        try {
            await placeOrder({ ...orderInfo, pointsToUse });
            alert('주문이 완료되었습니다. 장바구니가 비워집니다.');
            setOrderInfo(prev => ({ ...prev, couponId: null, pointsToUse: 0 }));
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
                                <input type={type} name={name} value={orderInfo[name]} onChange={handleChange}
                                    style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
                            </div>
                        ))}

                        <div style={{ marginBottom: '10px' }}>
                            <label>결제 수단:</label>
                            <select name="paymentMethod" value={orderInfo.paymentMethod} onChange={handleChange}
                                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}>
                                <option value="CARD">신용카드</option>
                                <option value="BANK_TRANSFER">계좌이체</option>
                                <option value="CASH">무통장입금</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '10px', padding: '12px', background: '#f0f7ff', borderRadius: '6px' }}>
                            <label style={{ fontWeight: 'bold' }}>쿠폰 선택:</label>
                            <select value={orderInfo.couponId ?? ''} onChange={handleCouponChange}
                                style={{ width: '100%', padding: '8px', boxSizing: 'border-box', marginTop: '6px' }}>
                                <option value="">쿠폰 사용 안 함</option>
                                {coupons.map(c => (
                                    <option key={c.userCouponId} value={c.userCouponId}>
                                        {c.name} ({c.type === 'FIXED'
                                            ? `${c.discountValue.toLocaleString()}원 할인`
                                            : `${c.discountValue}% 할인`}
                                        {c.minOrderAmount > 0 ? ` | ${c.minOrderAmount.toLocaleString()}원 이상` : ''})
                                    </option>
                                ))}
                            </select>
                            {coupons.length === 0 && (
                                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#999' }}>보유한 쿠폰이 없습니다.</p>
                            )}
                        </div>

                        <div style={{ marginBottom: '10px', padding: '12px', background: '#f0fff4', borderRadius: '6px' }}>
                            <label style={{ fontWeight: 'bold' }}>포인트 사용:</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                <input type="number" min="0" max={maxPoints} value={orderInfo.pointsToUse}
                                    onChange={handlePointsChange}
                                    style={{ flex: 1, padding: '8px', boxSizing: 'border-box' }} />
                                <span style={{ fontSize: '13px', color: '#555' }}>보유: {userPoints.toLocaleString()}P</span>
                                <button type="button" onClick={() => setOrderInfo(prev => ({ ...prev, pointsToUse: maxPoints }))}
                                    style={{ padding: '6px 10px', fontSize: '12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                    전액사용
                                </button>
                            </div>
                        </div>

                        <div style={{ borderTop: '2px solid #ccc', paddingTop: '10px' }}>
                            <div style={{ textAlign: 'right', fontSize: '14px', color: '#555', marginBottom: '4px' }}>
                                상품 금액: {totalPrice.toLocaleString()}원
                            </div>
                            {couponDiscount > 0 && (
                                <div style={{ textAlign: 'right', fontSize: '14px', color: '#e53935', marginBottom: '4px' }}>
                                    쿠폰 할인: -{couponDiscount.toLocaleString()}원
                                </div>
                            )}
                            {pointsToUse > 0 && (
                                <div style={{ textAlign: 'right', fontSize: '14px', color: '#1565c0', marginBottom: '4px' }}>
                                    포인트 차감: -{pointsToUse.toLocaleString()}P
                                </div>
                            )}
                            <h2 style={{ margin: '8px 0 10px', textAlign: 'right' }}>
                                최종 결제 금액: {finalAmount.toLocaleString()}원
                            </h2>
                            <button onClick={handlePlaceOrder} disabled={cartItems.length === 0}
                                style={{ width: '100%', padding: '15px', backgroundColor: 'green', color: 'white', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}>
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
