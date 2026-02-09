package com.react.tutorial.entity;

import jakarta.persistence.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Entity // 💡 JPA Entity임을 명시
@Table(name = "users") // 💡 데이터베이스 테이블 이름 지정
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class User implements UserDetails {

    @Id // 💡 기본 키(Primary Key) 지정
    @GeneratedValue(strategy = GenerationType.IDENTITY) // 💡 자동 증가 설정
    private Long id;

    @Column(nullable = false, unique = true, length = 50) // 💡 Null 불가, 유니크 제약조건 추가
    private String username;

    @Column(nullable = false)
    private String password;

    // 사용자 권한 (예: ROLE_USER, ROLE_ADMIN)
    private String role;

    // --- UserDetails 인터페이스 구현 시작 ---

    @Override
    public String getPassword(){
        return password;
    }

    @Override
    public String getUsername(){
        return username;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // SimpleGrantedAuthority로 권한을 리스트 형태로 반환합니다.
        return List.of(new SimpleGrantedAuthority(role));
    }

    // 계정 만료 여부 (true: 만료되지 않음)
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    // 계정 잠금 여부 (true: 잠기지 않음)
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    // 비밀번호 만료 여부 (true: 만료되지 않음)
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    // 계정 활성화 여부 (true: 활성화됨)
    @Override
    public boolean isEnabled() {
        return true;
    }

    private String email;
}
