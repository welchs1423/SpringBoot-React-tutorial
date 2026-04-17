package com.react.tutorial.Controller;

import com.react.tutorial.dto.LoginRequest;
import com.react.tutorial.dto.RegisterRequest;
import com.react.tutorial.dto.TokenResponse;
import com.react.tutorial.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@RequestBody LoginRequest loginRequest) {
        TokenResponse token = authService.authenticateAndGenerateToken(loginRequest);
        return ResponseEntity.ok(token);
    }

    @PostMapping("/register")
    public ResponseEntity<Void> register(@RequestBody RegisterRequest registerRequest) {
        authService.registerNewUser(registerRequest);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
