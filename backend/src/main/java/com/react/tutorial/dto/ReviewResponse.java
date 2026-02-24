package com.react.tutorial.dto;

import com.react.tutorial.entity.Review;
import lombok.Getter;

@Getter
public class ReviewResponse {
    private Long id;
    private String content;
    private String username;
    private int rating;

    public ReviewResponse(Review review) {
        this.id = review.getId();
        this.content = review.getContent();
        this.username = review.getUser().getUsername();
        this.rating = review.getRating();
    }
}