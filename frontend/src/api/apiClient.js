const BASE_URL = '/api';

/**
 * 토큰을 세션스토리지에서 읽어 Authorization 헤더를 자동으로 주입하는 공통 fetch 래퍼.
 * 에러 응답은 항상 Error를 throw해 호출부에서 일관되게 catch할 수 있도록 한다.
 */
async function request(path, options = {}) {
    const token = sessionStorage.getItem('token');
    const headers = { ...options.headers };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        options = { ...options, body: JSON.stringify(options.body) };
    }

    const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

    if (!response.ok) {
        const contentType = response.headers.get('content-type') ?? '';
        let message;
        if (contentType.includes('application/json')) {
            const json = await response.json();
            message = json.message ?? response.statusText;
        } else {
            message = (await response.text()) || response.statusText;
        }
        throw new Error(message);
    }

    const text = await response.text();
    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

export const apiClient = {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: 'POST', body }),
    put: (path, body) => request(path, { method: 'PUT', body }),
    patch: (path, body) => request(path, { method: 'PATCH', body }),
    delete: (path) => request(path, { method: 'DELETE' }),

    /** 파일 업로드 전용 (FormData 사용, Content-Type 헤더 브라우저에 위임) */
    upload: (path, formData) => request(path, { method: 'POST', body: formData }),
};
