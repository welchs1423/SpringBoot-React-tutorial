package com.react.tutorial.Controller;

import com.react.tutorial.dto.CouponCreateRequest;
import com.react.tutorial.dto.CouponDTO;
import com.react.tutorial.entity.Coupon;
import com.react.tutorial.entity.User;
import com.react.tutorial.entity.UserCoupon;
import com.react.tutorial.exception.BusinessException;
import com.react.tutorial.repository.CouponRepository;
import com.react.tutorial.repository.UserCouponRepository;
import com.react.tutorial.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponRepository couponRepository;
    private final UserCouponRepository userCouponRepository;
    private final UserRepository userRepository;

    @GetMapping("/my")
    public ResponseEntity<List<CouponDTO>> getMyCoupons(@AuthenticationPrincipal User user) {
        List<CouponDTO> result = userCouponRepository.findAvailableByUserId(user.getId())
                .stream()
                .map(CouponDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<Coupon>> getAllCoupons() {
        return ResponseEntity.ok(couponRepository.findAll());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Coupon> createCoupon(@RequestBody CouponCreateRequest request) {
        Coupon coupon = new Coupon();
        coupon.setName(request.getName());
        coupon.setType(request.getType());
        coupon.setDiscountValue(request.getDiscountValue());
        coupon.setMinOrderAmount(request.getMinOrderAmount());
        coupon.setExpiryDate(request.getExpiryDate());
        return ResponseEntity.status(HttpStatus.CREATED).body(couponRepository.save(coupon));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{couponId}/issue/{userId}")
    @SuppressWarnings("null")
    public ResponseEntity<Void> issueCoupon(@PathVariable Long couponId, @PathVariable Long userId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new BusinessException("쿠폰을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        UserCoupon uc = new UserCoupon();
        uc.setUser(targetUser);
        uc.setCoupon(coupon);
        userCouponRepository.save(uc);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
