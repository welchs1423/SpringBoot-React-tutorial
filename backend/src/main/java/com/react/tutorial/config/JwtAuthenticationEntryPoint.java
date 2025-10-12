package com.react.tutorial.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {

        // 인증 실패 시 (401 Unauthorized) 응답 설정
        // BadCredentialsException 등 인증 관련 예외가 여기에 도달합니다.

        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized: 인증 정보가 유효하지 않습니다.");

        // 실제 운영 환경에서는 JSON 형태로 에러 메시지를 반환하도록 커스터마이징합니다.
        // 예: response.getWriter().write("{\"message\": \"Invalid credentials\"}");
    }
}