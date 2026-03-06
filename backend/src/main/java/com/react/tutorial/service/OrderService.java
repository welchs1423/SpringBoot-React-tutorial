package com.react.tutorial.service;

import com.react.tutorial.dto.OrderItemDTO;
import com.react.tutorial.dto.OrderRequest;
import com.react.tutorial.dto.OrderResponseDTO;
import com.react.tutorial.dto.OrderStatus;
import com.react.tutorial.entity.*;
import com.react.tutorial.repository.CartItemRepository;
import com.react.tutorial.repository.DeliveryAddressRepository;
import com.react.tutorial.repository.OrderRepository;
import com.react.tutorial.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.react.tutorial.dto.OrderStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final DeliveryAddressRepository deliveryAddressRepository;

    @Transactional
    public Order createOrder(User user, OrderRequest request){
        DeliveryAddress finalAddress = resolveDeliveryAddress(user, request);

        List<CartItem> cartItems = cartItemRepository.findAllByUser(user);

        if(cartItems.isEmpty()){
            throw new IllegalArgumentException("장바구니가 비어 있어 주문을 생성할 수 없습니다.");
        }

        int totalAmount = 0;
        List<OrderItem> orderItems = createOrderItems(cartItems);

        for(OrderItem orderItem : orderItems){
            Product product = orderItem.getProduct();
            int orderQuantity = orderItem.getQuantity();

            // 재고 확인
            if(product.getStockQuantity() < orderQuantity){
                throw new IllegalStateException((product.getName() + " 상품의 재고가 부족합니다."));
            }

            // 재고 차감
            product.setStockQuantity(product.getStockQuantity() - orderQuantity);

            // 총 금액 계산
            totalAmount += orderItem.getOrderPrice() * orderQuantity;
        }

        // 주문 엔티티 생성, 저장
        Order order = new Order();
        order.setUser(user);
        order.setStatus(OrderStatus.ORDERED);   // 초기 상태: 주문 완료
        order.setOrderDate(LocalDateTime.now());
        order.setTotalAmount(totalAmount);
        order.setPaymentMethod(request.getPaymentMethod());

        // 배송 정보 스냅샷 저장
        order.setReceiverName(finalAddress.getReceiverName());
        order.setAddress(finalAddress.getAddress());
        order.setPhoneNumber(finalAddress.getPhoneNumber());
        order.setMemo(request.getMemo());

        for(OrderItem orderItem : orderItems){
            order.getOrderItems().add(orderItem);
            orderItem.setOrder(order);
        }

        Order saveOrder = orderRepository.save(order);

        cartItemRepository.deleteAll(cartItems);

        return saveOrder;
    }

    private List<OrderItem> createOrderItems(List<CartItem> cartItems){
        return cartItems.stream()
                .map(cartItem -> {
                    Product product = cartItem.getProduct();

                    OrderItem orderItem = new OrderItem();
                    orderItem.setProduct(product);
                    orderItem.setQuantity(cartItem.getQuantity());
                    orderItem.setOrderPrice(product.getPrice());

                    return orderItem;
                })
                .collect(Collectors.toList());
    }

    private DeliveryAddress resolveDeliveryAddress(User user, OrderRequest request){
        if(request.getDeliveryAddressSeq() != null){
            return deliveryAddressRepository.findById(request.getDeliveryAddressSeq())
                    .filter(addr -> addr.getUser().getId().equals(user.getId()))
                    .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 배송지 SEQ이거나 사용자의 주소가 아닙니다."));
        } else {
            if(request.getReceiverName() == null || request.getAddress() == null || request.getPhoneNumber() == null) {
                throw new IllegalArgumentException("배송지 정보가 불완전합니다. (SEQ 또는 신규 주소 필수");
            }

            DeliveryAddress newAddress = new DeliveryAddress();
            newAddress.setUser(user);
            newAddress.setReceiverName(request.getReceiverName());
            newAddress.setAddress(request.getAddress());
            newAddress.setPhoneNumber(request.getPhoneNumber());
            return newAddress;
        }
    }

    public List<OrderResponseDTO> getUserOrders(User user){
        // 1. 유저의 모든 주문을 최신순으로 조회 (주문 엔티티 리스트)
        List<Order> orders = orderRepository.findByUserOrderByOrderDateDesc(user);
        
        // 2. Order 엔티티를 OrderResponseDTO로 변환
        return orders.stream().map(order -> OrderResponseDTO.builder()
                .id(order.getId())
                .orderDate(order.getOrderDate())
                .receiverName(order.getReceiverName())
                .address(order.getAddress())
                .phoneNumber(order.getPhoneNumber())
                .paymentMethod(order.getPaymentMethod())
                .totalPrice(order.getTotalAmount())
                .status(order.getStatus().toString())
                .orderItems(order.getOrderItems().stream().map(item ->
                        new OrderItemDTO(
                                item.getProduct().getId(),
                                item.getProduct().getName(),
                            item.getOrderPrice(),
                            item.getQuantity()
                        )).collect(Collectors.toList()))
                .cancelReason(order.getCancelReason())
                .build()
        ).collect(Collectors.toList());
    }

    public OrderResponseDTO getOrderDetail(Long orderId, User user) {
        // 1. 주문 아이디로 주문을 찾되, 없으면 에러 발생
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("해당 주문을 찾을 수 없습니다."));

        // 2. 보안 체크: 주문한 사람이 현재 로그인한 유저인지 확인
        if (!order.getUser().getId().equals(user.getId())) {
            throw new IllegalStateException("해당 주문에 대한 조회 권한이 없습니다.");
        }

        // 3. 엔티티를 DTO로 변환 (기존 getUserOrders의 변환 로직과 동일)
        return OrderResponseDTO.builder()
                .id(order.getId())
                .orderDate(order.getOrderDate())
                .receiverName(order.getReceiverName())
                .address(order.getAddress())
                .phoneNumber(order.getPhoneNumber())
                .paymentMethod(order.getPaymentMethod())
                .totalPrice(order.getTotalAmount())
                .status(order.getStatus().toString())
                .orderItems(order.getOrderItems().stream().map(item ->
                        new OrderItemDTO(
                                item.getProduct().getId(),
                                item.getProduct().getName(),
                                item.getOrderPrice(),
                                item.getQuantity()
                        )).collect(Collectors.toList()))
                .build();
    }

    @Transactional
    public void cancelOrder(Long orderId, String reason, User user){
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다."));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new IllegalStateException("권한이 없습니다.");
        }

        order.setStatus(OrderStatus.CANCELED);  // 상태 변경
        order.setCancelReason(reason);          // 사유 저장

        // 상품 재고 복구 로직 (옵션: 취소 시 재고를 다시 늘려줍니다)
        for(OrderItem item : order.getOrderItems()){
            Product product = item.getProduct();
            product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
        }
    }

    @Transactional
    public void completePayment(Long orderId) {
        // 1. 주문 가져오기
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("주문을 찾을 수 없습니다. ID: " + orderId));

        // 2. 주문 상태를 결제 완료로 변경 (OrderStatus Enum 사용!)
        order.setStatus(OrderStatus.PAID);

        // 3. 주문한 상품들의 재고 차감
        for (OrderItem item : order.getOrderItems()) {
            Product product = item.getProduct();
            int currentStock = product.getStockQuantity();
            int orderQuantity = item.getQuantity();

            if (currentStock < orderQuantity) {
                throw new RuntimeException("재고가 부족합니다. 상품명: " + product.getName());
            }

            // 재고 깎기!
            product.setStockQuantity(currentStock - orderQuantity);
            productRepository.save(product);
        }

        // 4. 변경된 주문 상태 저장
        orderRepository.save(order);
    }
}
