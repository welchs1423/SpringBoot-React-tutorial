package com.react.tutorial.service;

import com.react.tutorial.dto.ReviewRequest;
import com.react.tutorial.entity.*;
import com.react.tutorial.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional
    public void deleteReview(Long reviewId, String username) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("리뷰를 찾을 수 없습니다."));

        if(!review.getUser().getUsername().equals(username)){
            throw new RuntimeException("본인이 작성한 리뷰만 삭제할 수 있습니다.");
        }

        reviewRepository.delete(review);
    }
}
