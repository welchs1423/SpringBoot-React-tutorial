package com.react.tutorial.service;

import com.react.tutorial.dto.CategorySalesDTO;
import com.react.tutorial.dto.DailySalesDTO;
import com.react.tutorial.dto.MonthlySalesDTO;
import com.react.tutorial.dto.OrderStatus;
import com.react.tutorial.dto.StatisticsDTO;
import com.react.tutorial.repository.StatisticsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatisticsService {

    private final StatisticsRepository statisticsRepository;

    private static final List<String> PAID_STATUSES = List.of(
            OrderStatus.PAID.name(),
            OrderStatus.SHIPPING.name(),
            OrderStatus.DELIVERED.name());

    public StatisticsDTO getDailyStatistics(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        List<DailySalesDTO> dailySales = statisticsRepository
                .findDailySalesRaw(PAID_STATUSES, start, end)
                .stream()
                .map(row -> new DailySalesDTO(
                        (String) row[0],
                        toLong(row[1]),
                        toLong(row[2])))
                .collect(Collectors.toList());

        List<CategorySalesDTO> categorySales = statisticsRepository
                .findCategorySalesRaw(PAID_STATUSES, start, end)
                .stream()
                .map(row -> new CategorySalesDTO(
                        (String) row[0],
                        toLong(row[1]),
                        toLong(row[2])))
                .collect(Collectors.toList());

        return StatisticsDTO.builder()
                .dailySales(dailySales)
                .categorySales(categorySales)
                .build();
    }

    public StatisticsDTO getMonthlyStatistics(int year) {
        LocalDateTime start = LocalDate.of(year, 1, 1).atStartOfDay();
        LocalDateTime end = LocalDate.of(year, 12, 31).atTime(LocalTime.MAX);

        List<MonthlySalesDTO> monthlySales = statisticsRepository
                .findMonthlySalesRaw(PAID_STATUSES, start, end)
                .stream()
                .map(row -> new MonthlySalesDTO(
                        row[0] != null ? row[0].toString() : null,
                        toLong(row[1]),
                        toLong(row[2])))
                .collect(Collectors.toList());

        List<CategorySalesDTO> categorySales = statisticsRepository
                .findCategorySalesRaw(PAID_STATUSES, start, end)
                .stream()
                .map(row -> new CategorySalesDTO(
                        (String) row[0],
                        toLong(row[1]),
                        toLong(row[2])))
                .collect(Collectors.toList());

        return StatisticsDTO.builder()
                .monthlySales(monthlySales)
                .categorySales(categorySales)
                .build();
    }

    private long toLong(Object val) {
        if (val == null) return 0L;
        if (val instanceof Long l) return l;
        if (val instanceof BigDecimal bd) return bd.longValue();
        if (val instanceof Number n) return n.longValue();
        return Long.parseLong(val.toString());
    }
}
