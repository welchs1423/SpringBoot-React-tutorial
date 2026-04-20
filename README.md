# spring-react-tutorial 프로젝트

Spring Boot와 React를 이용한 풀스택 쇼핑몰 구축 및 실무 환경 설정 튜토리얼입니다.

## 기술 스택

| 구분 | 기술 |
|---|---|
| **Backend** | Java 17, Spring Boot 3.4.x, Spring Data JPA, MySQL |
| **Frontend** | React 19, Vite, CSS3 |
| **결제** | 토스페이먼츠(Toss Payments) 샌드박스 |

---

## 시작 전 필수 설정

- 프로젝트 클론 후 루트 디렉토리에 `uploads` 폴더를 직접 생성해야 이미지 업로드가 정상 작동합니다.
- Docker MySQL 접속: `docker exec -it shop-mysql mysql --default-character-set=utf8mb4 -u root -p1234 shop_db`

---

## 업데이트 기록

### [2026-04-21]

* [Completed] GitHub Actions CD 연동 및 클라우드 서버 자동 배포 파이프라인 구축
* [Completed] 테스트 코드 정적 분석 경고 해소 — `OrderEventTest`, `StatisticsServiceTest`에 `@SuppressWarnings("null")` 적용
* [Completed] 글로벌 예외 처리 및 Slack/Discord 실시간 에러 모니터링(Webhook) 구축 완료

---

### [2026-04-20]

* [Completed] Docker 및 Docker Compose를 활용한 전체 서비스 컨테이너화 구축 완료
* [Completed] 장바구니 DB 동기화 및 마이페이지 찜하기(Wishlist) 기능 연동
* [Completed] 대규모 트래픽 대비 Redis 기반 상품 조회 캐싱 및 장바구니 메모리 최적화
* [Completed] Spring Event 기반 비동기 주문 알림 시스템 및 TDD 검증 완료
* [Completed] Server-Sent Events(SSE) 기반 실시간 웹 푸시 알림 구현 및 단위 테스트 완료
* [Completed] 관리자 통계 대시보드 API 및 차트(Chart) UI 연동 완료 (TDD 검증)
* [Completed] GitHub Actions 기반 CI(자동 테스트/빌드) 파이프라인 구축

---

### [2026-04-19]

- 상품 썸네일 및 포토 리뷰를 위한 이미지 파일 업로드 연동
* [Completed] 상품 동적 검색(키워드/가격/카테고리) 및 다중 필터링 연동

---

### [2026-04-18]

- 관리자(Admin) 상품 관리 API 및 UI 뼈대 구축
- 사용자 리뷰 시스템 구현 및 주문 상태 관리 고도화(`DELIVERED`) 완료
- 쿠폰/포인트 시스템 및 결제 할인 연동
- `OrderService` Null 타입 안전성 경고 해소
- OAuth2 소셜 로그인 및 JWT 보안 아키텍처 구축

#### `OrderService` — `@NonNull Long` 타입 불일치 경고 수정

- `userRepository.findById(user.getId())` 등 5개 호출부에서 `Long` → `@NonNull Long` unchecked conversion 경고를 발생시키던 문제 수정.
- `Objects.requireNonNull()` 래핑으로 비-null 보장을 명시적으로 전달, `@SuppressWarnings("null")` 억제 대신 실질적 픽스 방식으로 통일.

---

### [2026-04-17]

#### 재고 차감 동시성 제어 — 비관적 락(Pessimistic Lock) 적용

- 여러 사용자가 동시에 동일 상품을 결제할 때 재고가 음수가 되거나 정합성이 깨지는 Race Condition을 차단.
- `ProductRepository`에 `@Lock(LockModeType.PESSIMISTIC_WRITE)` JPQL 메서드(`findByIdWithLock`)를 추가하여 DB 수준의 `SELECT ... FOR UPDATE` 보장.
- `OrderService.createOrder`: 재고 차감 직전 락이 걸린 메서드로 상품을 재조회하여 동시 요청 간 재고 수량 충돌을 원천 차단.
- `OrderService.cancelOrder`: 환불·취소 시 재고 복구 구간에도 동일한 비관적 락을 적용하여 취소와 신규 주문이 동시에 들어오는 시나리오를 안전하게 처리.

#### 백엔드 — 코드 품질 개선 (경고 전면 해소)

**JJWT Deprecated API 현대화 (`JwtTokenProvider`)**
- `Jwts.parser()` → `Jwts.parserBuilder()` 체인으로 교체 (JJWT 0.11.5 권장 방식).
- `signWith(SignatureAlgorithm.HS512, key)` → `signWith(key)` 로 변경 (`SecretKey` 에서 알고리즘 자동 추론).

