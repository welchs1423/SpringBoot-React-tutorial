package com.react.tutorial.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 프론트엔드에서 "/uploads/파일명" 으로 요청하면
        // 실제 백엔드 프로젝트 루트에 있는 "uploads/" 폴더에서 파일을 찾도록 매핑합니다.
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/");
    }
}