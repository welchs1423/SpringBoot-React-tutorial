package com.react.tutorial.config;

import com.react.tutorial.filter.JwtAuthenticationFilter;
import com.react.tutorial.service.CustomUserDetailsService;
import com.react.tutorial.service.JwtTokenProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAccessDeniedHandler jwtAccessDeniedHandler;
    private final DebugFilter debugFilter;

    // ⭐ 1. 필드 주입 대신 생성자 주입 사용
    public SecurityConfig(JwtAccessDeniedHandler jwtAccessDeniedHandler, DebugFilter debugFilter) {
        this.jwtAccessDeniedHandler = jwtAccessDeniedHandler;
        this.debugFilter = debugFilter;

        // Context 전략 설정 (Context 유실 문제 해결책)
        SecurityContextHolder.setStrategyName(SecurityContextHolder.MODE_INHERITABLETHREADLOCAL);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // 2. JwtAuthenticationFilter Bean 등록
    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter(
            JwtTokenProvider jwtTokenProvider,
            CustomUserDetailsService customUserDetailsService
    ) {
        return new JwtAuthenticationFilter(jwtTokenProvider, customUserDetailsService);
    }

    @Bean
    public JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint(){
        return new JwtAuthenticationEntryPoint();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   JwtAuthenticationFilter jwtAuthenticationFilter,
                                                   JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint) throws Exception{
        http
                .cors(cors -> cors.disable())
                .csrf(csrf -> csrf.disable()) // /api/auth/** ignoring은 disable()에 포함됩니다.
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .httpBasic(httpBasic -> httpBasic.disable())
                .formLogin(formLogin -> formLogin.disable())

                // 요청 권한 설정
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/api/auth/**", "/public/**", "/h2-console/**").permitAll()
                        .anyRequest().authenticated()
                )

                // 예외 처리 설정
                .exceptionHandling(handling -> handling
                        .authenticationEntryPoint(jwtAuthenticationEntryPoint) // 401 인증 실패
                        .accessDeniedHandler(jwtAccessDeniedHandler)         // 403 인가 실패
                );
        http.securityContext(securityContext ->
                securityContext.requireExplicitSave(false) // 명시적 저장이 필요하지 않도록 설정
                        .securityContextRepository(new NullSecurityContextRepository())); // Context 저장소를 비활성화

        http.securityContext((securityContext) -> securityContext.disable());

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterAfter(debugFilter, JwtAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}