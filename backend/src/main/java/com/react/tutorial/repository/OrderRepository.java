package com.react.tutorial.repository;

import com.react.tutorial.entity.Order;
import com.react.tutorial.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    /**
     * 유저의 주문 목록을 최신순으로 조회한다.
     * OrderItem과 Product를 한 번에 fetch해 N+1 쿼리를 방지한다.
     */
    @Query("SELECT DISTINCT o FROM Order o " +
           "LEFT JOIN FETCH o.orderItems oi " +
           "LEFT JOIN FETCH oi.product " +
           "WHERE o.user = :user " +
           "ORDER BY o.orderDate DESC")
    List<Order> findByUserWithItems(@Param("user") User user);

    /**
     * 단건 조회 시에도 OrderItem과 Product를 한 번에 fetch한다.
     */
    @Query("SELECT o FROM Order o " +
           "LEFT JOIN FETCH o.orderItems oi " +
           "LEFT JOIN FETCH oi.product " +
           "WHERE o.id = :id")
    Optional<Order> findByIdWithItems(@Param("id") Long id);
}
