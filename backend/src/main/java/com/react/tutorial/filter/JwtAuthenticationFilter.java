package com.react.tutorial.filter;

import com.react.tutorial.service.JwtTokenProvider;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;

    // 생성자를 통해 의존성 주입
    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        System.out.println("[JWT_FILTER_ENTRY] Filter Chain 진입: " + request.getRequestURI());

        try{
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                Authentication authentication = tokenProvider.getAuthentication(jwt);

                if(authentication instanceof UsernamePasswordAuthenticationToken){
                    ((UsernamePasswordAuthenticationToken) authentication).setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                    );
                }
                SecurityContextHolder.getContext().setAuthentication(authentication);

                logger.info("FILTER_SAVE_SUCCESS: Context 저장됨: " + authentication.getName());


            }
        }catch(AuthenticationException ex) {
            SecurityContextHolder.clearContext();
            throw ex;
        }catch(Exception e){
            SecurityContextHolder.clearContext();
        }


        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7).trim();
        }
        // EventSource는 헤더 설정 불가로 SSE 구독 시 쿼리 파라미터에서 토큰 추출
        String paramToken = request.getParameter("token");
        if (StringUtils.hasText(paramToken)) {
            return paramToken.trim();
        }
        return null;
    }

    private List<String> permittedUrls = new ArrayList<>();

    //Setter 추가 (SecurityConfig에서 호출하기 위해)
    public void setPermittedUrls(List<String> urls) {
        this.permittedUrls = urls;
    }

    //필터 실행 여부를 결정하는 핵심 메서드 오버라이드
    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) throws ServletException{
        String path = request.getRequestURI();
        // 허용된 경로 목록 중 현재 요청 URI로 시작하는 경로가 있는지 확인
        return permittedUrls.stream().anyMatch(path::startsWith);
    }
}