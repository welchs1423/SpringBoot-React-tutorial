package com.react.tutorial.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class CouponCreateRequest {
    private String name;
    private CouponType type;
    private int discountValue;
    private int minOrderAmount;
    private LocalDate expiryDate;
}
