import random
import time
from datetime import datetime

class PaymentProviderInterface:
    def execute_retry(self, transaction_id: str, amount: float, payment_method: str, failure_reason: str, retry_count: int) -> dict:
        raise NotImplementedError

class MockRazorpayProvider(PaymentProviderInterface):
    """
    Mock Payment Gateway Adapter simulating Razorpay Test Mode API behavior.
    """
    def execute_retry(self, transaction_id: str, amount: float, payment_method: str, failure_reason: str, retry_count: int) -> dict:
        time.sleep(0.1)  # Simulate network latency
        
        razorpay_payment_id = f"pay_rzp_test_{random.randint(1000000, 9999999)}"
        
        # Determine failure/success probability based on failure reason and payment method
        success_prob = 0.50
        
        if failure_reason in ["Bank Timeout", "Network Error"]:
            success_prob = 0.85 - (retry_count * 0.1)
        elif failure_reason == "Insufficient Funds":
            success_prob = 0.65 if retry_count >= 1 else 0.40  # Higher chance after paycheck/reminder
        elif failure_reason == "Auth Failed":
            success_prob = 0.55
        elif failure_reason == "Card Expired":
            success_prob = 0.15  # Low unless updated
            
        if payment_method in ["UPI", "Auto-Debit"]:
            success_prob += 0.10

        is_success = random.random() < success_prob

        if is_success:
            return {
                "status": "SUCCESS",
                "razorpay_payment_id": razorpay_payment_id,
                "gateway_code": "BADGQ_PAYMENT_CAPTURED",
                "error_message": None,
                "timestamp": datetime.utcnow().isoformat(),
                "provider": "Razorpay Test Gateway"
            }
        else:
            error_codes = {
                "Bank Timeout": "GATEWAY_TIMEOUT",
                "Insufficient Funds": "BAD_REQUEST_PAYMENT_DECLINED_INSUFFICIENT_FUNDS",
                "Auth Failed": "BAD_REQUEST_AUTHENTICATION_FAILED",
                "Card Expired": "BAD_REQUEST_CARD_EXPIRED",
                "Network Error": "NETWORK_UNAVAILABLE"
            }
            err_code = error_codes.get(failure_reason, "PAYMENT_FAILED")
            return {
                "status": "FAILED",
                "razorpay_payment_id": razorpay_payment_id,
                "gateway_code": err_code,
                "error_message": f"Razorpay Gateway: {failure_reason} retry failed on attempt {retry_count + 1}",
                "timestamp": datetime.utcnow().isoformat(),
                "provider": "Razorpay Test Gateway"
            }

payment_provider = MockRazorpayProvider()
