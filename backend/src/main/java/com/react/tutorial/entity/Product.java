package com.react.tutorial.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "product")
public class Product extends BaseEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 상품 이름
    @Column(nullable = false)
    private String name;

    // 상품 가격
    @Column(nullable = false)
    private int price;

    // 상품 재고 수량
    @Column(nullable = false)
    private int stockQuantity;

    // 상품 설명
    @Column(length = 1000)
    private String description;

    @Column(length = 500)
    private String imageUrl;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Review> reviews = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CartItem> cartItems = new ArrayList<>();

    private boolean isDeleted = false;
}