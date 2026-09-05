from sqlalchemy.orm import Session
from sqlalchemy import func
from models import Transaction, Customer, AuditLog

class AICommandCenter:
    def process_query(self, db: Session, query_text: str) -> dict:
        q_lower = query_text.lower().strip()

        # Query 1: Which payments to recover first?
        if any(w in q_lower for w in ["recover first", "priority", "highest value", "top payments", "what to recover"]):
            txns = db.query(Transaction).filter(
                Transaction.status.in_(["FAILED", "REQUIRES_APPROVAL"])
            ).order_by(Transaction.expected_recovery.desc()).limit(5).all()

            data = [
                {
                    "id": t.id,
                    "customer_name": t.customer_name,
                    "amount": t.amount,
                    "failure_reason": t.failure_reason,
                    "probability": int(t.recovery_probability * 100),
                    "expected_recovery": t.expected_recovery,
                    "action": t.recommended_action
                }
                for t in txns
            ]

            total_top_expected = sum(t["expected_recovery"] for t in data)
            answer = (
                f"Based on ML probability analysis, here are the top {len(data)} failed transactions with the highest expected recovery value. "
                f"Recovering these top items will yield an estimated **₹{total_top_expected:,.2f}**."
            )
            return {
                "query": query_text,
                "answer": answer,
                "type": "TRANSACTION_LIST",
                "data": data
            }

        # Query 2: How much revenue can be recovered?
        elif any(w in q_lower for w in ["how much", "total recoverable", "can be recovered", "potentially recoverable"]):
            failed_txns = db.query(Transaction).filter(
                Transaction.status.in_(["FAILED", "REQUIRES_APPROVAL"])
            ).all()

            total_risk = sum(t.amount for t in failed_txns)
            total_recoverable = sum(t.expected_recovery for t in failed_txns)
            count = len(failed_txns)

            recovered_txns = db.query(Transaction).filter(Transaction.status == "RECOVERED").all()
            total_recovered = sum(t.amount for t in recovered_txns)

            answer = (
                f"Currently across {count} pending failed transactions, **₹{total_risk:,.2f}** is at risk. "
                f"RecoverAI's ML engine estimates **₹{total_recoverable:,.2f}** is potentially recoverable (avg probability: {int((total_recoverable/total_risk)*100 if total_risk > 0 else 0)}%). "
                f"So far, **₹{total_recovered:,.2f}** has already been successfully recovered!"
            )
            return {
                "query": query_text,
                "answer": answer,
                "type": "METRIC_SUMMARY",
                "data": {
                    "revenue_at_risk": total_risk,
                    "potentially_recoverable": total_recoverable,
                    "already_recovered": total_recovered,
                    "pending_failed_count": count
                }
            }

        # Query 3: High value failed payments
        elif any(w in q_lower for w in ["high value", "high-value", "large payments", "> 10000", "over 10k"]):
            txns = db.query(Transaction).filter(
                Transaction.amount >= 10000,
                Transaction.status.in_(["FAILED", "REQUIRES_APPROVAL"])
            ).order_by(Transaction.amount.desc()).all()

            data = [
                {
                    "id": t.id,
                    "customer_name": t.customer_name,
                    "amount": t.amount,
                    "failure_reason": t.failure_reason,
                    "status": t.status,
                    "requires_approval": t.requires_human_approval
                }
                for t in txns
            ]

            answer = (
                f"Found {len(data)} high-value failed transactions exceeding ₹10,000 threshold. "
                f"Guardrails mandate human manager approval before executing automated retries on high-value items."
            )
            return {
                "query": query_text,
                "answer": answer,
                "type": "TRANSACTION_LIST",
                "data": data
            }

        # Query 4: Why did payment fail / failure reasons breakdown
        elif any(w in q_lower for w in ["why did", "failure reason", "why fail", "reasons", "root cause"]):
            reasons = db.query(
                Transaction.failure_reason,
                func.count(Transaction.id),
                func.sum(Transaction.amount)
            ).group_by(Transaction.failure_reason).all()

            data = [
                {
                    "reason": r[0],
                    "count": r[1],
                    "total_amount": round(r[2] or 0.0, 2)
                }
                for r in reasons
            ]

            data.sort(key=lambda x: x["total_amount"], reverse=True)

            top_reason = data[0]["reason"] if data else "N/A"
            answer = (
                f"The primary root cause of failed payments in the database is **{top_reason}**. "
                f"Here is the breakdown by failure cause across all transactions."
            )
            return {
                "query": query_text,
                "answer": answer,
                "type": "FAILURE_BREAKDOWN",
                "data": data
            }

        # General Database Search & Answer
        else:
            total_customers = db.query(Customer).count()
            failed_count = db.query(Transaction).filter(Transaction.status == "FAILED").count()
            recovered_count = db.query(Transaction).filter(Transaction.status == "RECOVERED").count()
            recovered_amount = db.query(func.sum(Transaction.amount)).filter(Transaction.status == "RECOVERED").scalar() or 0.0

            answer = (
                f"RecoverAI Engine query result: Currently managing {total_customers} active customers. "
                f"System has {failed_count} active failed payments pending action and has recovered {recovered_count} payments totaling **₹{recovered_amount:,.2f}**. "
                f"Try asking specific questions like 'Which payments to recover first?' or 'Show high-value failed payments'."
            )
            return {
                "query": query_text,
                "answer": answer,
                "type": "GENERAL_INFO",
                "data": {
                    "total_customers": total_customers,
                    "failed_count": failed_count,
                    "recovered_count": recovered_count,
                    "recovered_amount": recovered_amount
                }
            }

command_center = AICommandCenter()
