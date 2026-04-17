package com.react.tutorial.exception;

import org.springframework.http.HttpStatus;

/**
 * 비즈니스 규칙 위반 시 사용하는 런타임 예외.
 * 컨트롤러에서 직접 catch하지 않고 GlobalExceptionHandler가 처리한다.
 */
public class BusinessException extends RuntimeException {

    private final HttpStatus status;

    public BusinessException(String message, HttpStatus status) {
        super(message);
        this.status = (status != null) ? status : HttpStatus.INTERNAL_SERVER_ERROR;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
