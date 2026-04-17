package com.react.tutorial.Controller;

import com.react.tutorial.dto.OrderResponseDTO;
import com.react.tutorial.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<List<OrderResponseDTO>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @PatchMapping("/{orderId}/deliver")
    public ResponseEntity<Void> deliver(@PathVariable Long orderId) {
        orderService.deliverOrder(orderId);
        return ResponseEntity.ok().build();
    }
}
