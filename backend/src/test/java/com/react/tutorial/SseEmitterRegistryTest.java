package com.react.tutorial;

import com.react.tutorial.config.SseEmitterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

class SseEmitterRegistryTest {

    private SseEmitterRegistry registry;

    @BeforeEach
    void setUp() {
        registry = new SseEmitterRegistry();
    }

    @Test
    void 구독_시_SseEmitter를_반환한다() {
        SseEmitter emitter = registry.register("user1");
        assertThat(emitter).isNotNull();
    }

    @Test
    void 미등록_사용자에_전송해도_예외가_발생하지_않는다() {
        assertThatCode(() -> registry.sendToUser("ghost", Map.of("msg", "hello")))
                .doesNotThrowAnyException();
    }

    @Test
    void 다중_사용자_각각에_이벤트_전송이_가능하다() {
        registry.register("userA");
        registry.register("userB");

        assertThatCode(() -> {
            registry.sendToUser("userA", Map.of("msg", "A"));
            registry.sendToUser("userB", Map.of("msg", "B"));
        }).doesNotThrowAnyException();
    }

    @Test
    void 동일_사용자가_여러_번_구독해도_예외가_발생하지_않는다() {
        assertThatCode(() -> {
            registry.register("multi");
            registry.register("multi");
        }).doesNotThrowAnyException();
    }

    @Test
    void Emitter_완료_후_해당_사용자_전송이_안전하게_처리된다() {
        registry.register("completedUser");

        assertThatCode(() -> registry.sendToUser("completedUser", Map.of("msg", "after completion")))
                .doesNotThrowAnyException();
    }
}
