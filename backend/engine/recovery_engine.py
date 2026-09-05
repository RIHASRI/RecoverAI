import datetime
from ml.model import ml_model

class AIRecoveryEngine:
    def __init__(self, high_value_threshold=10000.0, max_retries=3):
        self.high_value_threshold = high_value_threshold
        self.max_retries = max_retries

    def analyze_transaction(self, amount: float, failure_reason: str, retry_count: int, customer_name: str, customer_ltv: float, historical_success_rate: float, subscription_status: str, payment_method: str):
        """
        Run ML Prediction + Guardrail Evaluation + Intervention Selector + Draft Generator.
        """
        # 1. ML Probability
        prob, factors = ml_model.predict_probability(
            amount=amount,
            failure_reason=failure_reason,
            retry_count=retry_count,
            customer_ltv=customer_ltv,
            historical_success_rate=historical_success_rate,
            subscription_status=subscription_status,
            payment_method=payment_method
        )

        # 2. Expected Recovery Formula
        expected_recovery = round(amount * prob, 2)

        # 3. Guardrails Check
        requires_human_approval = amount >= self.high_value_threshold
        is_retry_limit_reached = retry_count >= self.max_retries

        # 4. Intervention Logic
        if is_retry_limit_reached:
            recommended_action = "Escalate Customer"
            ai_explanation = f"Retry count ({retry_count}) has reached guardrail limit of {self.max_retries}. Automated retries stopped. Escalated for manual account manager review."
        elif failure_reason in ["Bank Timeout", "Network Error"]:
            recommended_action = "Smart Retry"
            ai_explanation = f"Failure due to transient {failure_reason}. High probability ({int(prob*100)}%) of recovery via off-peak smart retry."
        elif failure_reason == "Card Expired":
            recommended_action = "Suggest Payment Method Switch"
            ai_explanation = f"Card expired error detected. Recommending customer update payment method to UPI or new Credit Card."
        elif failure_reason == "Insufficient Funds":
            if prob > 0.55:
                recommended_action = "Smart Retry"
                ai_explanation = f"Insufficient funds detected. AI schedules automated retry 24 hours post payday window."
            else:
                recommended_action = "Send Payment Reminder"
                ai_explanation = f"Insufficient funds error. Triggering friendly WhatsApp/SMS reminder with direct payment link."
        elif failure_reason == "Auth Failed":
            recommended_action = "Suggest Payment Method Switch"
            ai_explanation = f"Authentication failure (2FA/OTP timeout). Prompting customer to re-authenticate or switch payment method."
        else:
            if prob > 0.60:
                recommended_action = "Smart Retry"
                ai_explanation = f"Strong customer historical success rate ({int(historical_success_rate*100)}%). Direct smart retry recommended."
            else:
                recommended_action = "Send Payment Reminder"
                ai_explanation = f"Moderate recovery probability. Sending automated payment reminder notice."

        # 5. Optimal Retry/Contact Time Recommendation
        if failure_reason in ["Bank Timeout", "Network Error"]:
            best_retry_time = "Today at 11:30 PM (Off-peak bank server hours)"
        elif failure_reason == "Insufficient Funds":
            best_retry_time = "Tomorrow at 09:00 AM (Payday cycle window)"
        else:
            best_retry_time = "Within 4 hours (High engagement window)"

        # 6. AI Message Draft Generator
        message_draft = self._generate_personalized_message(
            customer_name=customer_name,
            amount=amount,
            payment_method=payment_method,
            failure_reason=failure_reason,
            action=recommended_action
        )

        return {
            "recovery_probability": round(prob, 4),
            "expected_recovery": expected_recovery,
            "recommended_action": recommended_action,
            "requires_human_approval": requires_human_approval,
            "best_retry_time": best_retry_time,
            "ai_confidence": round(min(0.95, prob + 0.15), 2),
            "ai_explanation": ai_explanation,
            "ai_message_draft": message_draft,
            "contributing_factors": factors
        }

    def _generate_personalized_message(self, customer_name: str, amount: float, payment_method: str, failure_reason: str, action: str) -> str:
        first_name = customer_name.split()[0]
        formatted_amount = f"₹{amount:,.2f}"

        if action == "Suggest Payment Method Switch":
            return (
                f"Hi {first_name}, your recent payment of {formatted_amount} via {payment_method} could not be processed due to '{failure_reason}'. "
                f"Please update your payment details or switch to UPI to ensure uninterrupted service: https://recover.ai/pay/quick-update"
            )
        elif action == "Send Payment Reminder":
            return (
                f"Hello {first_name}, we noticed your subscription renewal of {formatted_amount} had a temporary processing issue ({failure_reason}). "
                f"Tap here to quickly complete your payment in 1-click: https://recover.ai/pay/retry-now"
            )
        elif action == "Escalate Customer":
            return (
                f"Dear {first_name}, our customer care manager has been assigned to assist you with your payment of {formatted_amount}. "
                f"We want to ensure your account remains active. Reply to this message or schedule a quick call with us."
            )
        else: # Smart Retry
            return (
                f"Notice for {first_name}: Your transaction of {formatted_amount} experienced a gateway timeout. "
                f"Our automated AI system is re-attempting authorization securely via Razorpay. No action is needed from your end."
            )

recovery_engine = AIRecoveryEngine()
