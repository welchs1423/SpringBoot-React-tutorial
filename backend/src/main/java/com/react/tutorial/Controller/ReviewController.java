package com.react.tutorial.Controller;

import com.react.tutorial.dto.ReviewRequest;
import com.react.tutorial.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
