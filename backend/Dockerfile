# 빌드 스테이지
FROM gradle:8.11-jdk17 AS builder
WORKDIR /app
ENV DOCKER_BUILD=true
COPY gradlew gradlew.bat ./
COPY gradle ./gradle
COPY build.gradle settings.gradle gradle.properties ./
COPY src ./src
RUN sed -i 's/\r$//' gradlew && chmod +x gradlew && \
    sed -i '/org.gradle.java.home/d' gradle.properties && \
    ./gradlew build -x test --no-daemon

# 런타임 스테이지
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
RUN mkdir -p /app/uploads
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
