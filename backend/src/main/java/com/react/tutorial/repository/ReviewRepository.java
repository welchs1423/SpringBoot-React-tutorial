package com.react.tutorial.repository;

import com.react.tutorial.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    @Query("select r from Review r join fetch r.user where r.product.id = :productId")
    List<Review> findAllByProductIdWithUser(@Param("productId") Long productId);
}
