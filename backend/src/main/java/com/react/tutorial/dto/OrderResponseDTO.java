package com.react.tutorial.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponseDTO {
    private Long id;
    private String username;
    private LocalDateTime orderDate;
    private String receiverName;
    private String address;
    private String phoneNumber;
    private String paymentMethod;
    private int totalPrice;
    private String status;
    private List<OrderItemDTO> orderItems;
    private String cancelReason;
    private int couponDiscount;
    private int pointDiscount;
    private int finalAmount;
}
