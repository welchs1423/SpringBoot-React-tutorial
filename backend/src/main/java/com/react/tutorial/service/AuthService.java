package com.react.tutorial.service;

import com.react.tutorial.dto.LoginRequest;
import com.react.tutorial.dto.RegisterRequest;
import com.react.tutorial.dto.TokenResponse;
import com.react.tutorial.entity.User;
import com.react.tutorial.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
public class AuthService {

    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            JwtTokenProvider jwtTokenProvider,
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * 로그인 요청을 처리하고 JWT 토큰을 발급합니다.
     */
    @Transactional
    public TokenResponse authenticateAndGenerateToken(LoginRequest loginRequest) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String role = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("ROLE_USER");

        String jwtToken = jwtTokenProvider.generateToken(authentication);
        Long expiresIn = 3600L; // 1시간 (3600초)으로 임의 설정. 실제 토큰 만료 시간 로직에 따라 수정 필요.

        return new TokenResponse(jwtToken, "Bearer", expiresIn, role);
    }

    /**
     * 새로운 사용자 계정을 등록합니다.
     */
    public void registerNewUser(RegisterRequest registerRequest){
        
        // 중복 확인 로직
        if(userRepository.findByUsername(registerRequest.getUsername()).isPresent()){
            throw new IllegalArgumentException("이미 존재하는 사용자 이름입니다,");
        }
        
        // 1. DTO를 Entity로 변환 및 비밀번호 암호화
        User user = User.builder()
                .username(registerRequest.getUsername())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .role("ROLE_USER")
                .build();

        // 2. DB에 저장
        userRepository.save(user);
    }
}