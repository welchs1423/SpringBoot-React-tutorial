package com.react.tutorial.repository;

import com.react.tutorial.dto.OrderStatus;
import com.react.tutorial.entity.Order;
import com.react.tutorial.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("SELECT DISTINCT o FROM Order o " +
           "LEFT JOIN FETCH o.orderItems oi " +
           "LEFT JOIN FETCH oi.product " +
           "WHERE o.user = :user " +
           "ORDER BY o.orderDate DESC")
    List<Order> findByUserWithItems(@Param("user") User user);

    @Query("SELECT o FROM Order o " +
           "LEFT JOIN FETCH o.orderItems oi " +
           "LEFT JOIN FETCH oi.product " +
           "WHERE o.id = :id")
    Optional<Order> findByIdWithItems(@Param("id") Long id);

    @Query("SELECT DISTINCT o FROM Order o " +
           "LEFT JOIN FETCH o.orderItems oi " +
           "LEFT JOIN FETCH oi.product " +
           "ORDER BY o.orderDate DESC")
    List<Order> findAllWithItemsOrderByDateDesc();

    @Query("SELECT CASE WHEN COUNT(o) > 0 THEN true ELSE false END " +
           "FROM Order o JOIN o.orderItems oi " +
           "WHERE o.user.username = :username " +
           "AND oi.product.id = :productId " +
           "AND o.status = :status")
    boolean existsByUsernameAndProductIdAndStatus(
            @Param("username") String username,
            @Param("productId") Long productId,
            @Param("status") OrderStatus status);
}
