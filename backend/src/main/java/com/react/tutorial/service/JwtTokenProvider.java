package com.react.tutorial.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import com.react.tutorial.entity.User;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long tokenValidityInMilliseconds;

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long expiration) {
        // base64 인코딩된 비밀키 사용 (application.properties의 문자열을 key로 변환)
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.tokenValidityInMilliseconds = expiration * 1000; // 초 -> 밀리초 변환
    }

    // JWT 토큰 생성
    public String createToken(Authentication authentication) {
        String username = ((User) authentication.getPrincipal()).getUsername();
        Date now = new Date();
        Date validity = new Date(now.getTime() + tokenValidityInMilliseconds);

        return Jwts.builder()
                .setSubject(username) // 토큰 주체 (사용자 ID)
                .setIssuedAt(now)      // 발행 시간
                .setExpiration(validity) // 만료 시간
                .signWith(key, SignatureAlgorithm.HS256) // 서명 알고리즘 및 키
                .compact();
    }

    // 토큰 유효성 검증 (나중에 JWT 필터에서 사용)
    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(authToken);
            return true;
        } catch (io.jsonwebtoken.security.SecurityException | MalformedJwtException e) {
            //logger.error("잘못된 JWT 서명입니다 (Secret Key 불일치)", e);
            System.out.println("--- JWT 검증 실패: 잘못된 서명 또는 Secret Key 불일치 ---");
            e.printStackTrace(); // 스택 트레이스를 출력하여 정확한 위치 확인
        } catch (ExpiredJwtException e) {
            //logger.error("만료된 JWT 토큰입니다", e);
            System.out.println("--- JWT 검증 실패: 만료된 토큰 ---");
        } catch (UnsupportedJwtException e) {
            //logger.error("지원되지 않는 JWT 토큰입니다", e);
            System.out.println("--- JWT 검증 실패: 지원되지 않는 토큰 ---");
        } catch (IllegalArgumentException e) {
            //logger.error("JWT 토큰이 잘못되었습니다.", e);
            System.out.println("--- JWT 검증 실패: 토큰이 잘못됨 ---");
        }
        return false;
    }

    // 토큰에서 사용자 이름 (Subject) 추출 (나중에 JWT 필터에서 사용)
    public String getUsernameFromToken(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token)
                .getBody().getSubject();
    }
}