package com.react.tutorial.Controller;

import com.react.tutorial.dto.StatisticsDTO;
import com.react.tutorial.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/statistics")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminStatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping("/daily")
    public ResponseEntity<StatisticsDTO> getDailyStatistics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        if (startDate == null) startDate = LocalDate.now().minusDays(29);
        if (endDate == null) endDate = LocalDate.now();

        return ResponseEntity.ok(statisticsService.getDailyStatistics(startDate, endDate));
    }

    @GetMapping("/monthly")
    public ResponseEntity<StatisticsDTO> getMonthlyStatistics(
            @RequestParam(required = false) Integer year) {

        if (year == null) year = LocalDate.now().getYear();

        return ResponseEntity.ok(statisticsService.getMonthlyStatistics(year));
    }
}
