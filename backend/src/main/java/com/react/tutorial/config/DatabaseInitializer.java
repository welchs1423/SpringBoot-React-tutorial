package com.react.tutorial.config;

import com.react.tutorial.dto.CouponType;
import com.react.tutorial.entity.Coupon;
import com.react.tutorial.entity.User;
import com.react.tutorial.repository.CouponRepository;
import com.react.tutorial.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class DatabaseInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CouponRepository couponRepository;

    @Override
    @SuppressWarnings("null")
    public void run(String... args) throws Exception {
        if (userRepository.findByUsername("admin").isEmpty()) {
            User adminUser = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("adminpass"))
                    .role("ROLE_ADMIN")
                    .build();
            userRepository.save(adminUser);
            System.out.println("--- 관리자 계정 'admin'이 생성되었습니다. ---");
        }

        if (couponRepository.count() == 0) {
            Coupon fixed = new Coupon();
            fixed.setName("신규가입 5000원 할인");
            fixed.setType(CouponType.FIXED);
            fixed.setDiscountValue(5000);
            fixed.setMinOrderAmount(20000);
            fixed.setExpiryDate(LocalDate.now().plusYears(1));
            couponRepository.save(fixed);

            Coupon percent = new Coupon();
            percent.setName("10% 할인 쿠폰");
            percent.setType(CouponType.PERCENTAGE);
            percent.setDiscountValue(10);
            percent.setMinOrderAmount(10000);
            percent.setExpiryDate(LocalDate.now().plusYears(1));
            couponRepository.save(percent);

            System.out.println("--- 샘플 쿠폰 2종이 생성되었습니다. ---");
        }
    }
}
