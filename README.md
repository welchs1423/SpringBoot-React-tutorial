# spring-react-tutorial 프로젝트

Spring Boot와 React를 이용한 풀스택 쇼핑몰 구축 및 실무 환경 설정 튜토리얼입니다.

## 기술 스택

- **Backend**: Java 17, Spring Boot 3.4.x, Spring Data JPA, MySQL
- **Frontend**: React 19, Vite, CSS3
- **결제**: 토스페이먼츠(Toss Payments) 샌드박스

---

## 업데이트 기록

### [2026-04-17] 전면 리팩토링 — 관심사 분리 및 아키텍처 개선

#### 백엔드

**GlobalExceptionHandler 도입 (예외 처리 일원화)**
- `exception/GlobalExceptionHandler.java` 신규 생성으로 모든 컨트롤러의 try-catch 중복 코드 제거.
- `exception/BusinessException.java`를 도입해 비즈니스 규칙 위반(재고 부족, 권한 없음 등)을 HTTP 상태 코드와 함께 명시적으로 표현.
- `IllegalArgumentException` → 400, `IllegalStateException` → 409, `AccessDeniedException` → 403으로 표준화.

**N+1 쿼리 문제 해결**
- `OrderRepository`에 `@Query` FETCH JOIN 메서드(`findByUserWithItems`, `findByIdWithItems`)를 추가해 주문 목록/상세 조회 시 OrderItem + Product를 단일 쿼리로 조회.

**재고 이중 차감 버그 수정**
- `OrderService.completePayment`에서 재고를 재차감하던 버그 수정. 재고는 `createOrder`에서 1회만 차감하며, `completePayment`는 주문 상태를 `PAID`로 변경하고 `paymentKey`를 저장하는 역할에만 집중.

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

#### 프론트엔드

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

---

### [2026-03-10] 결제 취소 API 및 금액 위변조 방어 로직 구현

**결제 금액 위변조 검증 (보안 강화)**
- 프론트엔드에서 전달된 결제 금액(`amount`)과 DB의 실제 주문 금액(`totalAmount`)을 결제 승인 직전에 교차 검증하여 악의적인 데이터 조작(해킹) 원천 차단.

**결제 키 영속성 보장**
- `Order` 엔티티에 `paymentKey` 필드를 추가하여 추후 환불 및 결제 추적성 확보.

**토스페이먼츠 Cancel API 연동**
- `/api/payment/cancel/{orderId}` 엔드포인트 구축 및 사유(Reason)를 포함한 취소 통신 완료.

**데이터 무결성 롤백 처리**
- 환불 성공 시 `OrderService.cancelOrder`를 재활용하여 상품 재고(Stock) 복구 및 주문 상태(`CANCELED`) 롤백 보장.

---

### [2026-03-07] 결제 시스템 및 재고 관리 로직 완비

**결제 최종 승인 API 구현**
- Toss Payments와의 서버 간 통신을 통해 결제 무결성 검증 완료.

**비즈니스 로직 고도화**
- `OrderStatus` Enum에 `PAID` 상태 추가 및 결제 완료 시 상태 변경 로직 구현.
- 결제 성공 시 상품 테이블(`Product`)의 물리적 재고(`stockQuantity`) 자동 차감 로직 연동.

**트러블슈팅**
- React StrictMode로 인한 API 중복 호출 이슈를 `main.jsx` 수정으로 해결.
- JPA 순환 참조 에러를 `@JsonIgnore`로 해결하여 데이터 전송 최적화.

---

### [2026-03-01] 결제 시스템 프론트엔드 연동 완성

**토스페이먼츠 일반 결제창 구현**
- `CheckoutTest.jsx` 컴포넌트를 통한 결제 프로세스 독립적 테스트 완료.

**성능 및 UX 개선**
- `URLSearchParams`를 활용한 결제 성공 데이터(paymentKey) 추출 로직 구현.
- `window.history.replaceState`를 사용하여 주소창 URL 정리 기능 추가.

---

### [2026-02-27] JPA Auditing 적용 및 DB 안정화

**JPA Auditing 시스템 구축**
- 모든 엔티티의 생성 및 수정 시간을 자동으로 관리하는 기반 마련.

**Docker MySQL 한글 지원 최적화**
- 이모지 및 다국어 지원을 위해 `utf8mb4` 캐릭터셋으로 서버 환경 재구축.

**Git 저장소 브랜치 표준화**
- 프로젝트 기본 브랜치를 `main`으로 전환하고 원격 저장소와 동기화 완료.

---

### [2026-02-25] 상품 관리 및 환경 설정 최적화

**Soft Delete 도입**
- 데이터 무결성을 위해 `isDeleted` 플래그를 사용하여 주문 내역이 있는 상품도 안전하게 관리.

**이미지 자동 정리**
- 상품 삭제 또는 이미지 변경 시 서버 내 물리적 파일(`uploads/`)을 자동으로 삭제.

**프로젝트 구조 및 보안 강화**
- 통합 `.gitignore`로 설정 파일 및 바이너리 파일 유출 방지.
- `application.properties`를 추적 제외하여 민감한 DB 및 JWT 정보 보호.

> **필수 설정 사항**
> 프로젝트 클론 후 루트 디렉토리에 `uploads` 폴더를 직접 생성해야 이미지 업로드 기능이 정상 작동합니다.

> **Docker MySQL 접속 팁**
> `docker exec -it shop-mysql mysql --default-character-set=utf8mb4 -u root -p1234 shop_db`
