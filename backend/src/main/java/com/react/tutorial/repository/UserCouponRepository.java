package com.react.tutorial.repository;

import com.react.tutorial.entity.UserCoupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserCouponRepository extends JpaRepository<UserCoupon, Long> {

    @Query("SELECT uc FROM UserCoupon uc JOIN FETCH uc.coupon WHERE uc.user.id = :userId AND uc.used = false AND uc.coupon.active = true")
    List<UserCoupon> findAvailableByUserId(@Param("userId") Long userId);
}