**`NullSecurityContextRepository` Spring Security 6 대응**
- 폐기(Deprecated)된 `loadContext(HttpRequestResponseHolder)` 유지 + 신규 `loadDeferredContext(HttpServletRequest)` 오버라이드 추가.
- `@SuppressWarnings("deprecation")` 로 불가피한 인터페이스 구현 경고 억제.

**`Product` 엔티티 `@Builder.Default` 적용**
- `reviews`, `cartItems`, `isDeleted` 필드에 `@Builder.Default` 를 추가해 빌더 사용 시 기본값이 무시되던 문제 해소.

**`UploadController` 잠재적 NPE 수정**
- `getOriginalFilename()` 결과가 null이거나 확장자가 없는 경우를 사전 검증, 400 Bad Request로 명시적 응답.

**미사용 코드 제거**
- `CustomUserDetailsService.passwordEncoder` 필드 및 생성자 파라미터 제거.
- `OrderService.productRepository` 필드 및 임포트 제거.
- `SecurityConfig` 의 미사용 `CorsConfigurer` 임포트 제거.
- `AuthService` 의 미사용 `AuthenticationManagerBuilder`, `Collectors` 임포트 제거.
- `JwtAuthenticationFilter` 의 미사용 `CustomUserDetailsService`, `UserDetails` 임포트 제거.

**`@NonNull` 계약 명시 (`JwtAuthenticationFilter`)**
- `doFilterInternal`, `shouldNotFilter` 파라미터에 `@NonNull` 어노테이션 추가 — 상위 `OncePerRequestFilter` 계약 충족.

**정적 분석 `@NonNull` 오탐 억제**
- Lombok 빌더 반환값 및 컨트롤러 경유 `Long` 파라미터를 `findById()` 에 전달할 때 JDT 가 잘못 경고하는 케이스에 `@SuppressWarnings("null")` 적용 (CartService, ProductService, ReviewService, OrderService, AuthService, DatabaseInitializer).

#### 백엔드/프론트엔드 — 전면 리팩토링 (관심사 분리 및 아키텍처 개선)

**GlobalExceptionHandler 도입 (예외 처리 일원화)**
- `exception/GlobalExceptionHandler.java` 신규 생성으로 모든 컨트롤러의 try-catch 중복 코드 제거.
- `exception/BusinessException.java`를 도입해 비즈니스 규칙 위반(재고 부족, 권한 없음 등)을 HTTP 상태 코드와 함께 명시적으로 표현.
- `IllegalArgumentException` → 400, `IllegalStateException` → 409, `AccessDeniedException` → 403으로 표준화.

**N+1 쿼리 문제 해결**
- `OrderRepository`에 `@Query` FETCH JOIN 메서드(`findByUserWithItems`, `findByIdWithItems`)를 추가해 주문 목록/상세 조회 시 OrderItem + Product를 단일 쿼리로 조회.

**재고 이중 차감 버그 수정**
- `OrderService.completePayment`에서 재고를 재차감하던 버그 수정.
- 재고는 `createOrder`에서 1회만 차감하며, `completePayment`는 주문 상태를 `PAID`로 변경하고 `paymentKey`를 저장하는 역할에만 집중.

**PaymentController/PaymentService 책임 분리**
- `PaymentController`의 결제 API 통신 로직을 `PaymentService`로 분리.
- `@Autowired` field injection → `@RequiredArgsConstructor` constructor injection으로 전환.
- `RestTemplate`을 `WebMvcConfig`에 `@Bean`으로 등록해 의존성 주입 방식 준수.

**Controller 정리**
- `OrderController`에서 `UserRepository` 직접 의존 제거 → `CustomUserDetailsService`로 위임.
- `ProductController`의 디버그용 `System.out.println` 제거.
- `Order` 엔티티에서 Lombok으로 커버되는 `paymentKey` getter/setter 중복 선언 제거.
- `AuthController` 생성자 주입 방식 `@RequiredArgsConstructor`로 통일.
- `AuthService`의 중복 username 예외를 `BusinessException(409 CONFLICT)`으로 교체.

**공통 API 클라이언트 (`src/api/apiClient.js`)**
- 모든 컴포넌트에 흩어져 있던 `API_BASE_URL` 상수 및 `fetch` 호출을 단일 모듈로 통합.
- `sessionStorage`에서 JWT 토큰을 자동 주입하고, 에러 응답을 일관된 `Error`로 throw.
- `get / post / put / patch / delete / upload` 메서드 제공.

