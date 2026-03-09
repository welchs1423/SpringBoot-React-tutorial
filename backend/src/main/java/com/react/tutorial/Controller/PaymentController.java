package com.react.tutorial.Controller;

import com.react.tutorial.dto.PaymentConfirmRequest;
import com.react.tutorial.entity.Order;
import com.react.tutorial.repository.OrderRepository;
import com.react.tutorial.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "http://localhost:5173")
public class PaymentController {

    @Value("${toss.payments.secret.key}")
    private String secretKey;

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;


    @PostMapping("/confirm")
    public ResponseEntity<String> confirmPayment(@RequestBody PaymentConfirmRequest request) {

        Long dbOrderId = Long.parseLong(request.getOrderId().replaceAll("[^0-9]", ""));
        Order order = orderRepository.findById(dbOrderId)
                .orElseThrow(() -> new RuntimeException("주문을 찾을 수 없습니다."));

        if(order.getTotalAmount() != request.getAmount()){
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("결제 금액이 일치하지 않습니다! 위변조가 의심됩니다.");
        }

        RestTemplate restTemplate = new RestTemplate();
        String widgetSecretKey = secretKey + ":";
        String encodedAuth = Base64.getEncoder().encodeToString(widgetSecretKey.getBytes(java.nio.charset.StandardCharsets.UTF_8));

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Basic " + encodedAuth);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> params = new HashMap<>();
        params.put("paymentKey", request.getPaymentKey());
        params.put("orderId", request.getOrderId());
        params.put("amount", request.getAmount());

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(params, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    "https://api.tosspayments.com/v1/payments/confirm",
                    entity,
                    String.class
            );

            if (response.getStatusCode() == HttpStatus.OK) {
                orderService.completePayment(dbOrderId, request.getPaymentKey());
            }

            return response;
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/cancel/{orderId}")
    public ResponseEntity<String> cancelPayment(@PathVariable Long orderId, @RequestBody Map<String, String> request){
        String cancelReason = request.get("cancelReason");

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("주문을 찾을 수 없습니다."));

        String paymentKey = order.getPaymentKey();
        if (paymentKey == null){
            return ResponseEntity.badRequest().body("결제 키가 존재하지 않아 환불할 수 없습니다.");
        }

        RestTemplate restTemplate = new RestTemplate();
        String widgetSecretKey = secretKey + ":";
        String encodedAuth = Base64.getEncoder().encodeToString(widgetSecretKey.getBytes(java.nio.charset.StandardCharsets.UTF_8));

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Basic " + encodedAuth);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> params = new HashMap<>();
        params.put("cancelReason", cancelReason);

        HttpEntity<Map<String,Object>> entity = new HttpEntity<>(params, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    "https://api.tosspayments.com/v1/payments/" + paymentKey + "/cancel",
                    entity,
                    String.class
            );

            if (response.getStatusCode() == HttpStatus.OK){
                orderService.cancelOrder(orderId, cancelReason, order.getUser());
            }

            return response;
        } catch (Exception e){
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("환불 처리 실패: " + e.getMessage());
        }
    }
}
