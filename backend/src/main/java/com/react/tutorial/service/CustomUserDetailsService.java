package com.react.tutorial.service;

import com.react.tutorial.entity.User;
import com.react.tutorial.repository.UserRepository;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Spring Security에서 사용자 이름(username)을 기반으로 사용자 정보를 로드합니다.
     * DB 연결 전이므로, 여기서는 임시 사용자를 생성하여 반환합니다.
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 실제로는 DB에서 사용자 정보를 조회해야 하지만, 현재는 임시로 사용자 정보를 생성하여 사용합니다.
        return userRepository.findByUsername(username)
                // 조회된 User(Entity) 객체가 UserDetails로 반환됩니다.
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + username));
    }

    public User loadUserEntityByUsername(String username){
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
    }
}