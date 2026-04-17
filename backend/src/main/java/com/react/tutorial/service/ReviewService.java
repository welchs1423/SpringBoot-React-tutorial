package com.react.tutorial.service;

import com.react.tutorial.dto.OrderStatus;
import com.react.tutorial.dto.ReviewRequest;
import com.react.tutorial.entity.*;
import com.react.tutorial.exception.BusinessException;
import com.react.tutorial.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    @Transactional
    @SuppressWarnings("null")
    public void saveReview(String username, ReviewRequest request){
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("사용자 없음", HttpStatus.NOT_FOUND));
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new BusinessException("상품 없음", HttpStatus.NOT_FOUND));

        boolean hasPurchased = orderRepository.existsByUsernameAndProductIdAndStatus(
                username, request.getProductId(), OrderStatus.DELIVERED);
        if (!hasPurchased) {
            throw new BusinessException("배송 완료된 주문이 있어야 리뷰를 작성할 수 있습니다.", HttpStatus.FORBIDDEN);
        }

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
    @SuppressWarnings("null")
    public void deleteReview(Long reviewId, String username) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("리뷰가 존재하지 않습니다."));

        if (!review.getUser().getUsername().equals(username)) {
            throw new RuntimeException("삭제 권한이 없습니다.");
        }

        reviewRepository.delete(review);
    }

    @Transactional
    @SuppressWarnings("null")
    public void updateReview(Long reviewId, String username, String content, int rating){
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("리뷰가 존재하지 않습니다."));

        if(!review.getUser().getUsername().equals(username)){
            throw new RuntimeException("수정 권한이 없습니다.");
        }

        review.setContent(content);
        review.setRating(rating);
    }
}
