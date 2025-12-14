package com.react.tutorial.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor; // ⭐️ 추가
import lombok.AllArgsConstructor; // ⭐️ 추가

@Entity
@Table(name = "delivery_address")
@Getter
@Setter
@NoArgsConstructor // ⭐️ JPA를 위한 기본 생성자
@AllArgsConstructor // ⭐️ 모든 필드를 포함하는 생성자 (선택 사항이지만 유용함)
public class DeliveryAddress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // 배송지 고유 ID

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String receiverName;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private String phoneNumber;

    private boolean isDefault = false;
}