package com.react.tutorial.service;

import com.react.tutorial.dto.ProductDTO;
import com.react.tutorial.entity.Product;
import com.react.tutorial.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    // Entity를 DTO로 변환하는 헬퍼 메서드
    private ProductDTO toDTO(Product entity) {
        return ProductDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .price(entity.getPrice())
                .stockQuantity(entity.getStockQuantity())
                .description(entity.getDescription())
                .build();
    }

    // DTO를 Entity로 변환하는 헬퍼 메서드
    private Product toEntity(ProductDTO dto) {
        return Product.builder()
                .id(dto.getId())
                .name(dto.getName())
                .price(dto.getPrice())
                .stockQuantity(dto.getStockQuantity())
                .description(dto.getDescription())
                .build();
    }

    // 1. 상품 등록 (관리자 권한 필요)
    @Transactional
    public ProductDTO create(ProductDTO dto) {
        // ID가 있다면 등록이 아닌 수정으로 간주될 수 있으므로, ID는 제거하고 등록
        Product product = toEntity(dto);
        product.setId(null);
        Product savedProduct = productRepository.save(product);
        return toDTO(savedProduct);
    }

    // 2. 전체 상품 목록 조회
    public List<ProductDTO> findAll() {
        return productRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // 3. 특정 상품 상세 조회
    public ProductDTO findById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid product ID: " + id));
        return toDTO(product);
    }

    // 4. 상품 수정 (관리자 권한 필요)
    @Transactional
    public ProductDTO update(Long id, ProductDTO dto) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid product ID: " + id));

        // 데이터 업데이트
        product.setName(dto.getName());
        product.setPrice(dto.getPrice());
        product.setStockQuantity(dto.getStockQuantity());
        product.setDescription(dto.getDescription());

        // save는 영속성 컨텍스트에 의해 update 역할을 수행함
        Product updatedProduct = productRepository.save(product);
        return toDTO(updatedProduct);
    }

    // 5. 상품 삭제 (관리자 권한 필요)
    @Transactional
    public void delete(Long id) {
        productRepository.deleteById(id);
    }
}