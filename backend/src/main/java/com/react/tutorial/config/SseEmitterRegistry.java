package com.react.tutorial.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Component
public class SseEmitterRegistry {

    private static final long TIMEOUT_MS = 30 * 60 * 1000L;

    private final Map<String, List<SseEmitter>> emitterMap = new ConcurrentHashMap<>();

    public SseEmitter register(String username) {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MS);

        List<SseEmitter> list = emitterMap.computeIfAbsent(username, k -> new CopyOnWriteArrayList<>());
        list.add(emitter);

        Runnable cleanup = () -> removeEmitter(username, emitter);
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> cleanup.run());

        try {
            emitter.send(SseEmitter.event().name("connect").data("connected"));
        } catch (IOException | IllegalStateException e) {
            log.warn("SSE 초기 연결 이벤트 전송 실패: username={}", username);
            cleanup.run();
        }

        return emitter;
    }

    @SuppressWarnings("null")
    public void sendToUser(String username, Object data) {
        List<SseEmitter> list = emitterMap.get(username);
        if (list == null || list.isEmpty()) {
            return;
        }

        List<SseEmitter> dead = new CopyOnWriteArrayList<>();
        for (SseEmitter emitter : list) {
            try {
                emitter.send(SseEmitter.event().name("notification").data(data));
            } catch (IOException | IllegalStateException e) {
                log.warn("SSE 전송 실패, 연결 제거: username={}", username);
                dead.add(emitter);
            }
        }
        list.removeAll(dead);
    }

    private void removeEmitter(String username, SseEmitter emitter) {
        List<SseEmitter> list = emitterMap.get(username);
        if (list != null) {
            list.remove(emitter);
        }
    }
}
