from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
import json

from database import get_db
from models import Customer, Transaction, RetryAttempt, AuditLog, SystemSettings
from ml.model import ml_model
from engine.recovery_engine import recovery_engine
from engine.command_center import command_center
from payments.provider import payment_provider

router = APIRouter(prefix="/api")

@router.get("/dashboard")
def get_dashboard_metrics(db: Session = Depends(get_db)):
    # Failed & Pending
    failed_txns = db.query(Transaction).filter(
        Transaction.status.in_(["FAILED", "REQUIRES_APPROVAL", "RETRY_IN_PROGRESS"])
    ).all()
    
    # Recovered
    recovered_txns = db.query(Transaction).filter(Transaction.status == "RECOVERED").all()
    
    # Total Risk & Recoverable
    revenue_at_risk = sum(t.amount for t in failed_txns)
    potentially_recoverable = sum(t.expected_recovery for t in failed_txns)
    revenue_recovered = sum(t.amount for t in recovered_txns)
    
    total_eligible = revenue_recovered + revenue_at_risk
    recovery_rate = round((revenue_recovered / total_eligible * 100), 1) if total_eligible > 0 else 74.2
    
    successful_recoveries_count = len(recovered_txns)
    failed_retries_count = db.query(RetryAttempt).filter(RetryAttempt.gateway_response == "FAILED").count()

    # Recovery trend (last 7 days dummy dataset generator)
    trend_data = [
        {"day": "Mon", "recovered": round(revenue_recovered * 0.11, 2), "at_risk": round(revenue_at_risk * 0.15, 2)},
        {"day": "Tue", "recovered": round(revenue_recovered * 0.14, 2), "at_risk": round(revenue_at_risk * 0.14, 2)},
        {"day": "Wed", "recovered": round(revenue_recovered * 0.16, 2), "at_risk": round(revenue_at_risk * 0.13, 2)},
        {"day": "Thu", "recovered": round(revenue_recovered * 0.15, 2), "at_risk": round(revenue_at_risk * 0.16, 2)},
        {"day": "Fri", "recovered": round(revenue_recovered * 0.18, 2), "at_risk": round(revenue_at_risk * 0.15, 2)},
        {"day": "Sat", "recovered": round(revenue_recovered * 0.13, 2), "at_risk": round(revenue_at_risk * 0.14, 2)},
        {"day": "Sun", "recovered": round(revenue_recovered * 0.13, 2), "at_risk": round(revenue_at_risk * 0.13, 2)},
    ]

    # Breakdown by Failure Reason
    reasons_group = db.query(
        Transaction.failure_reason,
        func.count(Transaction.id),
        func.sum(Transaction.amount)
    ).filter(Transaction.failure_reason != "None").group_by(Transaction.failure_reason).all()
    
    failure_breakdown = [
        {"reason": r[0], "count": r[1], "amount": round(r[2] or 0.0, 2)}
        for r in reasons_group
    ]

    # Breakdown by Payment Method
    methods_group = db.query(
        Transaction.payment_method,
        func.count(Transaction.id),
        func.sum(Transaction.amount)
    ).group_by(Transaction.payment_method).all()

    payment_method_breakdown = [
        {"method": r[0], "count": r[1], "amount": round(r[2] or 0.0, 2)}
        for r in methods_group
    ]

    return {
        "revenue_at_risk": round(revenue_at_risk, 2),
        "potentially_recoverable": round(potentially_recoverable, 2),
        "revenue_recovered": round(revenue_recovered, 2),
        "recovery_rate": recovery_rate,
        "successful_recoveries": successful_recoveries_count,
        "failed_retries": failed_retries_count,
        "trend_data": trend_data,
        "failure_breakdown": failure_breakdown,
        "payment_method_breakdown": payment_method_breakdown
    }

