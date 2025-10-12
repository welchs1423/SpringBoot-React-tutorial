package com.react.tutorial.Controller;

import com.react.tutorial.dto.UserDTO;
import com.react.tutorial.entity.User;
import com.react.tutorial.service.CustomUserDetailsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final CustomUserDetailsService customUserDetailsService;

    public UserController(CustomUserDetailsService customUserDetailsService) {
        this.customUserDetailsService = customUserDetailsService;
    }

    /**
     * GET /api/user/profile : 현재 로그인된 사용자 정보 조회
     * @param userDetails - @AuthenticationPrincipal로 JWT에서 추출된 UserDetails 객체로 변경
     */
    @GetMapping("/profile")
    public ResponseEntity<UserDTO> getProfile(@AuthenticationPrincipal UserDetails userDetails) {

        String userId = userDetails.getUsername();

        System.out.println("✅✅✅ [USER_CONTROLLER] 프로필 요청 사용자 ID: " + userId);

        User user = customUserDetailsService.loadUserEntityByUsername(userId);

        UserDTO userDTO = new UserDTO(user);

        return ResponseEntity.ok(userDTO);
    }
}