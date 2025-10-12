package com.react.tutorial.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class JwtAccessDeniedHandler implements AccessDeniedHandler {

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException) throws IOException {
        // 권한이 없는 경우, 요청 재실행 없이 즉시 403 Forbidden 응답을 설정합니다.
        response.sendError(HttpServletResponse.SC_FORBIDDEN, "Access Denied: You do not have the required role.");
    }
}
