package com.react.tutorial.service;

import com.react.tutorial.dto.OrderItemDTO;
import com.react.tutorial.dto.OrderRequest;
import com.react.tutorial.dto.OrderResponseDTO;
import com.react.tutorial.dto.OrderStatus;
import com.react.tutorial.entity.*;
import com.react.tutorial.exception.BusinessException;
import com.react.tutorial.repository.CartItemRepository;
import com.react.tutorial.repository.DeliveryAddressRepository;
import com.react.tutorial.repository.OrderRepository;
import com.react.tutorial.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final DeliveryAddressRepository deliveryAddressRepository;
    private final ProductRepository productRepository;

    @Transactional
    public Order createOrder(User user, OrderRequest request) {
        DeliveryAddress address = resolveDeliveryAddress(user, request);
        List<CartItem> cartItems = cartItemRepository.findAllByUser(user);

        if (cartItems.isEmpty()) {
            throw new BusinessException("장바구니가 비어 있어 주문을 생성할 수 없습니다.", HttpStatus.BAD_REQUEST);
        }

        List<OrderItem> orderItems = buildOrderItems(cartItems);

        int totalAmount = 0;
        for (OrderItem item : orderItems) {
            // 동시 결제 요청 시 재고 정합성 보장을 위해 비관적 락으로 상품을 재조회한다.
            Product product = productRepository.findByIdWithLock(item.getProduct().getId())
                    .orElseThrow(() -> new BusinessException("상품을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
            if (product.getStockQuantity() < item.getQuantity()) {
                throw new BusinessException(product.getName() + " 상품의 재고가 부족합니다.", HttpStatus.CONFLICT);
            }
            product.setStockQuantity(product.getStockQuantity() - item.getQuantity());
            item.setProduct(product);
            totalAmount += item.getOrderPrice() * item.getQuantity();
        }

        Order order = new Order();
        order.setUser(user);
        order.setStatus(OrderStatus.ORDERED);
        order.setOrderDate(LocalDateTime.now());
        order.setTotalAmount(totalAmount);
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

        for (OrderItem item : order.getOrderItems()) {
            // 취소·환불 시에도 동시 접근으로 인한 재고 오염을 막기 위해 비관적 락을 사용한다.
            Product product = productRepository.findByIdWithLock(item.getProduct().getId())
                    .orElseThrow(() -> new BusinessException("상품을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
            product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
        }
    }

    /**
     * 토스페이먼츠 결제 승인 후 주문 상태를 PAID로 변경한다.
     * 재고는 createOrder에서 이미 차감되었으므로 여기서는 차감하지 않는다.
     */
    @Transactional
    @SuppressWarnings("null")
    public void completePayment(Long orderId, String paymentKey) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("주문을 찾을 수 없습니다. ID: " + orderId, HttpStatus.NOT_FOUND));

        order.setStatus(OrderStatus.PAID);
        order.setPaymentKey(paymentKey);
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
        Order order = orderRepository.findById(orderId)
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
