package com.react.tutorial.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpRequestResponseHolder;
import org.springframework.security.web.context.SecurityContextRepository;

// Context를 저장하거나 로드하지 않는 Repository (Cleanup 비활성화 목적)
public class NullSecurityContextRepository implements SecurityContextRepository {

    // Context를 저장하지 않습니다. (가장 중요한 부분: Context 정리가 일어날 기회를 막음)
    @Override
    public void saveContext(SecurityContext context, HttpServletRequest request, HttpServletResponse response) {
        // STATELESS 환경이므로 Context를 세션에 저장할 필요가 없습니다.
    }

    // Context를 요청에서 로드하지 않습니다. (우리는 JWT 필터에서 수동으로 Context를 설정합니다.)
    @Override
    public SecurityContext loadContext(HttpRequestResponseHolder requestResponseHolder) {
        // 현재 ContextHolder에 있는 Context를 반환합니다.
        return SecurityContextHolder.getContext();
    }

    // 다음 요청에서 Context를 사용할 수 없도록 합니다. (STATELESS 보장)
    @Override
    public boolean containsContext(HttpServletRequest request) {
        return false;
    }
}