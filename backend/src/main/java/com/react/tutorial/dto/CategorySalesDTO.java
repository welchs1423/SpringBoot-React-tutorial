package com.react.tutorial.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CategorySalesDTO {
    private String category;
    private Long totalAmount;
    private Long itemCount;
}
