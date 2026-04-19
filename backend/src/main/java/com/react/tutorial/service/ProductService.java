package com.react.tutorial.service;

import com.react.tutorial.dto.ProductDTO;
import com.react.tutorial.entity.Product;
import com.react.tutorial.entity.Review;
import com.react.tutorial.repository.ProductRepository;
import com.react.tutorial.specification.ProductSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    private ProductDTO toDTO(Product entity) {
        double avg = entity.getReviews().isEmpty() ? 0
                : entity.getReviews().stream().mapToInt(Review::getRating).average().orElse(0);
        return ProductDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .price(entity.getPrice())
                .stockQuantity(entity.getStockQuantity())
                .description(entity.getDescription())
                .imageUrl(entity.getImageUrl())
                .category(entity.getCategory())
                .averageRating(avg)
                .build();
    }

    private Product toEntity(ProductDTO dto) {
        return Product.builder()
                .id(dto.getId())
                .name(dto.getName())
                .price(dto.getPrice())
                .stockQuantity(dto.getStockQuantity())
                .description(dto.getDescription())
                .imageUrl(dto.getImageUrl())
                .category(dto.getCategory())
                .build();
    }

    @CacheEvict(value = "products", allEntries = true)
    @Transactional
    public ProductDTO create(ProductDTO dto) {
        Product product = toEntity(dto);
        product.setId(null);
        Product savedProduct = productRepository.save(product);
        return toDTO(savedProduct);
    }

    @Cacheable(value = "products", key = "'all'")
    @Transactional(readOnly = true)
    public List<ProductDTO> findAll() {
        return productRepository.findAll().stream()
                .filter(product -> !product.isDeleted())
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<ProductDTO> search(String keyword, String category, Integer priceMin, Integer priceMax,
                                   String sort, int page, int size) {
        Specification<Product> spec = ProductSpecification.filter(keyword, category, priceMin, priceMax);

        if ("rating".equals(sort)) {
            List<Product> all = productRepository.findAll(spec);
            List<ProductDTO> sorted = all.stream()
                    .map(this::toDTO)
                    .sorted(Comparator.comparingDouble(ProductDTO::getAverageRating).reversed())
                    .collect(Collectors.toList());
            int total = sorted.size();
            int from = Math.min(page * size, total);
            int to = Math.min(from + size, total);
            List<ProductDTO> subList = new java.util.ArrayList<>(sorted.subList(from, to));
            return new PageImpl<>(subList, PageRequest.of(page, size), total);
        }

        Sort sortObj = switch (sort) {
            case "priceAsc" -> Sort.by("price").ascending();
            case "priceDesc" -> Sort.by("price").descending();
            default -> Sort.by("createdAt").descending();
        };
        Pageable pageable = PageRequest.of(page, size, sortObj);
        return productRepository.findAll(spec, pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("null")
    public ProductDTO findById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid product ID: " + id));
        return toDTO(product);
    }

    @CacheEvict(value = "products", allEntries = true)
    @Transactional
    @SuppressWarnings("null")
    public ProductDTO update(Long id, ProductDTO dto) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid product ID: " + id));

        if (dto.getImageUrl() != null && !dto.getImageUrl().equals(product.getImageUrl())) {
            deleteImageFile(product.getImageUrl());
            product.setImageUrl(dto.getImageUrl());
        }

        product.setName(dto.getName());
        product.setPrice(dto.getPrice());
        product.setStockQuantity(dto.getStockQuantity());
        product.setDescription(dto.getDescription());
        product.setCategory(dto.getCategory());

        Product updatedProduct = productRepository.save(product);
        return toDTO(updatedProduct);
    }

    @CacheEvict(value = "products", allEntries = true)
    @Transactional
    @SuppressWarnings("null")
    public void delete(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("상품 없음"));

        product.setDeleted(true);
        deleteImageFile(product.getImageUrl());
        product.setImageUrl(null);
    }

    private void deleteImageFile(String imageUrl) {
        if (imageUrl == null || !imageUrl.startsWith("/uploads/")) {
            return;
        }
        try {
            String filename = imageUrl.substring("/uploads/".length());
            Path filePath = Paths.get("uploads", filename);
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                System.out.println("기존 찌꺼기 이미지 파일 삭제 완료: " + filename);
            }
        } catch (Exception e) {
            System.err.println("이미지 파일 삭제 실패: " + e.getMessage());
        }
    }
}
