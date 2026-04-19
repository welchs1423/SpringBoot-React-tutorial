package com.react.tutorial.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDTO {

    private Long id;
    private String name;
    private int price;
    private int stockQuantity;
    private String description;

    @JsonProperty("imageUrl")
    private String imageUrl;

    private String category;

    private double averageRating;
}