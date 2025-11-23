// com.react.tutorial.repository.CartItemRepository.java

package com.react.tutorial.repository;

import com.react.tutorial.entity.CartItem;
import com.react.tutorial.entity.Product;
import com.react.tutorial.entity.User; // ⭐️ User 엔티티 import ⭐️
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    Optional<CartItem> findByUserAndProduct(User user, Product product);

    List<CartItem> findAllByUser(User user);

}