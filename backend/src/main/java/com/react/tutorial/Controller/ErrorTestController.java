package com.react.tutorial.Controller;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
@Profile("test")
public class ErrorTestController {

    @GetMapping("/error")
    public String triggerError() {
        throw new RuntimeException("강제 500 에러 테스트");
    }
}
