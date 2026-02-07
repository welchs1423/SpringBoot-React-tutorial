package com.react.tutorial;

import com.react.tutorial.entity.Product;
import com.react.tutorial.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class TutorialApplication {

	public static void main(String[] args) {
		SpringApplication.run(TutorialApplication.class, args);
	}

    // 서버 시작 시 초기 상품 데이터를 생성
    @Bean
    public CommandLineRunner initData(ProductRepository productRepository){
        return args -> {
            if(productRepository.count() == 0){

                Product product1 = Product.builder()
                        .name("빈티지 가죽 백팩")
                        .price(120000)
                        .stockQuantity(10)
                        .description("고급스러운 소가죽으로 제작된 빈티지 스타일 백팩입니다.")
                        .build();
                productRepository.save(product1);

                Product product2 = Product.builder()
                        .name("컴포트 캔버스화")
                        .price(45000)
                        .stockQuantity(50)
                        .description("편안한 착용감을 자랑하는 클래식 캔버스 스니커즈입니다.")
                        .build();
                productRepository.save(product2);
            }
        };
    }
}
