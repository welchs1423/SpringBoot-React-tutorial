package com.react.tutorial.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.react.tutorial.entity.User;

import java.util.Optional;

// JpaRepository를 상속받아 User 엔티티와 Long 타입의 PK를 사용한다고 명시합니다.
public interface UserRepository extends JpaRepository<User, Long> {

    // Spring Data JPA의 쿼리 메서드 기능:
    // 메서드 이름 규칙만으로 "WHERE username = ?" SQL이 자동 생성됩니다.
    Optional<User> findByUsername(String username);
}
