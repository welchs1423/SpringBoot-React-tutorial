package com.react.tutorial;

import com.react.tutorial.config.TestRedisConfig;
import com.react.tutorial.dto.CategorySalesDTO;
import com.react.tutorial.dto.DailySalesDTO;
import com.react.tutorial.dto.MonthlySalesDTO;
import com.react.tutorial.dto.OrderStatus;
import com.react.tutorial.dto.StatisticsDTO;
import com.react.tutorial.entity.Order;
import com.react.tutorial.entity.OrderItem;
import com.react.tutorial.entity.Product;
import com.react.tutorial.entity.User;
import com.react.tutorial.repository.OrderRepository;
import com.react.tutorial.repository.ProductRepository;
import com.react.tutorial.repository.UserRepository;
import com.react.tutorial.service.StatisticsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Import(TestRedisConfig.class)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class StatisticsServiceTest {

    @Autowired
    private StatisticsService statisticsService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    private User testUser;
    private Product productA;
    private Product productB;

    @BeforeEach
    void setUp() {
        testUser = userRepository.save(User.builder()
                .username("stats_test_user")
                .password("password")
                .role("ROLE_USER")
                .points(0)
                .build());

        productA = productRepository.save(Product.builder()
                .name("전자제품A")
                .price(10000)
                .stockQuantity(100)
                .category("전자제품")
                .build());

        productB = productRepository.save(Product.builder()
                .name("의류B")
                .price(5000)
                .stockQuantity(100)
                .category("의류")
                .build());
    }

    private Order createOrder(User user, OrderStatus status, LocalDateTime orderDate,
                              int finalAmount, List<OrderItem> items) {
        Order order = new Order();
        order.setUser(user);
        order.setStatus(status);
        order.setOrderDate(orderDate);
        order.setTotalAmount(finalAmount);
        order.setFinalAmount(finalAmount);
        order.setReceiverName("테스터");
        order.setAddress("서울시 강남구");
        order.setPhoneNumber("010-0000-0000");
        order = orderRepository.save(order);

        for (OrderItem item : items) {
            item.setOrder(order);
            order.getOrderItems().add(item);
        }
        return orderRepository.save(order);
    }

    private OrderItem makeItem(Product product, int price, int qty) {
        OrderItem item = new OrderItem();
        item.setProduct(product);
        item.setOrderPrice(price);
        item.setQuantity(qty);
        return item;
    }

    @Test
    @Transactional
    void 일별_매출_집계가_정확히_계산된다() {
        LocalDateTime today = LocalDate.now().atStartOfDay().plusHours(10);
        LocalDateTime yesterday = today.minusDays(1);

        createOrder(testUser, OrderStatus.PAID, today, 30000,
                List.of(makeItem(productA, 10000, 2), makeItem(productB, 5000, 2)));
        createOrder(testUser, OrderStatus.PAID, yesterday, 20000,
                List.of(makeItem(productA, 10000, 1), makeItem(productB, 5000, 2)));

        StatisticsDTO result = statisticsService.getDailyStatistics(
                LocalDate.now().minusDays(7), LocalDate.now());

        assertThat(result.getDailySales()).isNotEmpty();
        long totalAmount = result.getDailySales().stream()
                .mapToLong(DailySalesDTO::getTotalAmount)
                .sum();
        assertThat(totalAmount).isEqualTo(50000L);
    }

    @Test
    @Transactional
    void 취소된_주문은_매출에서_제외된다() {
        LocalDateTime today = LocalDate.now().atStartOfDay().plusHours(10);

        createOrder(testUser, OrderStatus.PAID, today, 30000,
                List.of(makeItem(productA, 10000, 3)));
        createOrder(testUser, OrderStatus.CANCELED, today, 20000,
                List.of(makeItem(productB, 5000, 4)));

        StatisticsDTO result = statisticsService.getDailyStatistics(
                LocalDate.now().minusDays(1), LocalDate.now());

        long totalAmount = result.getDailySales().stream()
                .mapToLong(DailySalesDTO::getTotalAmount)
                .sum();
        assertThat(totalAmount).isEqualTo(30000L);
    }

    @Test
    @Transactional
    void 카테고리별_판매_비율이_정확히_집계된다() {
        LocalDateTime today = LocalDate.now().atStartOfDay().plusHours(10);

        createOrder(testUser, OrderStatus.PAID, today, 50000,
                List.of(makeItem(productA, 10000, 3), makeItem(productB, 5000, 4)));

        StatisticsDTO result = statisticsService.getDailyStatistics(
                LocalDate.now().minusDays(1), LocalDate.now());

        assertThat(result.getCategorySales()).isNotEmpty();

        CategorySalesDTO electronics = result.getCategorySales().stream()
                .filter(c -> "전자제품".equals(c.getCategory()))
                .findFirst()
                .orElseThrow();
        assertThat(electronics.getTotalAmount()).isEqualTo(30000L);

        CategorySalesDTO clothing = result.getCategorySales().stream()
                .filter(c -> "의류".equals(c.getCategory()))
                .findFirst()
                .orElseThrow();
        assertThat(clothing.getTotalAmount()).isEqualTo(20000L);
    }

    @Test
    @Transactional
    void 월별_매출_집계가_연도별로_정확히_계산된다() {
        int year = LocalDate.now().getYear();
        LocalDateTime jan = LocalDateTime.of(year, 1, 15, 10, 0);
        LocalDateTime mar = LocalDateTime.of(year, 3, 10, 10, 0);

        createOrder(testUser, OrderStatus.PAID, jan, 15000,
                List.of(makeItem(productA, 15000, 1)));
        createOrder(testUser, OrderStatus.DELIVERED, mar, 25000,
                List.of(makeItem(productB, 5000, 5)));

        StatisticsDTO result = statisticsService.getMonthlyStatistics(year);

        assertThat(result.getMonthlySales()).isNotEmpty();
        long total = result.getMonthlySales().stream()
                .mapToLong(MonthlySalesDTO::getTotalAmount)
                .sum();
        assertThat(total).isEqualTo(40000L);
    }

    @Test
    @Transactional
    void 주문건수가_정확히_집계된다() {
        LocalDateTime today = LocalDate.now().atStartOfDay().plusHours(10);

        createOrder(testUser, OrderStatus.PAID, today, 10000,
                List.of(makeItem(productA, 10000, 1)));
        createOrder(testUser, OrderStatus.SHIPPING, today, 5000,
                List.of(makeItem(productB, 5000, 1)));

        StatisticsDTO result = statisticsService.getDailyStatistics(
                LocalDate.now().minusDays(1), LocalDate.now());

        long totalOrders = result.getDailySales().stream()
                .mapToLong(DailySalesDTO::getOrderCount)
                .sum();
        assertThat(totalOrders).isEqualTo(2L);
    }
}
