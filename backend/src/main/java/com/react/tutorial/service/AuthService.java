package com.react.tutorial.service;

import com.react.tutorial.dto.LoginRequest;
import com.react.tutorial.dto.RegisterRequest;
import com.react.tutorial.dto.TokenResponse;
import com.react.tutorial.entity.User;
import com.react.tutorial.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManagerBuilder authenticationManagerBuilder;
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            JwtTokenProvider tokenProvider,
            AuthenticationManagerBuilder authenticationManagerBuilder,
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.tokenProvider = tokenProvider;
        this.authenticationManagerBuilder = authenticationManagerBuilder;
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
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
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
        );

        // 3. 인증 정보(Authentication)를 SecurityContext에 저장
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // 4. JWT 토큰 생성 및 반환
        String jwt = tokenProvider.createToken(authentication);

        // application.properties의 jwt.expiration 값
        long expiresIn = 3600L;

        return new TokenResponse(jwt, "Bearer", expiresIn);
    }

    public void registerNewUser(RegisterRequest registerRequest){
        // 1. DTO를 Entity로 변환 (User Entity가 있다고 가정)
        //    이 코드를 실행하기 전에 User.java 파일을 생성해야 합니다.
        User user = User.builder()
                .username(registerRequest.getUsername())
                // 2. 비밀번호 암호화
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                // 3. 권한 설정 (일반 사용자 역할 - 예: ROLE_USER)
                .role("ROLE_USER")
                .build();

        // 4. DB에 저장
        userRepository.save(user);
    }
}