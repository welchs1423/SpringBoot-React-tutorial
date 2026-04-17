package com.react.tutorial.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/**
 * 전체 컨트롤러의 예외를 한 곳에서 처리한다.
 * 각 컨트롤러의 try-catch 중복 코드를 제거할 수 있다.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** 비즈니스 규칙 위반 (재고 부족, 권한 없음 등) */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Map<String, String>> handleBusinessException(BusinessException e) {
        HttpStatus status = e.getStatus();
        return ResponseEntity.status(status.value())
                .body(Map.of("message", e.getMessage()));
    }

    /** 잘못된 인수 (존재하지 않는 ID 등) */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", e.getMessage()));
    }

    /** 상태 위반 (주문 상태 전이 오류, 재고 부족 등) */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalState(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", e.getMessage()));
    }

    /** 접근 권한 없음 */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDenied(AccessDeniedException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "접근 권한이 없습니다."));
    }

    /** 그 외 예상치 못한 서버 오류 */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneral(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "서버 내부 오류가 발생했습니다."));
    }
}
