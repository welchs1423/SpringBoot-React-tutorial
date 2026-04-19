package com.react.tutorial.event;

import com.react.tutorial.entity.Order;

public class OrderCompletedEvent {

    private final Order order;

    public OrderCompletedEvent(Order order) {
        this.order = order;
    }

    public Order getOrder() {
        return order;
    }
}
