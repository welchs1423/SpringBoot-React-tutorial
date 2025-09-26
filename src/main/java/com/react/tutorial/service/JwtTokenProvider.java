package com.react.tutorial.service;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long tokenValidityInMilliseconds;

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
            // 잘못된 JWT 서명
        } catch (ExpiredJwtException e) {
            // 만료된 JWT 토큰
        } catch (UnsupportedJwtException e) {
            // 지원되지 않는 JWT 토큰
        } catch (IllegalArgumentException e) {
            // JWT 토큰이 잘못됨
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