package com.react.tutorial.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ReviewRequest {
    private Long productId;
    private String content;
    private int rating;
}
