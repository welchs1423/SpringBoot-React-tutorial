package com.react.tutorial.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookNotificationService {

    private final RestTemplate restTemplate;

    @Value("${webhook.error.url:}")
    private String webhookUrl;

    @Async
    public void sendErrorAlert(String endpoint, String errorMessage, Throwable cause) {
        if (webhookUrl == null || webhookUrl.isBlank()) {
            log.warn("웹훅 URL이 설정되지 않아 알림을 전송하지 않습니다.");
            return;
        }

        String time = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        String causeDetail = (cause != null) ? cause.toString() : errorMessage;

        String content = String.format(
                ":rotating_light: **서버 내부 오류(500) 발생**%n" +
                "> **발생 시간:** %s%n" +
                "> **API 엔드포인트:** `%s`%n" +
                "> **에러 메시지:** %s",
                time, endpoint, causeDetail
        );

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> request = new HttpEntity<>(
                    Map.of("content", content), headers
            );
            restTemplate.postForObject(java.util.Objects.requireNonNull(webhookUrl), request, String.class);
        } catch (Exception ex) {
            log.error("웹훅 전송 실패: {}", ex.getMessage());
        }
    }
}
