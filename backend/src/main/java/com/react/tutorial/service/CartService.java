// com.react.tutorial.service.CartService.java (CartItem 엔티티 변경 반영)

package com.react.tutorial.service;

import com.react.tutorial.dto.CartItemDTO;
import com.react.tutorial.entity.CartItem;
import com.react.tutorial.entity.Product;
import com.react.tutorial.entity.User;
import com.react.tutorial.repository.CartItemRepository;
import com.react.tutorial.repository.ProductRepository;
import com.react.tutorial.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CartService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CartItemRepository cartItemRepository;

    public CartService(UserRepository userRepository, ProductRepository productRepository, CartItemRepository cartItemRepository) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.cartItemRepository = cartItemRepository;
    }

    // 헬퍼 메서드: username으로 User 엔티티를 찾습니다.
    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자(" + username + ")를 찾을 수 없습니다."));
    }

    // 1. 장바구니 상품 추가
    public void addItemToCart(String username, CartItemDTO cartItemDTO) {
        User user = findUserByUsername(username);
        Product product = productRepository.findById(cartItemDTO.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("상품 ID가 유효하지 않습니다: " + cartItemDTO.getProductId()));

        // ⭐️ 수정: findByUserIdAndProductId -> findByUserAndProduct로 변경 ⭐️
        CartItem cartItem = cartItemRepository.findByUserAndProduct(user, product)
                .orElseGet(() -> CartItem.builder()
                        .user(user) // ⭐️ 수정: userId 대신 User 객체 직접 사용 ⭐️
                        .product(product)
                        .quantity(0)
                        .build());

        cartItem.setQuantity(cartItem.getQuantity() + cartItemDTO.getQuantity());
        cartItemRepository.save(cartItem);
    }

    // 2. 장바구니 목록 조회
    @Transactional(readOnly = true)
    public List<CartItemDTO> getMyCart(String username) {
        User user = findUserByUsername(username);

        // ⭐️ 수정: findAllByUserId -> findAllByUser로 변경 ⭐️
        List<CartItem> items = cartItemRepository.findAllByUser(user);

        return items.stream()
                .map(item -> CartItemDTO.builder()
                        .cartItemId(item.getId())
                        .productId(item.getProduct().getId())
                        .productName(item.getProduct().getName())
                        .price(item.getProduct().getPrice())
                        .quantity(item.getQuantity())
                        .build())
                .collect(Collectors.toList());
    }

    // 3. 장바구니 수량 변경
    public void updateCartItemQuantity(String username, Long cartItemId, int newQuantity) {
        User user = findUserByUsername(username);

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new IllegalArgumentException("장바구니 아이템을 찾을 수 없습니다."));

        // ⭐️ 보안: 해당 장바구니 아이템이 요청한 사용자의 것인지 확인 (user 객체 비교) ⭐️
        // User 엔티티의 ID를 비교합니다.
        if (!item.getUser().getId().equals(user.getId())) {
            throw new SecurityException("자신의 장바구니 아이템만 수정할 수 있습니다.");
        }

        if (newQuantity < 1) {
            removeCartItem(username, cartItemId);
        } else {
            item.setQuantity(newQuantity);
            cartItemRepository.save(item);
        }
    }

    // 4. 장바구니 상품 삭제
    public void removeCartItem(String username, Long cartItemId) {
        User user = findUserByUsername(username);

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new IllegalArgumentException("장바구니 아이템을 찾을 수 없습니다."));

        // ⭐️ 보안: 해당 장바구니 아이템이 요청한 사용자의 것인지 확인 (user 객체 비교) ⭐️
        if (!item.getUser().getId().equals(user.getId())) {
            throw new SecurityException("자신의 장바구니 아이템만 삭제할 수 있습니다.");
        }

        cartItemRepository.delete(item);
    }
}