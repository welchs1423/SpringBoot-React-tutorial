package com.react.tutorial.Controller;

import com.react.tutorial.dto.CartItemDTO;
import com.react.tutorial.dto.CartSyncRequestDTO;
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

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    private String getUsername(UserDetails userDetails) {
        if (userDetails == null) {
            throw new IllegalStateException("인증된 사용자 정보가 없습니다.");
        }
        return userDetails.getUsername();
    }

    // GET /api/cart - 장바구니 조회
    @GetMapping
    public ResponseEntity<List<CartItemDTO>> getMyCart(
            @AuthenticationPrincipal UserDetails userDetails) {

        String username = getUsername(userDetails);
        List<CartItemDTO> cart = cartService.getMyCart(username);

        logger.info("CONTROLLER_LOAD_CHECK: " + SecurityContextHolder.getContext().getAuthentication().getName());

        return ResponseEntity.ok(cart);
    }

    // POST /api/cart/sync - 로컬 장바구니 동기화
    @PostMapping("/sync")
    public ResponseEntity<List<CartItemDTO>> syncCart(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody CartSyncRequestDTO request) {

        String username = getUsername(userDetails);
        List<CartItemDTO> cart = cartService.syncCart(username, request);
        return ResponseEntity.ok(cart);
    }

    // POST /api/cart - 아이템 추가
    @PostMapping
    public ResponseEntity<Void> addItemToCart(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody @Valid CartItemDTO cartItemDTO) {

        String username = getUsername(userDetails);
        cartService.addItemToCart(username, cartItemDTO);
        return ResponseEntity.ok().build();
    }

    // PATCH /api/cart/{cartItemId} - 수량 변경
    @PatchMapping("/{cartItemId}")
    public ResponseEntity<Void> updateCartItem(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long cartItemId,
            @RequestBody CartItemDTO updateDTO) {

        String username = getUsername(userDetails);
        cartService.updateCartItemQuantity(username, cartItemId, updateDTO.getQuantity());
        return ResponseEntity.ok().build();
    }

    // DELETE /api/cart/{cartItemId} - 아이템 삭제
    @DeleteMapping("/{cartItemId}")
    public ResponseEntity<Void> removeCartItem(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long cartItemId) {

        String username = getUsername(userDetails);
        cartService.removeCartItem(username, cartItemId);
        return ResponseEntity.noContent().build();
    }
}
