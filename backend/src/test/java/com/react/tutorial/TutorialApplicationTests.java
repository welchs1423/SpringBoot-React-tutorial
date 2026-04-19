package com.react.tutorial;

import com.react.tutorial.config.TestRedisConfig;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@SpringBootTest
@Import(TestRedisConfig.class)
class TutorialApplicationTests {

	@Test
	void contextLoads() {
	}

}
