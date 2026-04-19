package com.react.tutorial.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WishlistDTO {
    private Long productId;
    private String productName;
    private int price;
    private String imageUrl;
    private boolean wishlisted;
}
