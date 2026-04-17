package com.react.tutorial.Controller;

import com.react.tutorial.dto.PaymentConfirmRequest;
import com.react.tutorial.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/confirm")
    public ResponseEntity<String> confirmPayment(@RequestBody PaymentConfirmRequest request) {
        String result = paymentService.confirmPayment(request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/cancel/{orderId}")
    public ResponseEntity<String> cancelPayment(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> request) {

        String result = paymentService.cancelPayment(orderId, request.get("cancelReason"));
        return ResponseEntity.ok(result);
    }
}
