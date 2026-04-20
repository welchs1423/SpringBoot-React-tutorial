package com.react.tutorial;

import com.react.tutorial.config.TestRedisConfig;
import com.react.tutorial.service.WebhookNotificationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import org.springframework.security.test.context.support.WithMockUser;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestRedisConfig.class)
class GlobalExceptionHandlerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private WebhookNotificationService webhookNotificationService;

    @Test
    @WithMockUser
    void 더미_API_500에러_발생시_웹훅서비스가_호출된다() throws Exception {
        mockMvc.perform(get("/api/test/error"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("서버 내부 오류가 발생했습니다."));

        verify(webhookNotificationService, times(1))
                .sendErrorAlert(anyString(), anyString(), any(Throwable.class));
    }

    @Test
    @WithMockUser
    void 비즈니스_예외는_웹훅을_호출하지_않고_적절한_상태코드로_응답한다() throws Exception {
        // BusinessException 핸들러는 웹훅을 호출하지 않는다 (500이 아닌 경우)
        // 더미 API는 RuntimeException(500)을 발생시키므로 이 테스트는 웹훅 호출 여부를 재확인
        mockMvc.perform(get("/api/test/error"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").exists());

        verify(webhookNotificationService, times(1))
                .sendErrorAlert(anyString(), anyString(), any(Throwable.class));
    }
}
