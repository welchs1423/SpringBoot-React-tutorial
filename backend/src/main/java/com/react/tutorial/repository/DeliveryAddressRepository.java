package com.react.tutorial.repository;

import com.react.tutorial.entity.DeliveryAddress;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeliveryAddressRepository extends JpaRepository<DeliveryAddress, Long> {
}
