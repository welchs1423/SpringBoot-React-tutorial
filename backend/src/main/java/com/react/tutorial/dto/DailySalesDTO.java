package com.react.tutorial.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class DailySalesDTO {
    private String date;
    private Long totalAmount;
    private Long orderCount;
}
