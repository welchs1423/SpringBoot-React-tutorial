import { loadTossPayments } from "@tosspayments/payment-sdk";

const clientKey = "test_ck_AQ92ymxN34gaxdBKWGLK8ajRKXvd"; 

export default function CheckoutTest() {
  const handlePayment = async () => {
    try {
      const tossPayments = await loadTossPayments(clientKey);
      
      // 결제창 띄우기
      await tossPayments.requestPayment("카드", {
        amount: 50000,
        orderId: "ORDER_" + new Date().getTime(), // 겹치지 않는 임의의 주문번호
        orderName: "멋진 스프링 튜토리얼 상품 외 2건",
        customerName: "홍길동",
        successUrl: window.location.origin + "/payment/success",
        failUrl: window.location.origin + "/payment/fail",
      });
    } catch (err) {
      console.error("결제 에러:", err);
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", padding: "50px 20px", textAlign: "center" }}>
      <h2>💳 안전한 결제하기 (일반 결제창)</h2>
      <p style={{ color: "#666", marginBottom: "30px" }}>아래 버튼을 누르면 토스페이먼츠 결제창이 나타납니다.</p>
      
      <button 
        onClick={handlePayment}
        style={{
          width: "100%", padding: "15px", backgroundColor: "#3182f6", 
          color: "white", border: "none", borderRadius: "8px", 
          fontSize: "18px", cursor: "pointer", fontWeight: "bold"
        }}
      >
        50,000원 결제하기
      </button>
    </div>
  );
}