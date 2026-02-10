package com.react.tutorial.service;

import com.react.tutorial.dto.ReviewRequest;
import com.react.tutorial.entity.*;
import com.react.tutorial.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional
    public void saveReview(String username, ReviewRequest request){
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자 없음"));
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("상품 없음"));

        Review review = new Review();
        review.setUser(user);
        review.setProduct(product);
        review.setContent(request.getContent());
        review.setRating(request.getRating());

        reviewRepository.save(review);
    }

    public List<Review> getReviewsByProductId(Long productId) {
        return reviewRepository.findAllByProductIdWithUser(productId);
    }
}
