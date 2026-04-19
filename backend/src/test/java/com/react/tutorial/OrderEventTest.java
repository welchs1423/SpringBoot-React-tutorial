package com.react.tutorial;

import com.react.tutorial.dto.OrderStatus;
import com.react.tutorial.entity.Notification;
import com.react.tutorial.entity.Order;
import com.react.tutorial.entity.User;
import com.react.tutorial.event.OrderCompletedEvent;
import com.react.tutorial.event.OrderEventListener;
import com.react.tutorial.repository.NotificationRepository;
import com.react.tutorial.repository.UserRepository;
import com.react.tutorial.config.TestRedisConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Import;
import org.springframework.test.annotation.DirtiesContext;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Import(TestRedisConfig.class)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class OrderEventTest {

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderEventListener orderEventListener;

    @Test
    void 이벤트_리스너_빈이_등록되어_있다() {
        assertThat(orderEventListener).isNotNull();
    }

    @Test
    void 주문완료_이벤트_발행_시_알림이_DB에_저장된다() throws InterruptedException {
        User user = userRepository.save(User.builder()
                .username("testuser_event")
                .password("password")
                .role("ROLE_USER")
                .points(0)
                .build());

        Order order = new Order();
        order.setUser(user);
        order.setStatus(OrderStatus.ORDERED);
        order.setOrderDate(LocalDateTime.now());
        order.setTotalAmount(10000);
        order.setFinalAmount(10000);
        order.setReceiverName("홍길동");
        order.setAddress("서울시 강남구");
        order.setPhoneNumber("010-1234-5678");

        eventPublisher.publishEvent(new OrderCompletedEvent(order));

        TimeUnit.MILLISECONDS.sleep(500);

        List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user);
        assertThat(notifications).isNotEmpty();
        assertThat(notifications.get(0).getMessage()).contains("주문 완료");
        assertThat(notifications.get(0).isRead()).isFalse();
    }

    @Test
    void 알림_미읽음_카운트가_정확히_조회된다() throws InterruptedException {
        User user = userRepository.save(User.builder()
                .username("testuser_count")
                .password("password")
                .role("ROLE_USER")
                .points(0)
                .build());

        Order order = new Order();
        order.setUser(user);
        order.setStatus(OrderStatus.ORDERED);
        order.setOrderDate(LocalDateTime.now());
        order.setTotalAmount(20000);
        order.setFinalAmount(20000);
        order.setReceiverName("테스터");
        order.setAddress("부산시 해운대구");
        order.setPhoneNumber("010-9999-8888");

        eventPublisher.publishEvent(new OrderCompletedEvent(order));

        TimeUnit.MILLISECONDS.sleep(500);

        long unreadCount = notificationRepository.countByUserAndReadFalse(user);
        assertThat(unreadCount).isEqualTo(1L);
    }
}
