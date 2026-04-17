package com.react.tutorial.service;

import com.react.tutorial.dto.PaymentConfirmRequest;
import com.react.tutorial.entity.Order;
import com.react.tutorial.exception.BusinessException;
import com.react.tutorial.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.Objects;

/**
 * 토스페이먼츠 API와의 통신 및 결제 관련 비즈니스 로직을 담당한다.
 * PaymentController에서 분리해 단일 책임 원칙을 유지한다.
 */
@Service
@RequiredArgsConstructor
public class PaymentService {

    @Value("${toss.payments.secret.key}")
    private String secretKey;

    private final RestTemplate restTemplate;
    private final OrderRepository orderRepository;
    private final OrderService orderService;

    public String confirmPayment(PaymentConfirmRequest request) {
        Long dbOrderId = parseOrderId(request.getOrderId());

        Order order = orderRepository.findById(Objects.requireNonNull(dbOrderId))
                .orElseThrow(() -> new BusinessException("주문을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        if (order.getTotalAmount() != request.getAmount()) {
            throw new BusinessException("결제 금액이 일치하지 않습니다. 위변조가 의심됩니다.", HttpStatus.BAD_REQUEST);
        }

        HttpEntity<Map<String, Object>> entity = buildRequest(Map.of(
                "paymentKey", request.getPaymentKey(),
                "orderId", request.getOrderId(),
                "amount", request.getAmount()
        ));

        ResponseEntity<String> response = restTemplate.postForEntity(
                "https://api.tosspayments.com/v1/payments/confirm",
                entity,
                String.class
        );

        if (response.getStatusCode() == HttpStatus.OK) {
            orderService.completePayment(dbOrderId, request.getPaymentKey());
        }

        return response.getBody();
    }

    public String cancelPayment(Long orderId, String cancelReason) {
        Order order = orderRepository.findById(Objects.requireNonNull(orderId))
                .orElseThrow(() -> new BusinessException("주문을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        if (order.getPaymentKey() == null) {
            throw new BusinessException("결제 키가 존재하지 않아 환불할 수 없습니다.", HttpStatus.BAD_REQUEST);
        }

        HttpEntity<Map<String, Object>> entity = buildRequest(Map.of("cancelReason", cancelReason));

        ResponseEntity<String> response = restTemplate.postForEntity(
                "https://api.tosspayments.com/v1/payments/" + order.getPaymentKey() + "/cancel",
                entity,
                String.class
        );

        if (response.getStatusCode() == HttpStatus.OK) {
            orderService.cancelOrder(orderId, cancelReason, order.getUser());
        }

        return response.getBody();
    }

    private HttpEntity<Map<String, Object>> buildRequest(Map<String, Object> body) {
        String encoded = Base64.getEncoder()
                .encodeToString((secretKey + ":").getBytes(StandardCharsets.UTF_8));

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Basic " + encoded);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, headers);
    }

    private Long parseOrderId(String orderId) {
        try {
            return Long.parseLong(orderId.replaceAll("[^0-9]", ""));
        } catch (NumberFormatException e) {
            throw new BusinessException("유효하지 않은 주문 ID 형식입니다.", HttpStatus.BAD_REQUEST);
        }
    }
}
