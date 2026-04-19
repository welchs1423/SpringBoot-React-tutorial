package com.react.tutorial.dto;

import com.react.tutorial.entity.Notification;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class NotificationDTO {

    private final Long id;
    private final String message;
    private final boolean read;
    private final LocalDateTime createdAt;

    public NotificationDTO(Notification notification) {
        this.id = notification.getId();
        this.message = notification.getMessage();
        this.read = notification.isRead();
        this.createdAt = notification.getCreatedAt();
    }
}
