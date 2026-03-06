package com.react.tutorial.Controller;

import com.react.tutorial.dto.PaymentConfirmRequest;
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

    @PostMapping("/confirm")
    public ResponseEntity<String> confirmPayment(@RequestBody PaymentConfirmRequest request) {

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
                Long dbOrderId = Long.parseLong(request.getOrderId().replaceAll("[^0-9]",""));
                orderService.completePayment(dbOrderId);
            }

            return response;
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