@router.get("/queue")
def get_recovery_queue(
    search: Optional[str] = None,
    status: Optional[str] = None,
    failure_reason: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Transaction).filter(
        Transaction.status.in_(["FAILED", "REQUIRES_APPROVAL", "RETRY_IN_PROGRESS", "STOPPED"])
    )

    if search:
        s = f"%{search}%"
        query = query.filter(
            (Transaction.customer_name.like(s)) | (Transaction.id.like(s))
        )
    if status:
        query = query.filter(Transaction.status == status)
    if failure_reason:
        query = query.filter(Transaction.failure_reason == failure_reason)

    txns = query.order_by(Transaction.expected_recovery.desc()).all()

    return [
        {
            "id": t.id,
            "customer_id": t.customer_id,
            "customer_name": t.customer_name,
            "amount": t.amount,
            "failure_reason": t.failure_reason,
            "payment_method": t.payment_method,
            "recovery_probability": int(t.recovery_probability * 100),
            "expected_recovery": t.expected_recovery,
            "recommended_action": t.recommended_action,
            "action_status": t.action_status,
            "retry_count": t.retry_count,
            "max_retries": t.max_retries,
            "status": t.status,
            "requires_human_approval": t.requires_human_approval,
            "created_at": t.created_at.isoformat()
        }
        for t in txns
    ]

@router.post("/queue/{txn_id}/approve")
def approve_transaction(txn_id: str, db: Session = Depends(get_db)):
    t = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transaction not found")

    t.action_status = "APPROVED"
    t.requires_human_approval = False
    if t.status == "REQUIRES_APPROVAL":
        t.status = "FAILED"

    log = AuditLog(
        timestamp=datetime.utcnow(),
        transaction_id=t.id,
        customer_name=t.customer_name,
        amount=t.amount,
        action="HUMAN_APPROVAL",
        reason="Human Admin approved execution for high-value transaction",
        recovery_probability=t.recovery_probability,
        expected_recovery=t.expected_recovery,
        result="APPROVED",
        executed_by="Human Admin"
    )
    db.add(log)
    db.commit()
    return {"message": "Transaction approved for AI recovery execution", "status": t.status}

@router.post("/queue/{txn_id}/execute")
def execute_retry_action(txn_id: str, db: Session = Depends(get_db)):
    t = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if t.retry_count >= t.max_retries:
        raise HTTPException(status_code=400, detail="Max retry limit reached")

    # Increment retry count
    t.retry_count += 1
    
    # Execute through Mock Payment Gateway
    res = payment_provider.execute_retry(
        transaction_id=t.id,
        amount=t.amount,
        payment_method=t.payment_method,
        failure_reason=t.failure_reason,
        retry_count=t.retry_count
    )

    # Record Retry Attempt
    attempt = RetryAttempt(
        transaction_id=t.id,
        attempt_number=t.retry_count,
        timestamp=datetime.utcnow(),
        action_taken=t.recommended_action,
        gateway_response=res["status"],
        gateway_code=res.get("gateway_code"),
        error_message=res.get("error_message")
    )
    db.add(attempt)

    if res["status"] == "SUCCESS":
        t.status = "RECOVERED"
        t.action_status = "EXECUTED"
        c = db.query(Customer).filter(Customer.id == t.customer_id).first()
        if c:
            c.total_recovered_amount += t.amount

        log = AuditLog(
            timestamp=datetime.utcnow(),
            transaction_id=t.id,
            customer_name=t.customer_name,
            amount=t.amount,
            action=t.recommended_action,
            reason=t.failure_reason,
            recovery_probability=t.recovery_probability,
            expected_recovery=t.expected_recovery,
            result="RECOVERED_SUCCESS",
            executed_by="AI Agent"
        )
        db.add(log)
    else:
        if t.retry_count >= t.max_retries:
            t.status = "STOPPED"
            t.action_status = "STOPPED"
        else:
            t.status = "FAILED"
            t.action_status = "PENDING"

        log = AuditLog(
            timestamp=datetime.utcnow(),
            transaction_id=t.id,
            customer_name=t.customer_name,
            amount=t.amount,
            action=t.recommended_action,
            reason=t.failure_reason,
            recovery_probability=t.recovery_probability,
            expected_recovery=t.expected_recovery,
            result=f"RETRY_FAILED_ATTEMPT_{t.retry_count}",
            executed_by="AI Agent"
        )
        db.add(log)

    db.commit()
    return {
        "status": t.status,
        "retry_count": t.retry_count,
        "gateway_response": res
    }

