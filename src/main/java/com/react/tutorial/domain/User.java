package com.react.tutorial.domain;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Collection;
import java.util.Collections;

@Entity
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username; // 사용자 ID (로그인 시 사용)

    @Column(nullable = false)
    private String password; // 암호화된 비밀번호

    private String role; // 사용자 역할 (예: ROLE_USER)

    @Builder
    public User(String username, String password, String role) {
        this.username = username;
        this.password = password;
        this.role = role;
    }

    // --- Spring Security UserDetails 구현 메서드 ---

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // 실제 프로젝트에서는 권한을 정의해야 하지만, 현재는 간소화
        return Collections.emptyList();
    }

    // 아래 4개 메서드는 계정 상태를 나타냅니다. 현재는 테스트를 위해 모두 true
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}