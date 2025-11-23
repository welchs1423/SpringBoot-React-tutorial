// com.react.tutorial.dto.CartItemDTO.java

package com.react.tutorial.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

// ⭐️ 클래스 레벨에 @Builder, @Getter, @NoArgsConstructor, @AllArgsConstructor 필수! ⭐️
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemDTO {

    // ⭐️ 1. 이 필드가 누락되었을 가능성이 높습니다. ⭐️
    // 장바구니 아이템의 고유 ID (조회 시 필요)
    private Long cartItemId;

    // 상품 ID (추가 시 필요)
    @NotNull(message = "상품 ID는 필수입니다.")
    private Long productId;

    // 상품 이름 (조회 시 필요)
    private String productName;

    // 상품 가격 (조회 시 필요)
    private int price;

    // 수량
    @Min(value = 1, message = "수량은 최소 1개 이상이어야 합니다.")
    private int quantity;
}