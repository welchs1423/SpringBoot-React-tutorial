package com.react.tutorial.Controller;

import com.react.tutorial.dto.OrderRequest;
import com.react.tutorial.dto.OrderResponseDTO;
import com.react.tutorial.entity.Order;
import com.react.tutorial.entity.User;
import com.react.tutorial.repository.UserRepository;
import com.react.tutorial.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.awt.desktop.UserSessionEvent;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    /**
     * 장바구니 상품을 기반으로 주문을 생성합니다.
     * @param userDetails JWT 토큰에서 추출된 사용자 정보
     * @param request 주문 요청 DTO (배송지 정보, 결제 수단 포함)
     * @return 생성된 주문 정보
     */
    @PostMapping
    public ResponseEntity<?> createOrder(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody OrderRequest request){

        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("인증된 사용자를 찾을 수 없습니다."));

        try{
            Order savedOrder = orderService.createOrder(user, request);

            return ResponseEntity.status(HttpStatus.CREATED).body(savedOrder);
        } catch (IllegalArgumentException e){
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch(IllegalStateException e){
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch(Exception e){
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("주문 생성 중 예상치 못한 오류 발생: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<OrderResponseDTO>> getMyOrders(
            @AuthenticationPrincipal UserDetails userDetails){

        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("인증된 사용자를 찾을 수 없습니다."));

        // 서비스에서 해당 유저의 주문 목록을 DTO 리스트로 변환해서 가져옴
        List<OrderResponseDTO> orders = orderService.getUserOrders(user);

        return ResponseEntity.ok(orders);
    }

    /**
     * 특정 주문의 상세 정보를 가져옵니다 (팝업용)
     * @param orderId URL 경로로 들어오는 주문 ID
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<?> getOrderDetail(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long orderId) {

        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("인증된 사용자를 찾을 수 없습니다."));

        try {
            // 서비스에서 해당 주문의 상세 정보(상품 정보 포함)를 DTO로 변환해 가져옴
            // 예: orderService에 getOrderDetail 메서드가 있다고 가정
            OrderResponseDTO orderDetail = orderService.getOrderDetail(orderId, user);

            return ResponseEntity.ok(orderDetail);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("주문 상세 정보를 찾을 수 없습니다: " + e.getMessage());
        }
    }
}
