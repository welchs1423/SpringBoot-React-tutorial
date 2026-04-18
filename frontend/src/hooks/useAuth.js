import { useState, useCallback, useEffect } from 'react';

const SESSION_KEYS = { token: 'token', role: 'role', username: 'username' };

function readSession() {
    return {
        token: sessionStorage.getItem(SESSION_KEYS.token),
        role: sessionStorage.getItem(SESSION_KEYS.role),
        username: sessionStorage.getItem(SESSION_KEYS.username),
    };
}

export function useAuth() {
    const saved = readSession();
    const [token, setToken] = useState(saved.token);
    const [role, setRole] = useState(saved.role);
    const [username, setUsername] = useState(saved.username);

    // OAuth2 콜백 처리: /oauth2/callback?token=...&role=...&username=...
    useEffect(() => {
        if (window.location.pathname !== '/oauth2/callback') return;
        const params = new URLSearchParams(window.location.search);
        const t = params.get('token');
        const r = params.get('role');
        const u = params.get('username');
        if (t) {
            sessionStorage.setItem(SESSION_KEYS.token, t);
            sessionStorage.setItem(SESSION_KEYS.role, r ?? 'ROLE_USER');
            sessionStorage.setItem(SESSION_KEYS.username, u ?? '');
            setToken(t);
            setRole(r ?? 'ROLE_USER');
            setUsername(u ?? '');
            window.history.replaceState({}, document.title, '/');
        }
    }, []);

    const login = useCallback(async (credentials) => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            throw new Error('로그인 실패: ID 또는 비밀번호를 확인해주세요.');
        }

        const data = await response.json();
        if (!data.accessToken) {
            throw new Error('서버에서 토큰을 받지 못했습니다.');
        }

        sessionStorage.setItem(SESSION_KEYS.token, data.accessToken);
        sessionStorage.setItem(SESSION_KEYS.role, data.role);
        sessionStorage.setItem(SESSION_KEYS.username, credentials.username);

        setToken(data.accessToken);
        setRole(data.role);
        setUsername(credentials.username);

        return data;
    }, []);

    const register = useCallback(async (credentials) => {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            const contentType = response.headers.get('content-type') ?? '';
            if (contentType.includes('application/json')) {
                const json = await response.json();
                throw new Error(json.message ?? '회원가입 실패');
            }
            throw new Error('회원가입 실패');
        }
    }, []);

    const logout = useCallback(() => {
        sessionStorage.removeItem(SESSION_KEYS.token);
        sessionStorage.removeItem(SESSION_KEYS.role);
        sessionStorage.removeItem(SESSION_KEYS.username);
        setToken(null);
        setRole(null);
        setUsername(null);
    }, []);

    return { token, role, username, isLoggedIn: !!token, login, register, logout };
}
