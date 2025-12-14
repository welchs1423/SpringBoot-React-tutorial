import React, { useState } from 'react';

const API_BASE_URL = 'http://localhost:8080'; // vite.config.js의 프록시 설정 사용

const AuthManager = ({ onLoginSuccess, onLogout}) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('ROLE_USER');  // 회원가입 시 기본 권한
    const [message, setMessage] = useState(null);   // 메세지 표시 상태 (성공/오류)

    // 로그인 처리
    const handleLogin = async(e) => {
        e.preventDefault();
        setMessage(null);

        if(!username.trim() || !password.trim()){
            setMessage({ type: 'error', text: 'ID와 비밀번호를 모두 입력해주세요.'});
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method:'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({username, password}),
            });

            if(response.ok){
                const data = await response.json();

                // 토큰과 역할 정보를 로컬저장소에 저장
                localStorage.setItem('token', data.token);
                localStorage.setItem('role',data.role);

                onLoginSuccess(data.token, data.role);
                setMessage({type:'success', text:`✅ ${data.role} 권한으로 로그인 성공!`});
            } else {
                setMessage({type:'error', text:'로그인 실패: ID 또는 비밀번호를 확인해주세요'})
            }
        }catch(error){
            setMessage({type:'error', text:'네트워크 오류로 로그인에 실패했습니다.'});
        }
    };

        // 회원가입 처리 (유호성 검사 로직 추가됨)
        const handleSignup = async (e) => {
            e.preventDefault();
            setMessage(null);

        // -------------------------------------------------
        // 유효성 검사 로직
        // -------------------------------------------------
        if(!username.trim() || !password.trim()){
            setMessage({ type: 'error', text:'사용자 ID와 비밀번호를 모두 입력해주세요.'});
            return;
        }

        if(username.trim().length < 4){
            setMessage({ type: 'error', text:'사용자 ID는 최소 4자 이상이어야 합니다.'});
            return;
        }

        if(password.trim().length < 6){
            setMessage({ type: 'error', text:'비밀번호는 최소 6자 이상이어야 합니다.'});
            return;
        }
        // -------------------------------------------------

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({ username, password, role}),
            });

            let data = {};
            const contentType = response.headers.get("content-type");
            if(contentType && contentType.indexOf("application/json") !== -1 && response.status !== 204){
                try{
                    data = await response.json();
                } catch (parseError){
                    console.warn("JSON 파싱 실패 (오류 응답이 텍스트일 수 있음.);",parseError);
                }
            }

            if(response.ok){
                setMessage({ type: 'success', text:'회원가입 성공! 이제 로그인해주세요.'});
                setUsername('');
                setPassword('');
            } else {
                const errorMessage = data.message || response.statusText || '서버 오류로 가입에 실패했습니다.';
                setMessage({ type: 'error', text: `가입 실패: ${errorMessage}`});
            }
        } catch (error) {
            console.error("회원가입 처리 중 네트워크 오류 발생:", error);
            setMessage({type: 'error', text:'네트워크 연결에 문제가 발생했습니다. 서버 상태를 확인하세요.'});
        }
    };

    // 로그아웃 처리
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        onLogout();
        setMessage({ type: 'success', text: '로그아웃되었습니다.'});
    };

    const currentToken = localStorage.getItem('token');
    const currentRole = localStorage.getItem('role');

    return (
        <div style={{ border: '1px solid #ddd', padding: '20px', marginBottom: '30px'}}>
            {currentToken ? (
                // 로그인된 상태
                <>
                    <p> 현재 사용자: **{currentRole} ({username || '로그인 됨'})</p>
                    <button onClick={handleLogout} style={{ padding: '10px', backgroundColor: '#f44336', color: 'white', border: 'none'}}>
                        로그아웃
                    </button>
                </>
            ) : (
                // 로그아웃된 상태 (로그인/회원가입 폼)
                <form style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="사용자 ID"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{padding:'8px'}}
                    />
                    <input
                        type="password"
                        placeholder="비밀번호"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ padding: '8px'}}
                    />

                    {/* 관리자 테스트를 위한 역할 선택 (개발/테스트 용도) */}
                    <select value={role} onChange={(e) => setRole(e.target.value)} style={{padding:'8px'}}>
                        <option value="ROLE_USER">일반 사용자</option>
                        <option value="ROLE_ADMIN">관리자</option>
                    </select>

                    <button onClick={handleLogin} style={{padding:'8px 15px'}}>
                        로그인
                    </button>
                    <button onClick={handleSignup} style={{padding:'8px 15px', backgroundColor:'#2196F3', color:'white'}}>
                        회원가입
                    </button>
                </form>
            )}

            {/* 메시지 표시 영역 */}
            {message && (
                <p style={{
                    color: message.type === 'error' ? 'red' : 'green',
                    backgroundColor:message.type === 'error' ? '#ffeeee' : '#eeffee',
                    padding: '10px',
                    marginTop: '10px',
                    border: `1px solid ${message.type === 'error'? 'red': 'green'}`
                }}>
                    {message.text}
                </p>
            )}
        </div>
    );
};

export default AuthManager;