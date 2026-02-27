package com.react.tutorial.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@MappedSuperclass   // 엔티티들이 이 클래스를 상속받으면 아래 필드들도 컬럼으로 인식함
@EntityListeners(AuditingEntityListener.class)  // 스프링이 이벤트를 캐치해서 시간을 자동으로 넣어줌
public abstract class BaseEntity {

    @CreatedDate
    @Column(updatable = false) // 한번 생성되면 수정하지 않도록 막음.
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
