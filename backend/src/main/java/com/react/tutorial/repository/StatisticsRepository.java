package com.react.tutorial.repository;

import com.react.tutorial.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface StatisticsRepository extends JpaRepository<Order, Long> {

    @Query(value =
        "SELECT CONCAT(YEAR(o.order_date), '-', LPAD(MONTH(o.order_date), 2, '0'), '-', LPAD(DAY(o.order_date), 2, '0')) AS date, " +
        "       SUM(o.final_amount) AS totalAmount, " +
        "       COUNT(o.id) AS orderCount " +
        "FROM orders o " +
        "WHERE o.status IN :statuses " +
        "  AND o.order_date BETWEEN :start AND :end " +
        "GROUP BY YEAR(o.order_date), MONTH(o.order_date), DAY(o.order_date) " +
        "ORDER BY YEAR(o.order_date), MONTH(o.order_date), DAY(o.order_date) ASC",
        nativeQuery = true)
    List<Object[]> findDailySalesRaw(
            @Param("statuses") List<String> statuses,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query(value =
        "SELECT CONCAT(YEAR(o.order_date), '-', LPAD(MONTH(o.order_date), 2, '0')) AS sale_month, " +
        "       SUM(o.final_amount) AS totalAmount, " +
        "       COUNT(o.id) AS orderCount " +
        "FROM orders o " +
        "WHERE o.status IN :statuses " +
        "  AND o.order_date BETWEEN :start AND :end " +
        "GROUP BY YEAR(o.order_date), MONTH(o.order_date) " +
        "ORDER BY YEAR(o.order_date), MONTH(o.order_date) ASC",
        nativeQuery = true)
    List<Object[]> findMonthlySalesRaw(
            @Param("statuses") List<String> statuses,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query(value =
        "SELECT p.category, " +
        "       SUM(oi.order_price * oi.quantity) AS totalAmount, " +
        "       SUM(oi.quantity) AS itemCount " +
        "FROM order_item oi " +
        "JOIN product p ON oi.product_id = p.id " +
        "JOIN orders o ON oi.order_id = o.id " +
        "WHERE o.status IN :statuses " +
        "  AND o.order_date BETWEEN :start AND :end " +
        "GROUP BY p.category " +
        "ORDER BY SUM(oi.order_price * oi.quantity) DESC",
        nativeQuery = true)
    List<Object[]> findCategorySalesRaw(
            @Param("statuses") List<String> statuses,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
