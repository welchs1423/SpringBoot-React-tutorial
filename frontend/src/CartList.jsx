// frontend/src/CartList.jsx

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = '';

function CartList({ userToken, isLoggedIn, cartUpdateFlag }) {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError ] = useState(null);

    // 장바구니 목록을 가져오는 함수 (App.jsx의 cartUpdateFlag에 의해 호출됨)
    const fetchCart = useCallback(async () => {
        if(!isLoggedIn || !userToken){
            setCartItems([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try{
            const response = await fetch(`${API_BASE_URL}/api/cart`,{
                method: 'GET',
                headers: {
                        'Authorization' : `Bearer ${userToken}`,
                    },
                });

            if(!response.ok){
                if(response.status === 401 || response.status === 403){
                    throw new Error('인증 오류: 장바구니 정보를 가져올 권한이 없습니다.');
                }
                throw new Error(`장바구니 목록 로드 실패: ${response.status}`);
            }

            const data = await response.json();
            // ⭐️ 수정 사항: 백엔드에서 배열을 바로 반환한다고 가정하고 data를 통째로 사용합니다. ⭐️
            // 이전: setCartItems(data.items);
            setCartItems(data); 
        } catch(err){
            console.error("장바구니 API 호출 중 오류:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    },[userToken, isLoggedIn]);

    // 장바구니 수량 변경 로직
    const handleUpdateQuantity = async (cartItemId, newQuantity) => {
        if(newQuantity < 1) return;

        try{
            const response = await fetch(`${API_BASE_URL}/api/cart/${cartItemId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type' : 'application/json',
                    'Authorization': `Bearer ${userToken}`,
                },
                body: JSON.stringify({quantity: newQuantity}),
            });

            if(!response.ok){
                throw new Error('장바구니 수량 변경 실패');
            }
            // 성공 시 장바구니 목록을 다시 불러와 화면을 업데이트
            fetchCart();
        } catch (err) {
            alert(`수량 변경 중 오류가 발생했습니다: ${err.message}`);
        }
    };

    // 장바구니 아이템 삭제 로직
    const handleRemoveItem = async(cartItemId) => {
        if(!window.confirm('정말로 이 상품을 장바구니에서 삭제하시겠습니까?')){
            return;
        }

        try{
            const response = await fetch(`${API_BASE_URL}/api/cart/${cartItemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                },
            });

            if(!response.ok){
                throw new Error('장바구니 아이템 삭제 실패');
            }

            // 성공 시 장바구니 목록을 다시 불러와 화면을 업데이트
            fetchCart();
        } catch (err) {
            alert(`삭제 중 오류가 발생했습니다: ${err.message}`);
        }
    };

    // 토큰, 로그인 상태, cartUpdateFlag가 변경될 때마다 장바구니를 다시 불러옴
    useEffect(() => {
        fetchCart();
    }, [userToken, isLoggedIn, cartUpdateFlag, fetchCart]);

    // --- 렌더링 ---
    if (!isLoggedIn) {
        return (
            <div style={{
                padding: '15px',
                border: '1px solid #ddd',
                textAlign: 'center',
                backgroundColor: '#f9f9f9',
                color: 'black' // 밝은 배경에 검은색 글자
            }}>
                <p>장바구니 목록을 보려면 로그인해 주세요.</p>
            </div>
        );
    }
    if(loading){
        return <p style={{ color: 'white' }}>장바구니 목록을 불러오는 중입니다...</p>; // 로딩 메시지 색상 지정
    }

    if(error){
        return <p style={{ color : 'red' }}>장바구니 로드 오류: {error}</p>;
    }
    if (!cartItems || cartItems.length === 0) {
        return (
            <div style={{ padding: '15px', border: '1px solid #ddd', textAlign: 'center', color: 'white' }}>
                <p>장바구니가 비어 있습니다. 상품을 담아보세요!</p>
            </div>
        );
    }

    //장바구니 목록 표시
    return (
        <div style={{marginTop: '20px'}}>
           {cartItems.map((item) => (
                <div key={item.cartItemId} style={{
                    border: '1px solid #e0e0e0',
                    padding: '15px',
                    marginBottom: '10px',
                    // ⭐️⭐️ 배경색/글자색 강제 지정으로 글자 안 보이는 문제 해결 ⭐️⭐️
                    backgroundColor: '#fff',
                    color: 'black',
                }}>
                <h4 style={{ color: 'black' }}>{item.productName}</h4>
                <p>가격: {item.price.toLocaleString()} 원</p>
                <p>수량:
                    {/* 수량 조절 버튼 */}
                    <button onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity - 1)} style={{margin: '0 5px'}}>-</button>
                    <strong>{item.quantity}</strong>
                    <button onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity + 1)} style={{margin: '0 5px'}}>+</button>
                    개
                </p>
                <p>총 금액: <strong style={{color: 'black'}}>{(item.price * item.quantity).toLocaleString()}</strong> 원</p>

                {/* 삭제 버튼 */}
                <button
                    onClick={() => handleRemoveItem(item.cartItemId)}
                    style={{ marginTop: '10px', backgroundColor: '#ff5555', color: 'white', border: 'none', padding: '5px 10px'}}
                >
                삭제
                </button>
                </div>
            ))}
        </div>
        );
}
export default CartList;