**커스텀 훅으로 비즈니스 로직 분리 (`src/hooks/`)**
- `useAuth.js`: 로그인·회원가입·로그아웃 및 세션 상태 관리. `localStorage`/`sessionStorage` 혼용 불일치를 `sessionStorage`로 통일.
- `useProducts.js`: 상품 목록 조회, 등록, 삭제.
- `useCart.js`: 장바구니 조회, 수량 변경, 삭제, 주문.
- `useOrders.js`: 주문 목록/상세 조회, 취소, 리뷰 CRUD.

**컴포넌트 분리 및 정리**
- `App.jsx`에 인라인으로 존재하던 `ProductForm`을 `src/components/ProductForm.jsx`로 분리.
- `App.jsx`: `useAuth` / `useProducts` 훅 적용, `useMemo`로 상품 검색 필터링 최적화, `useCallback`으로 핸들러 메모이제이션.
- `AuthManager.jsx`: `useAuth` 훅 위임, 상태 변수 명 충돌(`username` 필드명) 해소.
- `CartList.jsx` / `OrderList.jsx` / `ProductManager.jsx`: 각각 전용 훅(`useCart`, `useOrders`, `useProducts`)으로 API 로직 분리.

**결제 취소 UI 연동**
- 주문 목록 카드에 `ORDERED`(파랑), `PAID`(초록), `CANCELED`(빨강) 상태를 시각적으로 구분하는 컬러 배지 표시.
- 상태가 `PAID`인 주문에만 '결제 취소' 버튼을 노출, 클릭 시 취소 사유 입력 모달이 열리며 `/api/payment/cancel/{orderId}`로 POST 요청.
- 취소 API 성공 시 추가 네트워크 요청 없이 `orders` 목록 상태와 상세 모달의 `selectedOrder`를 즉시 `CANCELED`로 갱신.

---

### [2026-03-10]

#### 결제 취소 API 및 금액 위변조 방어 로직 구현

- 프론트엔드에서 전달된 결제 금액(`amount`)과 DB의 실제 주문 금액(`totalAmount`)을 결제 승인 직전에 교차 검증하여 악의적인 데이터 조작 원천 차단.
- `Order` 엔티티에 `paymentKey` 필드를 추가하여 추후 환불 및 결제 추적성 확보.
- `/api/payment/cancel/{orderId}` 엔드포인트 구축 및 사유(Reason)를 포함한 취소 통신 완료.
- 환불 성공 시 `OrderService.cancelOrder`를 재활용하여 상품 재고(Stock) 복구 및 주문 상태(`CANCELED`) 롤백 보장.

---

### [2026-03-07]

#### 결제 시스템 및 재고 관리 로직 완비

- Toss Payments와의 서버 간 통신을 통해 결제 무결성 검증 완료.
- `OrderStatus` Enum에 `PAID` 상태 추가 및 결제 완료 시 상태 변경 로직 구현.
- 결제 성공 시 상품 테이블(`Product`)의 물리적 재고(`stockQuantity`) 자동 차감 로직 연동.
- React StrictMode로 인한 API 중복 호출 이슈를 `main.jsx` 수정으로 해결.
- JPA 순환 참조 에러를 `@JsonIgnore`로 해결하여 데이터 전송 최적화.

---

### [2026-03-01]

#### 결제 시스템 프론트엔드 연동 완성

- `CheckoutTest.jsx` 컴포넌트를 통한 토스페이먼츠 일반 결제창 구현 및 독립적 테스트 완료.
- `URLSearchParams`를 활용한 결제 성공 데이터(paymentKey) 추출 로직 구현.
- `window.history.replaceState`를 사용하여 주소창 URL 정리 기능 추가.

---

### [2026-02-27]

#### JPA Auditing 적용 및 DB 안정화

- 모든 엔티티의 생성 및 수정 시간을 자동으로 관리하는 JPA Auditing 기반 마련.
- 이모지 및 다국어 지원을 위해 `utf8mb4` 캐릭터셋으로 Docker MySQL 서버 환경 재구축.
- 프로젝트 기본 브랜치를 `main`으로 전환하고 원격 저장소와 동기화 완료.

---

### [2026-02-25]

#### 상품 관리 및 환경 설정 최적화

- 데이터 무결성을 위해 `isDeleted` 플래그를 사용하는 Soft Delete 도입 — 주문 내역이 있는 상품도 안전하게 관리.
- 상품 삭제 또는 이미지 변경 시 서버 내 물리적 파일(`uploads/`)을 자동으로 삭제.
- 통합 `.gitignore`로 설정 파일 및 바이너리 파일 유출 방지.
- `application.properties`를 추적 제외하여 민감한 DB 및 JWT 정보 보호.
