package com.react.tutorial.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequest {
    private Long deliveryAddressSeq;

    private String receiverName;
    private String address;
    private String phoneNumber;
    private String memo;

    private String paymentMethod;
}