@router.post("/queue/{txn_id}/escalate")
def escalate_transaction(txn_id: str, db: Session = Depends(get_db)):
    t = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transaction not found")

    t.action_status = "ESCALATED"
    t.recommended_action = "Escalate Customer"
    log = AuditLog(
        timestamp=datetime.utcnow(),
        transaction_id=t.id,
        customer_name=t.customer_name,
        amount=t.amount,
        action="ESCALATED_MANUAL",
        reason="Escalated to customer success team for human intervention",
        recovery_probability=t.recovery_probability,
        expected_recovery=t.expected_recovery,
        result="ESCALATED",
        executed_by="Human Admin"
    )
    db.add(log)
    db.commit()
    return {"message": "Transaction escalated to account manager", "status": t.status}

@router.post("/queue/{txn_id}/stop")
def stop_transaction(txn_id: str, db: Session = Depends(get_db)):
    t = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transaction not found")

    t.status = "STOPPED"
    t.action_status = "STOPPED"
    log = AuditLog(
        timestamp=datetime.utcnow(),
        transaction_id=t.id,
        customer_name=t.customer_name,
        amount=t.amount,
        action="STOP_RETRIES",
        reason="Automated retries halted by guardrails / admin action",
        recovery_probability=t.recovery_probability,
        expected_recovery=t.expected_recovery,
        result="STOPPED",
        executed_by="Human Admin"
    )
    db.add(log)
    db.commit()
    return {"message": "Retries stopped for transaction", "status": t.status}

@router.get("/transactions")
def get_transactions(
    search: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Transaction)
    if search:
        s = f"%{search}%"
        query = query.filter((Transaction.customer_name.like(s)) | (Transaction.id.like(s)))
    if status:
        query = query.filter(Transaction.status == status)

    txns = query.order_by(Transaction.created_at.desc()).limit(100).all()
    return [
        {
            "id": t.id,
            "customer_id": t.customer_id,
            "customer_name": t.customer_name,
            "customer_email": t.customer_email,
            "amount": t.amount,
            "status": t.status,
            "failure_reason": t.failure_reason,
            "payment_method": t.payment_method,
            "recovery_probability": int(t.recovery_probability * 100),
            "expected_recovery": t.expected_recovery,
            "recommended_action": t.recommended_action,
            "retry_count": t.retry_count,
            "created_at": t.created_at.isoformat()
        }
        for t in txns
    ]

