package com.react.tutorial;

import com.react.tutorial.config.SseEmitterRegistry;
import com.react.tutorial.config.TestRedisConfig;
import com.react.tutorial.entity.User;
import com.react.tutorial.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestRedisConfig.class)
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private SseEmitterRegistry sseEmitterRegistry;

    @BeforeEach
    @SuppressWarnings("null")
    void setUp() {
        if (userRepository.findByUsername("sse_ctrl_test").isEmpty()) {
            User user = User.builder()
                    .username("sse_ctrl_test")
                    .password(passwordEncoder.encode("pass"))
                    .role("ROLE_USER")
                    .points(0)
                    .build();
            userRepository.save(user);
        }
    }

    @Test
    @WithMockUser(username = "sse_ctrl_test")
    void SSE_구독_엔드포인트가_정상적으로_응답한다() throws Exception {
        SseEmitter emitter = new SseEmitter();
        when(sseEmitterRegistry.register(anyString())).thenReturn(emitter);

        MvcResult result = mockMvc.perform(
                        get("/api/notifications/subscribe")
                                .accept(MediaType.TEXT_EVENT_STREAM_VALUE))
                .andExpect(request().asyncStarted())
                .andReturn();

        emitter.complete();

        mockMvc.perform(asyncDispatch(result))
                .andExpect(status().isOk());

        verify(sseEmitterRegistry).register("sse_ctrl_test");
    }

    @Test
    @WithMockUser(username = "sse_ctrl_test")
    void SSE_구독_시_레지스트리_register가_호출된다() throws Exception {
        SseEmitter emitter = new SseEmitter();
        when(sseEmitterRegistry.register("sse_ctrl_test")).thenReturn(emitter);

        mockMvc.perform(
                        get("/api/notifications/subscribe")
                                .accept(MediaType.TEXT_EVENT_STREAM_VALUE))
                .andExpect(request().asyncStarted())
                .andReturn();

        verify(sseEmitterRegistry).register("sse_ctrl_test");
    }

    @Test
    void SSE_레지스트리_타임아웃_콜백_등록_및_안전한_종료() {
        SseEmitterRegistry realRegistry = new SseEmitterRegistry();

        SseEmitter emitter = realRegistry.register("timeout_user");

        assertThatCode(emitter::complete).doesNotThrowAnyException();
        assertThatCode(() -> realRegistry.sendToUser("timeout_user", Map.of("msg", "after complete")))
                .doesNotThrowAnyException();
    }

    @Test
    void SSE_전송_실패_시_예외_없이_안전하게_처리된다() {
        SseEmitterRegistry realRegistry = new SseEmitterRegistry();

        assertThatCode(() -> realRegistry.sendToUser("no_such_user", Map.of("event", "test")))
                .doesNotThrowAnyException();
    }

    @Test
    void SSE_네트워크_단절_시뮬레이션_후_재등록이_가능하다() {
        SseEmitterRegistry realRegistry = new SseEmitterRegistry();

        SseEmitter first = realRegistry.register("reconnect_user");
        assertThatCode(first::complete).doesNotThrowAnyException();

        realRegistry.register("reconnect_user");
        assertThatCode(() -> realRegistry.sendToUser("reconnect_user", Map.of("msg", "reconnected")))
                .doesNotThrowAnyException();
    }
}
