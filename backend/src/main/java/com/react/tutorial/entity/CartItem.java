// com.react.tutorial.entity.CartItem.java

package com.react.tutorial.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Table(name = "cart_items")
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ⭐️ 수정: Long userId 대신 User 엔티티와 ManyToOne 관계를 맺습니다. ⭐️
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private int quantity;

    // 편의 메서드: 수량 증가/감소 시 사용
    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }
}