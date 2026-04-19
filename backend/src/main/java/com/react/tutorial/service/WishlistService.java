package com.react.tutorial.service;

import com.react.tutorial.dto.WishlistDTO;
import com.react.tutorial.entity.Product;
import com.react.tutorial.entity.User;
import com.react.tutorial.entity.Wishlist;
import com.react.tutorial.repository.ProductRepository;
import com.react.tutorial.repository.UserRepository;
import com.react.tutorial.repository.WishlistRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class WishlistService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final WishlistRepository wishlistRepository;

    public WishlistService(UserRepository userRepository,
                           ProductRepository productRepository,
                           WishlistRepository wishlistRepository) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.wishlistRepository = wishlistRepository;
    }

    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자(" + username + ")를 찾을 수 없습니다."));
    }

    // 찜하기 토글 - 찜 상태이면 해제, 아니면 추가
    @SuppressWarnings("null")
    public boolean toggle(String username, Long productId) {
        User user = findUserByUsername(username);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품 ID가 유효하지 않습니다: " + productId));

        return wishlistRepository.findByUserAndProduct(user, product)
                .map(existing -> {
                    wishlistRepository.delete(existing);
                    return false;
                })
                .orElseGet(() -> {
                    wishlistRepository.save(Wishlist.builder().user(user).product(product).build());
                    return true;
                });
    }

    @Transactional(readOnly = true)
    public List<WishlistDTO> getWishlist(String username) {
        User user = findUserByUsername(username);
        return wishlistRepository.findByUser(user).stream()
                .map(w -> WishlistDTO.builder()
                        .productId(w.getProduct().getId())
                        .productName(w.getProduct().getName())
                        .price(w.getProduct().getPrice())
                        .imageUrl(w.getProduct().getImageUrl())
                        .wishlisted(true)
                        .build())
                .collect(Collectors.toList());
    }

    @SuppressWarnings("null")
    @Transactional(readOnly = true)
    public boolean isWishlisted(String username, Long productId) {
        User user = findUserByUsername(username);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품 ID가 유효하지 않습니다: " + productId));
        return wishlistRepository.existsByUserAndProduct(user, product);
    }
}