@router.get("/transactions/{txn_id}")
def get_transaction_detail(txn_id: str, db: Session = Depends(get_db)):
    t = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transaction not found")

    c = db.query(Customer).filter(Customer.id == t.customer_id).first()
    attempts = db.query(RetryAttempt).filter(RetryAttempt.transaction_id == t.id).order_by(RetryAttempt.timestamp.asc()).all()
    logs = db.query(AuditLog).filter(AuditLog.transaction_id == t.id).order_by(AuditLog.timestamp.asc()).all()

    analysis = recovery_engine.analyze_transaction(
        amount=t.amount,
        failure_reason=t.failure_reason,
        retry_count=t.retry_count,
        customer_name=t.customer_name,
        customer_ltv=c.clv if c else 50000.0,
        historical_success_rate=c.historical_success_rate if c else 0.85,
        subscription_status=c.subscription_status if c else "ACTIVE",
        payment_method=t.payment_method
    )

    return {
        "id": t.id,
        "customer": {
            "id": c.id if c else "N/A",
            "name": c.name if c else t.customer_name,
            "email": c.email if c else t.customer_email,
            "clv": c.clv if c else 0.0,
            "historical_success_rate": c.historical_success_rate if c else 0.85,
            "subscription_status": c.subscription_status if c else "ACTIVE"
        },
        "amount": t.amount,
        "currency": t.currency,
        "status": t.status,
        "failure_reason": t.failure_reason,
        "payment_method": t.payment_method,
        "created_at": t.created_at.isoformat(),
        "recovery_probability": int(t.recovery_probability * 100),
        "expected_recovery": t.expected_recovery,
        "recommended_action": t.recommended_action,
        "best_retry_time": t.best_retry_time or analysis["best_retry_time"],
        "ai_confidence": int((t.ai_confidence or 0.88) * 100),
        "ai_explanation": t.ai_explanation or analysis["ai_explanation"],
        "ai_message_draft": t.ai_message_draft or analysis["ai_message_draft"],
        "contributing_factors": analysis["contributing_factors"],
        "retry_history": [
            {
                "attempt_number": a.attempt_number,
                "timestamp": a.timestamp.isoformat(),
                "action_taken": a.action_taken,
                "gateway_response": a.gateway_response,
                "gateway_code": a.gateway_code,
                "error_message": a.error_message
            }
            for a in attempts
        ],
        "timeline_logs": [
            {
                "timestamp": l.timestamp.isoformat(),
                "action": l.action,
                "reason": l.reason,
                "result": l.result,
                "executed_by": l.executed_by
            }
            for l in logs
        ]
    }

@router.get("/customers")
def get_customers(search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Customer)
    if search:
        s = f"%{search}%"
        query = query.filter((Customer.name.like(s)) | (Customer.email.like(s)))
    customers = query.order_by(Customer.clv.desc()).limit(100).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "phone": c.phone,
            "clv": c.clv,
            "tier": c.tier,
            "historical_success_rate": int(c.historical_success_rate * 100),
            "churn_risk_score": int(c.churn_risk_score * 100),
            "subscription_status": c.subscription_status,
            "total_failed_amount": c.total_failed_amount,
            "total_recovered_amount": c.total_recovered_amount
        }
        for c in customers
    ]

@router.post("/command-center")
def query_command_center(payload: dict, db: Session = Depends(get_db)):
    query_text = payload.get("query", "")
    if not query_text:
        raise HTTPException(status_code=400, detail="Query text is required")
    res = command_center.process_query(db, query_text)
    return res

@router.post("/simulation/run")
def run_recovery_simulation(db: Session = Depends(get_db)):
    """
    Executes automated batch recovery simulation across eligible pending failed transactions.
    """
    eligible_txns = db.query(Transaction).filter(
        Transaction.status == "FAILED",
        Transaction.requires_human_approval == False,
        Transaction.retry_count < Transaction.max_retries
    ).limit(10).all()

    results = []
    recovered_count = 0
    total_newly_recovered = 0.0

    for t in eligible_txns:
        t.retry_count += 1
        res = payment_provider.execute_retry(
            transaction_id=t.id,
            amount=t.amount,
            payment_method=t.payment_method,
            failure_reason=t.failure_reason,
            retry_count=t.retry_count
        )

        attempt = RetryAttempt(
            transaction_id=t.id,
            attempt_number=t.retry_count,
            timestamp=datetime.utcnow(),
            action_taken=t.recommended_action,
            gateway_response=res["status"],
            gateway_code=res.get("gateway_code"),
            error_message=res.get("error_message")
        )
        db.add(attempt)

        if res["status"] == "SUCCESS":
            t.status = "RECOVERED"
            t.action_status = "EXECUTED"
            recovered_count += 1
            total_newly_recovered += t.amount

            c = db.query(Customer).filter(Customer.id == t.customer_id).first()
            if c:
                c.total_recovered_amount += t.amount

            log = AuditLog(
                timestamp=datetime.utcnow(),
                transaction_id=t.id,
                customer_name=t.customer_name,
                amount=t.amount,
                action=t.recommended_action,
                reason=t.failure_reason,
                recovery_probability=t.recovery_probability,
                expected_recovery=t.expected_recovery,
                result="RECOVERED_SUCCESS_SIMULATION",
                executed_by="AI Agent"
            )
            db.add(log)
        else:
            if t.retry_count >= t.max_retries:
                t.status = "STOPPED"
            
            log = AuditLog(
                timestamp=datetime.utcnow(),
                transaction_id=t.id,
                customer_name=t.customer_name,
                amount=t.amount,
                action=t.recommended_action,
                reason=t.failure_reason,
                recovery_probability=t.recovery_probability,
                expected_recovery=t.expected_recovery,
                result=f"RETRY_FAILED_SIMULATION_ATTEMPT_{t.retry_count}",
                executed_by="AI Agent"
            )
            db.add(log)

        results.append({
            "transaction_id": t.id,
            "customer_name": t.customer_name,
            "amount": t.amount,
            "action": t.recommended_action,
            "result": res["status"],
            "retry_count": t.retry_count
        })

    db.commit()

    return {
        "processed_count": len(eligible_txns),
        "recovered_count": recovered_count,
        "total_newly_recovered": round(total_newly_recovered, 2),
        "details": results
    }

