// frontend/src/AuthManager.jsx

import React, { useState, useEffect } from 'react';

const API_BASE_URL = ''; // vite.config.js의 프록시 설정 사용

function AuthManager({ onLoginSuccess, onLogout }) {
    // ⭐️ 사용자 정보 및 토큰 관리 상태 ⭐️
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [token, setToken] = useState('');
    const [userInfo, setUserInfo] = useState(null);

    // 폼 상태
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    // --- 1. 회원가입 로직 ---
    const handleRegister = async () => {
        setMessage('');
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                setMessage(`✅ 회원가입 성공: ${username}. 이제 로그인 해주세요.`);
                setUsername('');
                setPassword('');
            } else {
                const errorData = await response.json();
                setMessage(`❌ 회원가입 실패: ${errorData.message || response.status}`);
            }
        } catch (error) {
            setMessage(`❌ 네트워크 오류: ${error.message}`);
        }
    };

    // --- 2. 로그인 로직 ---
    const handleLogin = async () => {
        setMessage('');
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                setMessage('❌ 로그인 실패: 사용자 이름 또는 비밀번호가 올바르지 않습니다.');
                return;
            }

            const data = await response.json();
            const newToken = data.accessToken;
            const newRole = data.roles ? data.roles[0] : 'ROLE_USER'; // 역할을 가정

            // ⭐️ 토큰, 로그인 상태, 사용자 정보 업데이트 ⭐️
            setToken(newToken);
            setUserInfo({ username, role: newRole });
            setIsLoggedIn(true);
            setMessage(`🎉 로그인 성공! 사용자: ${username} (${newRole})`);

            // App 컴포넌트에 토큰과 역할 전달
            onLoginSuccess(newToken, newRole);

        } catch (error) {
            setMessage(`❌ 네트워크 오류: ${error.message}`);
        }
    };

    // --- 3. 로그아웃 로직 ---
    const handleLogout = () => {
        setToken('');
        setUserInfo(null);
        setIsLoggedIn(false);
        setMessage('👋 로그아웃 되었습니다.');
        onLogout(); // App 컴포넌트에 로그아웃 상태 전달
    };


    // --- 렌더링 ---
    return (
        <div style={{ border: '2px dashed #007bff', padding: '20px', marginBottom: '20px' }}>
            <h2>🔑 사용자 인증 (회원가입 / 로그인)</h2>

            {/* 로그인/로그아웃 상태 표시 */}
            {isLoggedIn ? (
                <div>
                    <p style={{ fontWeight: 'bold', color: 'green' }}>
                        로그인 상태: {userInfo.username} ({userInfo.role})
                    </p>
                    <button onClick={handleLogout}>로그아웃</button>
                </div>
            ) : (
                <div>
                    <div style={{ marginBottom: '10px' }}>
                        <input
                            type="text"
                            placeholder="사용자 ID"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="비밀번호"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button onClick={handleLogin} style={{ marginRight: '10px' }}>로그인</button>
                    <button onClick={handleRegister}>회원가입</button>
                </div>
            )}

            {/* 메시지 영역 */}
            {message && <p style={{ marginTop: '10px', fontSize: '0.9em' }}>{message}</p>}
        </div>

    );
}

export default AuthManager;