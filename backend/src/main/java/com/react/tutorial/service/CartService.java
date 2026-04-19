package com.react.tutorial.service;

import com.react.tutorial.dto.CartItemDTO;
import com.react.tutorial.dto.CartSyncRequestDTO;
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

    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자(" + username + ")를 찾을 수 없습니다."));
    }

    // 로그인 시 로컬 장바구니를 DB에 병합 (같은 상품이면 수량 합산)
    public List<CartItemDTO> syncCart(String username, CartSyncRequestDTO request) {
        User user = findUserByUsername(username);

        if (request.getItems() != null) {
            for (CartSyncRequestDTO.CartSyncItemDTO syncItem : request.getItems()) {
                productRepository.findById(syncItem.getProductId()).ifPresent(product -> {
                    CartItem existing = cartItemRepository.findByUserAndProduct(user, product)
                            .orElseGet(() -> CartItem.builder()
                                    .user(user)
                                    .product(product)
                                    .quantity(0)
                                    .build());
                    existing.setQuantity(existing.getQuantity() + syncItem.getQuantity());
                    cartItemRepository.save(existing);
                });
            }
        }

        return getMyCart(username);
    }

    @SuppressWarnings("null")
    public void addItemToCart(String username, CartItemDTO cartItemDTO) {
        User user = findUserByUsername(username);
        Product product = productRepository.findById(cartItemDTO.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("상품 ID가 유효하지 않습니다: " + cartItemDTO.getProductId()));

        CartItem cartItem = cartItemRepository.findByUserAndProduct(user, product)
                .orElseGet(() -> CartItem.builder()
                        .user(user)
                        .product(product)
                        .quantity(0)
                        .build());

        cartItem.setQuantity(cartItem.getQuantity() + cartItemDTO.getQuantity());
        cartItemRepository.save(cartItem);
    }

    @Transactional(readOnly = true)
    public List<CartItemDTO> getMyCart(String username) {
        User user = findUserByUsername(username);
        List<CartItem> items = cartItemRepository.findAllByUser(user);

        return items.stream()
                .map(item -> CartItemDTO.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .productName(item.getProduct().getName())
                        .productPrice(item.getProduct().getPrice())
                        .quantity(item.getQuantity())
                        .build())
                .collect(Collectors.toList());
    }

    @SuppressWarnings("null")
    public void updateCartItemQuantity(String username, Long cartItemId, int newQuantity) {
        User user = findUserByUsername(username);

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new IllegalArgumentException("장바구니 아이템을 찾을 수 없습니다."));

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

    @SuppressWarnings("null")
    public void removeCartItem(String username, Long cartItemId) {
        User user = findUserByUsername(username);

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new IllegalArgumentException("장바구니 아이템을 찾을 수 없습니다."));

        if (!item.getUser().getId().equals(user.getId())) {
            throw new SecurityException("자신의 장바구니 아이템만 삭제할 수 있습니다.");
        }

        cartItemRepository.delete(item);
    }

    public void clearCart(String username) {
        User user = findUserByUsername(username);
        List<CartItem> items = cartItemRepository.findAllByUser(user);
        cartItemRepository.deleteAll(items);
    }
}
