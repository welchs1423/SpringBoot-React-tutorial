package com.react.tutorial.dto;

import com.react.tutorial.entity.UserCoupon;
import lombok.Getter;

@Getter
public class CouponDTO {

    private final Long userCouponId;
    private final String name;
    private final String type;
    private final int discountValue;
    private final int minOrderAmount;
    private final String expiryDate;

    public CouponDTO(UserCoupon uc) {
        this.userCouponId = uc.getId();
        this.name = uc.getCoupon().getName();
        this.type = uc.getCoupon().getType().name();
        this.discountValue = uc.getCoupon().getDiscountValue();
        this.minOrderAmount = uc.getCoupon().getMinOrderAmount();
        this.expiryDate = uc.getCoupon().getExpiryDate() != null
                ? uc.getCoupon().getExpiryDate().toString() : null;
    }
}
