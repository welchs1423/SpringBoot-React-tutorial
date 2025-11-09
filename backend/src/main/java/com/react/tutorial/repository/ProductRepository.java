// backend/src/main/java/com/react/tutorial/repository/ProductRepository.java

package com.react.tutorial.repository;

import com.react.tutorial.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
}