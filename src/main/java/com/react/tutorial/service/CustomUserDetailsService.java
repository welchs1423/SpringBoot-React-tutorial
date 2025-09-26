package com.react.tutorial.service;

import com.react.tutorial.domain.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final PasswordEncoder passwordEncoder;

    // PasswordEncoder를 주입받아 임시 사용자 비밀번호를 암호화
    public CustomUserDetailsService(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Spring Security에서 사용자 이름(username)을 기반으로 사용자 정보를 로드합니다.
     * DB 연결 전이므로, 여기서는 임시 사용자를 생성하여 반환합니다.
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 실제로는 DB에서 사용자 정보를 조회해야 하지만, 현재는 임시로 사용자 정보를 생성하여 사용합니다.
        if ("testuser".equals(username)) {
            // "1234"를 BCrypt로 인코딩한 값: $2a$10$T1K7.5P... (실제 값은 다를 수 있음)
            // 사용자님의 SecurityConfig에 등록된 PasswordEncoder와 일치해야 합니다.
            return User.builder()
                    .username("testuser")
                    .password(passwordEncoder.encode("1234")) // "1234" 비밀번호를 암호화
                    .role("ROLE_USER")
                    .build();
        } else {
            throw new UsernameNotFoundException("User not found with username: " + username);
        }
    }
}