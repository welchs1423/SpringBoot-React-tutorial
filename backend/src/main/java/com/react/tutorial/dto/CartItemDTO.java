package com.react.tutorial.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;

    @NotNull(message = "상품 ID는 필수입니다.")
    private Long productId;

    private String productName;

    private int productPrice;

    @Min(value = 1, message = "수량은 최소 1개 이상이어야 합니다.")
    private int quantity;
}