# spring-react-tutorial 프로젝트

Spring Boot와 React를 이용한 풀스택 쇼핑몰 구축 및 실무 환경 설정 튜토리얼입니다.

## 🛠 현재 진행 상황

* **결제 시스템 도입**: 토스페이먼츠(Toss Payments) 일반 결제창 프론트엔드 연동 완료
* **결제 흐름 검증**: 결제 팝업 호출 및 성공 시 `paymentKey` 포함 리다이렉트 정합성 확인
* **JPA Auditing 도입**: 엔티티 생성/수정 시간 자동화 시스템 구축 완료
* **다국어 데이터 무결성 확보**: DB-App-Terminal 전 구간 UTF-8(utf8mb4) 인코딩 정합성 완료

---

## 🛠 기술 스택
* **Backend**: Java 17, Spring Boot 3.4.x, Spring Data JPA, MySQL
* **Frontend**: React, Vite, CSS3

---

## ⚙️ 환경 설정 로그

### [결제 시스템 인프라 레시피]
* **SDK**: `@tosspayments/payment-sdk` 설치 (일반 결제창 방식)
* **Client Key**: `test_ck_AQ92ymxN34gaxdBKWGLK8ajRKXvd` 적용
* **기능**: `loadTossPayments` 기반의 팝업 결제창 구현 및 성공 파라미터 낚아채기 로직 완료

### [데이터베이스 인프라]
* **MySQL**: `utf8mb4` 캐릭터셋 설정이 포함된 Docker 기반 `shop-mysql` 운영

---

## 업데이트 기록

## 최근 업데이트 내역

### 🚀 [2026-03-10] 결제 취소 API 및 금액 위변조 방어 로직 구현
**결제 금액 위변조 검증 (보안 강화)**
  * 프론트엔드에서 전달된 결제 금액(`amount`)과 DB의 실제 주문 금액(`totalAmount`)을 결제 승인 직전에 교차 검증하여 악의적인 데이터 조작(해킹) 원천 차단.
**결제 키 영속성 보장**
  * `Order` 엔티티에 `paymentKey` 필드를 추가하여 추후 환불 및 결제 추적성 확보.
**토스페이먼츠 Cancel API 연동**
  * `/api/payment/cancel/{orderId}` 엔드포인트 구축 및 사유(Reason)를 포함한 취소 통신 완료.
**데이터 무결성 롤백 처리**
  * 환불 성공 시 `OrderService.cancelOrder`를 재활용하여 상품 재고(Stock) 복구 및 주문 상태(`CANCELED`) 롤백 보장.

### 🚀 [2026-03-07] 결제 시스템 및 재고 관리 로직 완비
**결제 최종 승인 API 구현**
  * Toss Payments와의 서버 간 통신을 통해 결제 무결성 검증 완료.
**비즈니스 로직 고도화**
  * `OrderStatus` Enum에 `PAID` 상태 추가 및 결제 완료 시 상태 변경 로직 구현.
  * 결제 성공 시 상품 테이블(`Product`)의 물리적 재고(`stockQuantity`) 자동 차감 로직 연동.
**트러블슈팅**
  * React StrictMode로 인한 API 중복 호출 이슈를 `main.jsx` 수정으로 해결.
  * JPA 순환 참조 에러를 `@JsonIgnore`로 해결하여 데이터 전송 최적화.

### 🚀 [2026-03-01] 결제 시스템 프론트엔드 연동 완성
**토스페이먼츠 일반 결제창 구현**
  * `CheckoutTest.jsx` 컴포넌트를 통한 결제 프로세스 독립적 테스트 완료.
**성능 및 UX 개선**
  * `URLSearchParams`를 활용한 결제 성공 데이터(paymentKey) 추출 로직 구현.
  * `window.history.replaceState`를 사용하여 주소창 URL 정리 기능 추가.

### [2026-02-27] JPA Auditing 적용 및 DB 안정화
**JPA Auditing 시스템 구축**
  - 모든 엔티티의 생성 및 수정 시간을 자동으로 관리하는 기반 마련.
  - 기존 `NULL`로 들어가던 시간 데이터가 20번 데이터 이후부터 정상 기록됨을 확인.
**Docker MySQL 한글 지원 최적화**
  - 이모지 및 다국어 지원을 위해 `utf8mb4` 캐릭터셋으로 서버 환경 재구축.
  - PowerShell 및 리액트 화면에서의 데이터 출력 정합성 검증 완료.
**Git 저장소 브랜치 표준화**
  - 프로젝트 기본 브랜치를 `main`으로 전환하고 원격 저장소와 동기화 완료.

### [2026-02-25] 상품 관리 및 환경 설정 최적화

#### 1. 상품 삭제 로직 고도화 (Soft Delete & File Cleanup)
* **Soft Delete 도입**: 데이터 무결성을 위해 `isDeleted` 플래그를 사용하여 주문 내역이 있는 상품도 안전하게 관리함.
* **이미지 자동 정리**: 상품 삭제 또는 이미지 변경 시 서버 내 물리적 파일(`uploads/`)을 자동으로 삭제하여 저장소 용량을 최적화함.

#### 2. 관리자 기능 및 UI 개선
* **전용 관리 페이지**: `ProductManager` 컴포넌트를 분리하여 상품 목록 조회 및 삭제 기능을 독립적으로 구성함.
* **실시간 재조회**: 상품 등록 성공 시 리스트를 자동으로 다시 불러오도록 로직을 개선함.
* **다크 모드 가독성 보정**: 하이 콘트라스트 환경에서도 입력 폼 글자가 선명하게 보이도록 스타일(색상 대비)을 조정함.

#### 3. 프로젝트 구조 및 보안 강화
* **통합 `.gitignore`**: 루트 레벨에서 백엔드, 프론트엔드, 업로드 폴더를 통합 관리하여 설정 파일 및 바이너리 파일 유출을 방지함.
* **설정 파일 보안**: `application.properties`를 추적 제외하여 민감한 DB 및 JWT 정보를 보호함.

> ** 필수 설정 사항**
> * 프로젝트 클론 후 루트 디렉토리에 `uploads` 폴더를 직접 생성해야 이미지 업로드 기능이 정상 작동합니다.

> **💡 개발 팁 (Docker 접속)**
> 터미널에서 한글 깨짐 없이 DB를 조회하려면 아래 명령어를 사용하세요.
> `docker exec -it shop-mysql mysql --default-character-set=utf8mb4 -u root -p1234 shop_db`
>
## 📌 향후 과제 (To-Do)
- [ ] 백엔드(Spring Boot) 결제 최종 승인 API 구현 (Toss Confirm API)
- [ ] 결제 완료 후 주문 상태(PAID) 업데이트 및 재고 차감 로직 연동