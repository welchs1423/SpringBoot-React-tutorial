package com.react.tutorial.Controller;

import com.react.tutorial.dto.ReviewRequest;
import com.react.tutorial.dto.ReviewResponse;
import com.react.tutorial.entity.Review;
import com.react.tutorial.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<?> createReview(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ReviewRequest request){
        reviewService.saveReview(userDetails.getUsername(), request);
        return ResponseEntity.ok("리뷰가 등록되었습니다.");
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsByProduct(@PathVariable Long productId) {
        List<Review> reviews = reviewService.getReviewsByProductId(productId);
        int size = reviews.size();

        List<ReviewResponse> responseList = new ArrayList<>(size);

        // 지역 변수로 리스트를 할당해두고 접근하면 아주 미세하게나마 더 빠릅니다.
        for (int i = 0; i < size; i++) {
            responseList.add(new ReviewResponse(reviews.get(i)));
        }

        return ResponseEntity.ok(responseList);
    }
}
