package com.react.tutorial.service;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders; // 💡 Base64 디코딩을 위해 추가
import io.jsonwebtoken.security.Keys; // 💡 보안 키 생성을 위해 추가
import io.jsonwebtoken.security.SignatureException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value; // 💡 @Value를 위해 추가
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey; // 💡 SecretKey 타입 사용을 위해 추가
import java.util.Date;
import java.util.stream.Collectors;

@Component
public class JwtTokenProvider {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    // 💡 1. application.properties에서 키를 주입받도록 수정
    private final SecretKey key; // 💡 SecretKey 타입으로 변경
    private final long tokenValidityInMilliseconds;
    private final UserDetailsService userDetailsService;

    // 💡 2. 생성자에서 @Value를 사용하여 주입받고, SecretKey로 변환
    public JwtTokenProvider(
            UserDetailsService userDetailsService,
            @Value("${jwt.secret}") String secretKey, // jwt.secret 값을 문자열로 주입
            @Value("${jwt.expiration}") long expirationInSeconds) {

        this.userDetailsService = userDetailsService;

        // 💡 3. 주입받은 Base64 문자열을 디코딩하여 SecretKey 객체 생성
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        this.key = Keys.hmacShaKeyFor(keyBytes);

        this.tokenValidityInMilliseconds = expirationInSeconds * 1000;
    }

    public boolean validateToken(String token){
        try{
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch(SignatureException ex){
            logger.error("잘못된 JWT 서명입니다: {}",ex.getMessage());
        } catch(MalformedJwtException ex){
            logger.error("잘못된 JWT 구조입니다: {}",ex.getMessage());
        } catch(ExpiredJwtException ex){
            logger.error("만료된 JWT 토큰입니다: {}",ex.getMessage());
        } catch(IllegalArgumentException ex){
            logger.error("JWT 토큰이 잘못되었습니다: {}", ex.getMessage());
        }
        return false;
    }

    public String getUsernameFromToken(String token){
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }
    public String generateToken(Authentication authentication) {
        // 1. 인증 객체에서 사용자 이름(Principal)을 추출합니다.
        String username = authentication.getName();

        // 2. 권한 정보 추출
        String authorities = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

        // 3. 실제 토큰 생성 로직이 담긴 내부 메소드 호출
        return createToken(username, authorities);
    }

    // JWT를 실제로 생성하는 내부 로직
    private String createToken(String username, String authorities) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + tokenValidityInMilliseconds);

        return Jwts.builder()
                .setSubject(username)           // 사용자 이름
                .claim("roles",authorities)  // 권한 정보 추가
                .setIssuedAt(now)               // 발행시간
                .setExpiration(validity)        // 만료 시간
                .signWith(key)
                .compact();
    }

    public Authentication getAuthentication(String token){
        String username = getUsernameFromToken(token);

        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        return new UsernamePasswordAuthenticationToken(
                userDetails,
                "", // 토큰 기반 인증이므로 비밀번호는 비워둡니다.
                userDetails.getAuthorities()
        );
    }
}