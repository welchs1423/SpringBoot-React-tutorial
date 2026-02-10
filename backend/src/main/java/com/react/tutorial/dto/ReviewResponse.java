package com.react.tutorial.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import com.react.tutorial.entity.Review;

@Getter
@NoArgsConstructor
public class ReviewResponse {
    private Long id;
    private String content;
    private int rating;
    private String username;

    public ReviewResponse(Review review){
        this.id = review.getId();
        this.content = review.getContent();
        this.rating = review.getRating();
        this.username = (review.getUser() != null) ? review.getUser().getUsername() : "익명";
    }
}
