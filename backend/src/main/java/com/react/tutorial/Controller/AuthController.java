package com.react.tutorial.Controller;

import com.react.tutorial.dto.LoginRequest;
import com.react.tutorial.dto.RegisterRequest;
import com.react.tutorial.dto.TokenResponse;
import com.react.tutorial.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * POST /api/auth/login
     * 사용자 ID와 비밀번호를 받아 JWT 토큰을 발급합니다.
     */
    @PostMapping("/login")
    public ResponseEntity<TokenResponse> authorize(@RequestBody LoginRequest loginRequest) {
        TokenResponse token = authService.authenticateAndGenerateToken(loginRequest);
        return ResponseEntity.ok(token);
    }

    /**
     * POST /api/auth/register
     * 사용자 ID와 비밀번호를 받아 새로운 계정을 생성합니다.
     * 성공 시 201 Created를 반환합니다.
     */
    @PostMapping("/register")
    public ResponseEntity<Void> register(@RequestBody RegisterRequest registerRequest) {
        // 💡 AuthService에 구현할 회원가입 비즈니스 로직 호출
        authService.registerNewUser(registerRequest);

        // 201 Created 상태 코드와 함께 응답 본문 없이 반환
        return ResponseEntity.created(null).build();
    }
}