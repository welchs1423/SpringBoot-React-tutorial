package com.react.tutorial.Controller;

import com.react.tutorial.dto.CartItemDTO;
import com.react.tutorial.service.CartService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private static final Logger logger = LoggerFactory.getLogger(CartController.class);

    private final CartService cartService;

    // CartService만 주입받습니다.
    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    // ⭐️ 사용자 이름 추출 헬퍼 메서드 (Username 반환) ⭐️
    private String getUsername(UserDetails userDetails) {
        if (userDetails == null) {
            // 이 요청은 인증 필터를 통과했으므로 실제로는 발생하지 않음
            throw new IllegalStateException("인증된 사용자 정보가 없습니다.");
        }
        return userDetails.getUsername();
    }

    // 1. 장바구니 상품 추가 (POST /api/cart)
    @PostMapping
    public ResponseEntity<Void> addItemToCart(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody @Valid CartItemDTO cartItemDTO) {

        String username = getUsername(userDetails);
        // ⭐️ 서비스에 String username 전달 ⭐️
        cartService.addItemToCart(username, cartItemDTO);

        return ResponseEntity.ok().build();
    }

    // 2. 장바구니 목록 조회 (GET /api/cart)
    @GetMapping
    public ResponseEntity<List<CartItemDTO>> getMyCart(
            @AuthenticationPrincipal UserDetails userDetails) {

        String username = getUsername(userDetails);
        // ⭐️ 서비스에 String username 전달 ⭐️
        List<CartItemDTO> cart = cartService.getMyCart(username);

        logger.info("CONTROLLER_LOAD_CHECK: " + SecurityContextHolder.getContext().getAuthentication().getName());

        return ResponseEntity.ok(cart);
    }

    // 3. 장바구니 수량 변경 (PATCH /api/cart/{id})
    @PatchMapping("/{cartItemId}")
    public ResponseEntity<Void> updateCartItem(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long cartItemId,
            @RequestBody CartItemDTO updateDTO) {

        String username = getUsername(userDetails);
        // ⭐️ 서비스에 String username 전달 ⭐️
        cartService.updateCartItemQuantity(username, cartItemId, updateDTO.getQuantity());

        return ResponseEntity.ok().build();
    }

    // 4. 장바구니 상품 삭제 (DELETE /api/cart/{id})
    @DeleteMapping("/{cartItemId}")
    public ResponseEntity<Void> removeCartItem(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long cartItemId) {

        String username = getUsername(userDetails);
        // ⭐️ 서비스에 String username 전달 ⭐️
        cartService.removeCartItem(username, cartItemId);

        return ResponseEntity.noContent().build();
    }
}