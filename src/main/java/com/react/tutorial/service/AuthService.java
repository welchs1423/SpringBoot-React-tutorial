package com.react.tutorial.service;

import com.react.tutorial.dto.LoginRequest;
import com.react.tutorial.dto.TokenResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import com.react.tutorial.service.JwtTokenProvider;

@Service
public class AuthService {

    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManagerBuilder authenticationManagerBuilder;

    public AuthService(JwtTokenProvider tokenProvider, AuthenticationManagerBuilder authenticationManagerBuilder) {
        this.tokenProvider = tokenProvider;
        this.authenticationManagerBuilder = authenticationManagerBuilder;
    }

    /**
     * 로그인 요청을 처리하고 JWT 토큰을 발급합니다.
     */
    public TokenResponse authenticateAndGenerateToken(LoginRequest loginRequest) {
        // 1. 사용자 인증 정보(ID/PW)를 기반으로 AuthenticationToken 생성
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword());

        // 2. AuthenticationManager를 통해 인증 시도 (CustomUserDetailsService를 호출하여 사용자 검증)
        // 비밀번호가 맞지 않으면 내부적으로 BadCredentialsException이 발생합니다.
        Authentication authentication = authenticationManagerBuilder.getObject().authenticate(authenticationToken);

        // 3. 인증 정보(Authentication)를 SecurityContext에 저장
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // 4. JWT 토큰 생성 및 반환
        String jwt = tokenProvider.createToken(authentication);

        // application.properties의 jwt.expiration 값
        long expiresIn = 3600L;

        return new TokenResponse(jwt, "Bearer", expiresIn);
    }
}