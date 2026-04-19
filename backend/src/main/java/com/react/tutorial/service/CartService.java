package com.react.tutorial.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.react.tutorial.dto.CartItemDTO;
import com.react.tutorial.dto.CartSyncRequestDTO;
import com.react.tutorial.entity.Product;
import com.react.tutorial.repository.ProductRepository;
import com.react.tutorial.repository.UserRepository;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@SuppressWarnings("null")
@Service
public class CartService {

    private static final String CART_KEY_PREFIX = "cart:";
    private static final Duration CART_TTL = Duration.ofDays(7);

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    public CartService(UserRepository userRepository, ProductRepository productRepository,
                       StringRedisTemplate stringRedisTemplate, ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.stringRedisTemplate = stringRedisTemplate;
        this.objectMapper = objectMapper;
    }

    private String cartKey(String username) {
        return CART_KEY_PREFIX + username;
    }

    private void verifyUser(String username) {
        userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자(" + username + ")를 찾을 수 없습니다."));
    }

    private HashOperations<String, String, String> hashOps() {
        return stringRedisTemplate.opsForHash();
    }

    private String serialize(CartItemDTO dto) {
        try {
            return objectMapper.writeValueAsString(dto);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("장바구니 직렬화 실패", e);
        }
    }

    private CartItemDTO deserialize(String json) {
        try {
            return objectMapper.readValue(json, CartItemDTO.class);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("장바구니 역직렬화 실패", e);
        }
    }

    private CartItemDTO buildItem(Product product, int quantity) {
        return CartItemDTO.builder()
                .id(product.getId())
                .productId(product.getId())
                .productName(product.getName())
                .productPrice(product.getPrice())
                .quantity(quantity)
                .build();
    }

    public List<CartItemDTO> syncCart(String username, CartSyncRequestDTO request) {
        verifyUser(username);

        if (request.getItems() != null) {
            String key = cartKey(username);
            for (CartSyncRequestDTO.CartSyncItemDTO syncItem : request.getItems()) {
                Long productId = syncItem.getProductId();
                if (productId == null) continue;

                productRepository.findById(productId).ifPresent(product -> {
                    String field = String.valueOf(product.getId());
                    String existing = hashOps().get(key, field);
                    int currentQty = existing != null ? deserialize(existing).getQuantity() : 0;
                    hashOps().put(key, field, serialize(buildItem(product, currentQty + syncItem.getQuantity())));
                });
            }
            stringRedisTemplate.expire(key, CART_TTL);
        }

        return getMyCart(username);
    }

    public void addItemToCart(String username, CartItemDTO dto) {
        verifyUser(username);

        Long productId = Objects.requireNonNull(dto.getProductId(), "상품 ID는 필수입니다.");
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품 ID가 유효하지 않습니다: " + productId));

        String key = cartKey(username);
        String field = String.valueOf(productId);
        String existing = hashOps().get(key, field);
        int currentQty = existing != null ? deserialize(existing).getQuantity() : 0;

        hashOps().put(key, field, serialize(buildItem(product, currentQty + dto.getQuantity())));
        stringRedisTemplate.expire(key, CART_TTL);
    }

    public List<CartItemDTO> getMyCart(String username) {
        verifyUser(username);

        Map<String, String> entries = hashOps().entries(cartKey(username));
        List<CartItemDTO> result = new ArrayList<>();
        for (String json : entries.values()) {
            result.add(deserialize(json));
        }
        return result;
    }

    public void updateCartItemQuantity(String username, Long cartItemId, int newQuantity) {
        verifyUser(username);

        String key = cartKey(username);
        String field = String.valueOf(cartItemId);
        String existing = hashOps().get(key, field);
        if (existing == null) {
            throw new IllegalArgumentException("장바구니 아이템을 찾을 수 없습니다.");
        }

        if (newQuantity < 1) {
            removeCartItem(username, cartItemId);
        } else {
            CartItemDTO current = deserialize(existing);
            CartItemDTO updated = CartItemDTO.builder()
                    .id(current.getId())
                    .productId(current.getProductId())
                    .productName(current.getProductName())
                    .productPrice(current.getProductPrice())
                    .quantity(newQuantity)
                    .build();
            hashOps().put(key, field, serialize(updated));
            stringRedisTemplate.expire(key, CART_TTL);
        }
    }

    public void removeCartItem(String username, Long cartItemId) {
        verifyUser(username);
        hashOps().delete(cartKey(username), String.valueOf(cartItemId));
    }

    public void clearCart(String username) {
        verifyUser(username);
        stringRedisTemplate.delete(cartKey(username));
    }
}
