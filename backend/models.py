from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    clv = Column(Float, default=0.0)  # Customer Lifetime Value in INR
    tier = Column(String, default="Standard")  # Standard, Premium, Enterprise
    join_date = Column(DateTime, default=datetime.utcnow)
    historical_success_rate = Column(Float, default=0.85)
    total_transactions = Column(Integer, default=0)
    total_failed_amount = Column(Float, default=0.0)
    total_recovered_amount = Column(Float, default=0.0)
    churn_risk_score = Column(Float, default=0.15)
    subscription_status = Column(String, default="ACTIVE")  # ACTIVE, PAST_DUE, CANCELLED

    transactions = relationship("Transaction", back_populates="customer")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, index=True)
    customer_id = Column(String, ForeignKey("customers.id"))
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    amount = Column(Float, nullable=False)  # in INR
    currency = Column(String, default="INR")
    status = Column(String, default="FAILED")  # FAILED, RECOVERED, RETRY_IN_PROGRESS, STOPPED, REQUIRES_APPROVAL, SUCCESS
    failure_reason = Column(String, nullable=False)  # Insufficient Funds, Auth Failed, Card Expired, Bank Timeout, Network Error
    failure_code = Column(String, nullable=True)
    payment_method = Column(String, nullable=False)  # UPI, Credit Card, Debit Card, Netbanking, Auto-Debit
    subscription_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # ML / AI AI Analysis Fields
    recovery_probability = Column(Float, default=0.0)
    expected_recovery = Column(Float, default=0.0)  # Amount * recovery_probability
    recommended_action = Column(String, nullable=False)  # Smart Retry, Send Payment Reminder, Suggest Payment Method Switch, Escalate Customer, No Action
    action_status = Column(String, default="PENDING")  # PENDING, APPROVED, EXECUTED, ESCALATED, STOPPED
    best_retry_time = Column(String, nullable=True)
    ai_confidence = Column(Float, default=0.88)
    ai_explanation = Column(Text, nullable=True)
    ai_message_draft = Column(Text, nullable=True)  # Email/SMS template generated for customer
    
    # Retry & Guardrail Fields
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    requires_human_approval = Column(Boolean, default=False)
    
    customer = relationship("Customer", back_populates="transactions")
    retry_attempts = relationship("RetryAttempt", back_populates="transaction")
    audit_logs = relationship("AuditLog", back_populates="transaction")

class RetryAttempt(Base):
    __tablename__ = "retry_attempts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    transaction_id = Column(String, ForeignKey("transactions.id"))
    attempt_number = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    action_taken = Column(String, nullable=False)
    gateway_response = Column(String, nullable=False)  # SUCCESS, FAILED, PENDING
    gateway_code = Column(String, nullable=True)
    error_message = Column(String, nullable=True)

    transaction = relationship("Transaction", back_populates="retry_attempts")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    transaction_id = Column(String, ForeignKey("transactions.id"))
    customer_name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    action = Column(String, nullable=False)
    reason = Column(String, nullable=False)
    recovery_probability = Column(Float, nullable=False)
    expected_recovery = Column(Float, nullable=False)
    result = Column(String, nullable=False)
    executed_by = Column(String, default="AI Agent")  # AI Agent, Human Admin

    transaction = relationship("Transaction", back_populates="audit_logs")

class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, default=1)
    max_retries = Column(Integer, default=3)
    high_value_threshold = Column(Float, default=10000.0)  # > ₹10,000 requires human approval
    auto_retry_enabled = Column(Boolean, default=True)
    min_confidence_threshold = Column(Float, default=0.60)
    razorpay_mode = Column(String, default="TEST_MOCK")
