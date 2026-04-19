package com.react.tutorial.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CartSyncRequestDTO {
    private List<CartSyncItemDTO> items;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CartSyncItemDTO {
        private Long productId;
        private int quantity;
    }
}
