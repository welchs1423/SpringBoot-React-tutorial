package com.react.tutorial.repository;

import com.react.tutorial.entity.Order;
import com.react.tutorial.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserOrderByOrderDateDesc(User User);
}
