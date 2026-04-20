package com.react.tutorial.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatisticsDTO {
    private List<DailySalesDTO> dailySales;
    private List<MonthlySalesDTO> monthlySales;
    private List<CategorySalesDTO> categorySales;
}
