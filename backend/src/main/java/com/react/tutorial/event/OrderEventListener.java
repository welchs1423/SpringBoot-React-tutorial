package com.react.tutorial.event;

import com.react.tutorial.config.SseEmitterRegistry;
import com.react.tutorial.entity.Notification;
import com.react.tutorial.entity.Order;
import com.react.tutorial.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderEventListener {

    private final NotificationRepository notificationRepository;
    private final SseEmitterRegistry sseEmitterRegistry;

    @Async
    @EventListener
    public void handleOrderCompleted(OrderCompletedEvent event) {
        Order order = event.getOrder();
        int amount = order.getFinalAmount() > 0 ? order.getFinalAmount() : order.getTotalAmount();
        String message = String.format("주문 완료: 주문번호 #%d, 결제 금액 %,d원", order.getId(), amount);
        log.info("[알림] {} - {}", order.getUser().getUsername(), message);

        Notification notification = new Notification(order.getUser(), message);
        notificationRepository.save(notification);

        Map<String, Object> payload = Map.of(
                "id", notification.getId() != null ? notification.getId() : 0L,
                "message", message,
                "read", false,
                "createdAt", notification.getCreatedAt().toString()
        );
        sseEmitterRegistry.sendToUser(order.getUser().getUsername(), payload);
    }
}
