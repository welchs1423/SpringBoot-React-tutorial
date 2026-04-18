package com.react.tutorial.service;

import com.react.tutorial.dto.*;
import com.react.tutorial.entity.*;
import com.react.tutorial.exception.BusinessException;
import com.react.tutorial.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final DeliveryAddressRepository deliveryAddressRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final UserCouponRepository userCouponRepository;

    @Transactional
    public Order createOrder(User user, OrderRequest request) {
        User freshUser = userRepository.findById(Objects.requireNonNull(user.getId()))
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        DeliveryAddress address = resolveDeliveryAddress(freshUser, request);
        List<CartItem> cartItems = cartItemRepository.findAllByUser(freshUser);

        if (cartItems.isEmpty()) {
            throw new BusinessException("장바구니가 비어 있어 주문을 생성할 수 없습니다.", HttpStatus.BAD_REQUEST);
        }

        List<OrderItem> orderItems = buildOrderItems(cartItems);

        int totalAmount = 0;
        for (OrderItem item : orderItems) {
            Product product = productRepository.findByIdWithLock(item.getProduct().getId())
                    .orElseThrow(() -> new BusinessException("상품을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
            if (product.getStockQuantity() < item.getQuantity()) {
                throw new BusinessException(product.getName() + " 상품의 재고가 부족합니다.", HttpStatus.CONFLICT);
            }
            product.setStockQuantity(product.getStockQuantity() - item.getQuantity());
            item.setProduct(product);
            totalAmount += item.getOrderPrice() * item.getQuantity();
        }

        int couponDiscount = 0;
        Long userCouponId = null;
        if (request.getCouponId() != null) {
            UserCoupon userCoupon = userCouponRepository.findById(Objects.requireNonNull(request.getCouponId()))
                    .filter(uc -> !uc.isUsed() && uc.getCoupon().isActive()
                            && uc.getUser().getId().equals(freshUser.getId()))
                    .orElseThrow(() -> new BusinessException("유효하지 않은 쿠폰입니다.", HttpStatus.BAD_REQUEST));

            Coupon coupon = userCoupon.getCoupon();
            if (coupon.getExpiryDate() != null && coupon.getExpiryDate().isBefore(LocalDate.now())) {
                throw new BusinessException("만료된 쿠폰입니다.", HttpStatus.BAD_REQUEST);
            }
            if (totalAmount < coupon.getMinOrderAmount()) {
                throw new BusinessException(
                        "최소 주문 금액(" + coupon.getMinOrderAmount() + "원)을 충족하지 않습니다.", HttpStatus.BAD_REQUEST);
            }

            couponDiscount = coupon.getType() == CouponType.FIXED
                    ? coupon.getDiscountValue()
                    : totalAmount * coupon.getDiscountValue() / 100;
            couponDiscount = Math.min(couponDiscount, totalAmount);

            userCoupon.setUsed(true);
            userCoupon.setUsedAt(LocalDateTime.now());
            userCouponId = userCoupon.getId();
        }

        int pointsToUse = Math.max(0, request.getPointsToUse());
        if (pointsToUse > 0) {
            if (pointsToUse > freshUser.getPoints()) {
                throw new BusinessException(
                        "보유 포인트(" + freshUser.getPoints() + "P)를 초과하여 사용할 수 없습니다.", HttpStatus.BAD_REQUEST);
            }
            int usable = totalAmount - couponDiscount;
            if (pointsToUse > usable) {
                throw new BusinessException("결제 금액을 초과하여 포인트를 사용할 수 없습니다.", HttpStatus.BAD_REQUEST);
            }
            freshUser.deductPoints(pointsToUse);
        }

        int finalAmount = Math.max(0, totalAmount - couponDiscount - pointsToUse);

        Order order = new Order();
        order.setUser(freshUser);
        order.setStatus(OrderStatus.ORDERED);
        order.setOrderDate(LocalDateTime.now());
        order.setTotalAmount(totalAmount);
        order.setCouponDiscount(couponDiscount);
        order.setPointDiscount(pointsToUse);
        order.setFinalAmount(finalAmount);
        order.setUserCouponId(userCouponId);
        order.setPaymentMethod(request.getPaymentMethod());
        order.setReceiverName(address.getReceiverName());
        order.setAddress(address.getAddress());
        order.setPhoneNumber(address.getPhoneNumber());
        order.setMemo(request.getMemo());

        for (OrderItem item : orderItems) {
            order.getOrderItems().add(item);
            item.setOrder(order);
        }

        Order saved = orderRepository.save(order);
        cartItemRepository.deleteAll(cartItems);
        return saved;
    }

    public List<OrderResponseDTO> getUserOrders(User user) {
        return orderRepository.findByUserWithItems(user).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public OrderResponseDTO getOrderDetail(Long orderId, User user) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new BusinessException("해당 주문을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new BusinessException("해당 주문에 대한 조회 권한이 없습니다.", HttpStatus.FORBIDDEN);
        }

        return toDTO(order);
    }

    @Transactional
    public void cancelOrder(Long orderId, String reason, User user) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new BusinessException("주문을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new BusinessException("주문 취소 권한이 없습니다.", HttpStatus.FORBIDDEN);
        }

        order.setStatus(OrderStatus.CANCELED);
        order.setCancelReason(reason);

        if (order.getPointDiscount() > 0) {
            User orderUser = userRepository.findById(Objects.requireNonNull(order.getUser().getId()))
                    .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
            orderUser.addPoints(order.getPointDiscount());
        }

        if (order.getUserCouponId() != null) {
            userCouponRepository.findById(Objects.requireNonNull(order.getUserCouponId())).ifPresent(uc -> {
                uc.setUsed(false);
                uc.setUsedAt(null);
            });
        }

        for (OrderItem item : order.getOrderItems()) {
            Product product = productRepository.findByIdWithLock(item.getProduct().getId())
                    .orElseThrow(() -> new BusinessException("상품을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
            product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
        }
    }

    @Transactional
    @SuppressWarnings("null")
    public void completePayment(Long orderId, String paymentKey) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("주문을 찾을 수 없습니다. ID: " + orderId, HttpStatus.NOT_FOUND));

        order.setStatus(OrderStatus.PAID);
        order.setPaymentKey(paymentKey);

        int earnedPoints = order.getFinalAmount() / 100;
        if (earnedPoints > 0) {
            User orderUser = userRepository.findById(order.getUser().getId())
                    .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
            orderUser.addPoints(earnedPoints);
        }
    }

    private List<OrderItem> buildOrderItems(List<CartItem> cartItems) {
        return cartItems.stream()
                .map(cartItem -> {
                    Product product = cartItem.getProduct();
                    OrderItem item = new OrderItem();
                    item.setProduct(product);
                    item.setQuantity(cartItem.getQuantity());
                    item.setOrderPrice(product.getPrice());
                    return item;
                })
                .collect(Collectors.toList());
    }

    @SuppressWarnings("null")
    private DeliveryAddress resolveDeliveryAddress(User user, OrderRequest request) {
        if (request.getDeliveryAddressSeq() != null) {
            return deliveryAddressRepository.findById(request.getDeliveryAddressSeq())
                    .filter(addr -> addr.getUser().getId().equals(user.getId()))
                    .orElseThrow(() -> new BusinessException(
                            "유효하지 않은 배송지 SEQ이거나 사용자의 주소가 아닙니다.", HttpStatus.BAD_REQUEST));
        }

        if (request.getReceiverName() == null || request.getAddress() == null || request.getPhoneNumber() == null) {
            throw new BusinessException("배송지 정보가 불완전합니다. (SEQ 또는 신규 주소 필수)", HttpStatus.BAD_REQUEST);
        }

        DeliveryAddress newAddress = new DeliveryAddress();
        newAddress.setUser(user);
        newAddress.setReceiverName(request.getReceiverName());
        newAddress.setAddress(request.getAddress());
        newAddress.setPhoneNumber(request.getPhoneNumber());
        return newAddress;
    }

    @Transactional
    public void deliverOrder(Long orderId) {
        Order order = orderRepository.findById(Objects.requireNonNull(orderId))
                .orElseThrow(() -> new BusinessException("주문을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        if (order.getStatus() != OrderStatus.PAID) {
            throw new BusinessException("결제 완료 상태의 주문만 배송 완료 처리할 수 있습니다.", HttpStatus.BAD_REQUEST);
        }
        order.setStatus(OrderStatus.DELIVERED);
    }

    public List<OrderResponseDTO> getAllOrders() {
        return orderRepository.findAllWithItemsOrderByDateDesc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private OrderResponseDTO toDTO(Order order) {
        return OrderResponseDTO.builder()
                .id(order.getId())
                .username(order.getUser().getUsername())
                .orderDate(order.getOrderDate())
                .receiverName(order.getReceiverName())
                .address(order.getAddress())
                .phoneNumber(order.getPhoneNumber())
                .paymentMethod(order.getPaymentMethod())
                .totalPrice(order.getTotalAmount())
                .couponDiscount(order.getCouponDiscount())
                .pointDiscount(order.getPointDiscount())
                .finalAmount(order.getFinalAmount() > 0 ? order.getFinalAmount() : order.getTotalAmount())
                .status(order.getStatus().toString())
                .cancelReason(order.getCancelReason())
                .orderItems(order.getOrderItems().stream()
                        .map(item -> new OrderItemDTO(
                                item.getProduct().getId(),
                                item.getProduct().getName(),
                                item.getOrderPrice(),
                                item.getQuantity()))
                        .collect(Collectors.toList()))
                .build();
    }
}
