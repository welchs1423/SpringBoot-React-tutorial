package com.react.tutorial.dto;

import com.react.tutorial.entity.User;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class UserDTO {
    private Long id;
    private String username;
    private String role;

    // 엔티티를 받아 DTO로 변환하는 생성자는 그대로 유지합니다.
    public UserDTO(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.role = user.getRole();
    }
}