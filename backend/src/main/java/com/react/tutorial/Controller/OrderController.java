package com.react.tutorial.Controller;

import com.react.tutorial.dto.OrderRequest;
import com.react.tutorial.dto.OrderResponseDTO;
import com.react.tutorial.entity.Order;
import com.react.tutorial.service.CustomUserDetailsService;
import com.react.tutorial.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final CustomUserDetailsService customUserDetailsService;

    @PostMapping
    public ResponseEntity<Order> createOrder(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody OrderRequest request) {

        Order savedOrder = orderService.createOrder(
                customUserDetailsService.loadUserEntityByUsername(userDetails.getUsername()),
                request
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(savedOrder);
    }

    @GetMapping
    public ResponseEntity<List<OrderResponseDTO>> getMyOrders(
            @AuthenticationPrincipal UserDetails userDetails) {

        List<OrderResponseDTO> orders = orderService.getUserOrders(
                customUserDetailsService.loadUserEntityByUsername(userDetails.getUsername())
        );
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponseDTO> getOrderDetail(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long orderId) {

        OrderResponseDTO detail = orderService.getOrderDetail(
                orderId,
                customUserDetailsService.loadUserEntityByUsername(userDetails.getUsername())
        );
        return ResponseEntity.ok(detail);
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelOrder(
            @PathVariable("id") Long orderId,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserDetails userDetails) {

        orderService.cancelOrder(
                orderId,
                payload.get("reason"),
                customUserDetailsService.loadUserEntityByUsername(userDetails.getUsername())
        );
        return ResponseEntity.ok().build();
    }
}
