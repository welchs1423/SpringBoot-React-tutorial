package com.react.tutorial.repository;

import com.react.tutorial.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    // 특정 상품의 리뷰들만 가져오는 기능
    List<Review> findByProductId(Long productID);
}