@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db)):
    # Recovery rate by payment method
    methods = ["UPI", "Credit Card", "Debit Card", "Netbanking", "Auto-Debit"]
    method_analytics = []
    for m in methods:
        tot = db.query(Transaction).filter(Transaction.payment_method == m).count()
        rec = db.query(Transaction).filter(Transaction.payment_method == m, Transaction.status == "RECOVERED").count()
        rate = round((rec / tot * 100), 1) if tot > 0 else 0.0
        method_analytics.append({"method": m, "total": tot, "recovered": rec, "rate": rate})

    # Intervention success rate
    actions = ["Smart Retry", "Send Payment Reminder", "Suggest Payment Method Switch", "Escalate Customer"]
    action_analytics = []
    for a in actions:
        tot = db.query(Transaction).filter(Transaction.recommended_action == a).count()
        rec = db.query(Transaction).filter(Transaction.recommended_action == a, Transaction.status == "RECOVERED").count()
        rate = round((rec / tot * 100), 1) if tot > 0 else 0.0
        action_analytics.append({"action": a, "total": tot, "recovered": rec, "rate": rate})

    return {
        "payment_method_analytics": method_analytics,
        "action_analytics": action_analytics
    }

@router.get("/audit-logs")
def get_audit_logs(db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(150).all()
    return [
        {
            "id": l.id,
            "timestamp": l.timestamp.isoformat(),
            "transaction_id": l.transaction_id,
            "customer_name": l.customer_name,
            "amount": l.amount,
            "action": l.action,
            "reason": l.reason,
            "recovery_probability": int(l.recovery_probability * 100),
            "expected_recovery": l.expected_recovery,
            "result": l.result,
            "executed_by": l.executed_by
        }
        for l in logs
    ]

@router.get("/settings")
def get_settings(db: Session = Depends(get_db)):
    s = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
    if not s:
        s = SystemSettings(id=1)
        db.add(s)
        db.commit()
    return {
        "max_retries": s.max_retries,
        "high_value_threshold": s.high_value_threshold,
        "auto_retry_enabled": s.auto_retry_enabled,
        "min_confidence_threshold": int(s.min_confidence_threshold * 100),
        "razorpay_mode": s.razorpay_mode
    }

@router.put("/settings")
def update_settings(payload: dict, db: Session = Depends(get_db)):
    s = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
    if not s:
        s = SystemSettings(id=1)
        db.add(s)

    if "max_retries" in payload:
        s.max_retries = int(payload["max_retries"])
    if "high_value_threshold" in payload:
        s.high_value_threshold = float(payload["high_value_threshold"])
    if "auto_retry_enabled" in payload:
        s.auto_retry_enabled = bool(payload["auto_retry_enabled"])

    db.commit()
    return {"message": "Settings updated successfully"}
