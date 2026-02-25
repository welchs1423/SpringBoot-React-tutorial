// backend/src/main/java/com/react/tutorial/Controller/ProductController.java

package com.react.tutorial.Controller;

import com.react.tutorial.dto.ProductDTO;
import com.react.tutorial.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products") // 기본 경로 설정
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    // 1. 상품 등록 (관리자만 가능)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductDTO> createProduct(@RequestBody ProductDTO dto) {
        System.out.println("✅ [1. 컨트롤러 도착] 프론트에서 넘어온 데이터: " + dto);

        ProductDTO newProduct = productService.create(dto);

        System.out.println("✅ [2. DB 저장 완료] 프론트로 돌려보낼 데이터: " + newProduct);

        return ResponseEntity.ok(newProduct);
    }

    // 2. 전체 상품 목록 조회 (모두 가능)
    @GetMapping
    public ResponseEntity<List<ProductDTO>> getAllProducts() {
        List<ProductDTO> products = productService.findAll();
        return ResponseEntity.ok(products);
    }

    // 3. 특정 상품 상세 조회 (모두 가능)
    @GetMapping("/{id}")
    public ResponseEntity<ProductDTO> getProductById(@PathVariable Long id) {
        ProductDTO product = productService.findById(id);
        return ResponseEntity.ok(product);
    }

    // 4. 상품 수정 (관리자만 가능)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')") // ⭐️ 관리자(ROLE_ADMIN) 권한 필요
    public ResponseEntity<ProductDTO> updateProduct(@PathVariable Long id, @RequestBody ProductDTO dto) {
        ProductDTO updatedProduct = productService.update(id, dto);
        return ResponseEntity.ok(updatedProduct);
    }

    // 5. 상품 삭제 (관리자만 가능)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')") // ⭐️ 관리자(ROLE_ADMIN) 권한 필요
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }
}