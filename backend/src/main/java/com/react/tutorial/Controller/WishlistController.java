package com.react.tutorial.Controller;

import com.react.tutorial.dto.WishlistDTO;
import com.react.tutorial.service.WishlistService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    private String getUsername(UserDetails userDetails) {
        if (userDetails == null) {
            throw new IllegalStateException("인증된 사용자 정보가 없습니다.");
        }
        return userDetails.getUsername();
    }

    // GET /api/wishlist - 찜 목록 조회
    @GetMapping
    public ResponseEntity<List<WishlistDTO>> getWishlist(
            @AuthenticationPrincipal UserDetails userDetails) {

        List<WishlistDTO> list = wishlistService.getWishlist(getUsername(userDetails));
        return ResponseEntity.ok(list);
    }

    // POST /api/wishlist/toggle/{productId} - 찜하기 토글
    @PostMapping("/toggle/{productId}")
    public ResponseEntity<Map<String, Boolean>> toggle(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long productId) {

        boolean wishlisted = wishlistService.toggle(getUsername(userDetails), productId);
        return ResponseEntity.ok(Map.of("wishlisted", wishlisted));
    }

    // GET /api/wishlist/check/{productId} - 찜 여부 확인
    @GetMapping("/check/{productId}")
    public ResponseEntity<Map<String, Boolean>> check(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long productId) {

        boolean wishlisted = wishlistService.isWishlisted(getUsername(userDetails), productId);
        return ResponseEntity.ok(Map.of("wishlisted", wishlisted));
    }
}
