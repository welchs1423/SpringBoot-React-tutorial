package com.react.tutorial.config; // ⭐ 실제 패키지 경로로 수정해 주세요.

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import java.io.IOException;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.GenericFilterBean; // ⭐ 반드시 상속받아야 합니다.

@Component // 💡 Spring Bean으로 등록하여 SecurityConfig에서 주입받을 수 있게 합니다.
public class DebugFilter extends GenericFilterBean {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        // ⭐ 1. Security Context에서 Authentication 객체를 가져옵니다.
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // 2. 콘솔에 상태를 출력하여 디버거 없이도 확인할 수 있게 합니다.
        System.out.println("=====================================================");
        System.out.println("DEBUG_FILTER: 현재 Authentication 상태: " + (auth != null ? auth.getClass().getSimpleName() : "NULL"));
        System.out.println("DEBUG_FILTER: 인증 여부 (isAuthenticated): " + (auth != null ? auth.isAuthenticated() : "N/A"));
        System.out.println("=====================================================");

        // 💡 3. 이 'System.out.println' 라인에 브레이크포인트를 설정하세요!

        // 4. 다음 필터로 요청을 전달합니다.
        chain.doFilter(request, response);
    }
}