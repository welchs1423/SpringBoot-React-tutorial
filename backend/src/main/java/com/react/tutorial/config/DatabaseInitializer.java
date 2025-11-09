package com.react.tutorial.config;

import com.react.tutorial.entity.User;
import com.react.tutorial.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DatabaseInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 관리자 계정 'admin'이 없을 경우 자동 생성
        if (userRepository.findByUsername("admin").isEmpty()) {
            User adminUser = User.builder()
                    .username("admin")
                    // 비밀번호: adminpass
                    .password(passwordEncoder.encode("adminpass"))
                    .role("ROLE_ADMIN") // ⭐️ 관리자 권한 부여
                    .build();
            userRepository.save(adminUser);
            System.out.println("--- ⭐️ 관리자 계정 'admin'이 생성되었습니다. ---");
        }
    }
}