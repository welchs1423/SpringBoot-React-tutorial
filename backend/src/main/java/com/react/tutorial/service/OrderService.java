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
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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
                                item.getProduct().getName(),
                            item.getOrderPrice(),
                            item.getQuantity()
                        )).collect(Collectors.toList()))
                .build()
        ).collect(Collectors.toList());
    }
}
