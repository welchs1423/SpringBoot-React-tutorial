import React, { useState } from 'react';

/**
 * 인증 상태와 login/register/logout 함수는 App.jsx의 useAuth 인스턴스로부터 props로 전달받는다.
 * 이 컴포넌트는 폼 UI와 유효성 검사만 담당한다.
 */
const AuthManager = ({ isLoggedIn, role, username, onLogin, onRegister, onLogout }) => {
    const [inputUsername, setInputUsername] = useState('');
    const [inputPassword, setInputPassword] = useState('');
    const [inputRole, setInputRole] = useState('ROLE_USER');
    const [message, setMessage] = useState(null);

    const showMessage = (type, text) => setMessage({ type, text });

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage(null);

        if (!inputUsername.trim() || !inputPassword.trim()) {
            showMessage('error', 'ID와 비밀번호를 모두 입력해주세요.');
            return;
        }

        try {
            const data = await onLogin({ username: inputUsername, password: inputPassword });
            showMessage('success', `${data.role} 권한으로 로그인 성공`);
        } catch (err) {
            showMessage('error', err.message);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setMessage(null);

        if (!inputUsername.trim() || !inputPassword.trim()) {
            showMessage('error', '사용자 ID와 비밀번호를 모두 입력해주세요.');
            return;
        }
        if (inputUsername.trim().length < 4) {
            showMessage('error', '사용자 ID는 최소 4자 이상이어야 합니다.');
            return;
        }
        if (inputPassword.trim().length < 6) {
            showMessage('error', '비밀번호는 최소 6자 이상이어야 합니다.');
            return;
        }

        try {
            await onRegister({ username: inputUsername, password: inputPassword, role: inputRole });
            showMessage('success', '회원가입 성공. 로그인해주세요.');
            setInputUsername('');
            setInputPassword('');
        } catch (err) {
            showMessage('error', err.message);
        }
    };

    const handleLogout = () => {
        onLogout();
        showMessage('success', '로그아웃되었습니다.');
    };

    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:8080/oauth2/authorization/google';
    };

    const handleKakaoLogin = () => {
        window.location.href = 'http://localhost:8080/oauth2/authorization/kakao';
    };

    return (
        <div style={{ border: '1px solid #ddd', padding: '20px', marginBottom: '30px' }}>
            {isLoggedIn ? (
                <>
                    <p>현재 사용자: {role} ({username})</p>
                    <button onClick={handleLogout} style={{ padding: '10px', backgroundColor: '#f44336', color: 'white', border: 'none' }}>
                        로그아웃
                    </button>
                </>
            ) : (
                <>
                    <form style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            placeholder="사용자 ID"
                            value={inputUsername}
                            onChange={(e) => setInputUsername(e.target.value)}
                            style={{ padding: '8px' }}
                        />
                        <input
                            type="password"
                            placeholder="비밀번호"
                            value={inputPassword}
                            onChange={(e) => setInputPassword(e.target.value)}
                            style={{ padding: '8px' }}
                        />
                        <select value={inputRole} onChange={(e) => setInputRole(e.target.value)} style={{ padding: '8px' }}>
                            <option value="ROLE_USER">일반 사용자</option>
                            <option value="ROLE_ADMIN">관리자</option>
                        </select>
                        <button onClick={handleLogin} style={{ padding: '8px 15px' }}>로그인</button>
                        <button onClick={handleSignup} style={{ padding: '8px 15px', backgroundColor: '#2196F3', color: 'white', border: 'none' }}>
                            회원가입
                        </button>
                    </form>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button
                            onClick={handleGoogleLogin}
                            style={{ padding: '8px 16px', backgroundColor: '#fff', border: '1px solid #ddd', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" style={{ width: '18px', height: '18px' }} />
                            Google로 로그인
                        </button>
                        <button
                            onClick={handleKakaoLogin}
                            style={{ padding: '8px 16px', backgroundColor: '#FEE500', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <span style={{ fontWeight: 'bold', color: '#3C1E1E' }}>K</span>
                            카카오로 로그인
                        </button>
                    </div>
                </>
            )}

            {message && (
                <p style={{
                    color: message.type === 'error' ? 'red' : 'green',
                    backgroundColor: message.type === 'error' ? '#ffeeee' : '#eeffee',
                    padding: '10px',
                    marginTop: '10px',
                    border: `1px solid ${message.type === 'error' ? 'red' : 'green'}`,
                }}>
                    {message.text}
                </p>
            )}
        </div>
    );
};

export default AuthManager;
