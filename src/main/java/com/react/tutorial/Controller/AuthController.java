package com.react.tutorial.Controller;

import com.react.tutorial.dto.LoginRequest;
import com.react.tutorial.dto.TokenResponse;
import com.react.tutorial.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    // TODO: 향후 회원가입 (/api/auth/register) 기능도 추가해야 합니다.
}