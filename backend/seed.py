import random
from datetime import datetime, timedelta
from database import engine, SessionLocal, Base
from models import Customer, Transaction, RetryAttempt, AuditLog, SystemSettings
from engine.recovery_engine import recovery_engine

FIRST_NAMES = ["Rahul", "Priya", "Ananya", "Vikram", "Sneha", "Rohan", "Aditi", "Karan", "Meera", "Amit",
               "Neha", "Siddharth", "Pooja", "Arjun", "Kavya", "Dev", "Ishita", "Rajesh", "Tanvi", "Nikhil"]
LAST_NAMES = ["Sharma", "Patel", "Iyer", "Malhotra", "Reddy", "Verma", "Gupta", "Deshmukh", "Chowdhury", "Joshi",
              "Nair", "Mehta", "Bhasin", "Rao", "Kapoor", "Agarwal", "Singh", "Shah", "Kulkarni", "Sundaram"]

COMPANIES = ["TechNova Solutions", "CloudScale India", "SaaSify Suite", "PayFlow Systems", "DataSync Labs",
             "ZettaByte Analytics", "Apex Global", "OmniChannel POS", "FinEdge Corp", "HyperGrow Media"]

FAILURE_REASONS = ["Insufficient Funds", "Auth Failed", "Card Expired", "Bank Timeout", "Network Error"]
PAYMENT_METHODS = ["UPI", "Credit Card", "Debit Card", "Netbanking", "Auto-Debit"]
SUBSCRIPTION_PLANS = ["Starter Monthly", "Pro Annual", "Enterprise Suite", "Developer API Tier", "Scale Growth Plan"]

def generate_seed_data():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    print("Generating 300 Customers...")
    customers = []
    for i in range(1, 301):
        fn = random.choice(FIRST_NAMES)
        ln = random.choice(LAST_NAMES)
        name = f"{fn} {ln}"
        email = f"{fn.lower()}.{ln.lower()}{i}@example.com"
        phone = f"+91 98{random.randint(10000000, 99999999)}"
        tier = random.choice(["Standard", "Standard", "Pro", "Enterprise"])
        clv = round(random.uniform(5000, 350000), 2)
        success_rate = round(random.uniform(0.65, 0.98), 2)
        sub_status = random.choice(["ACTIVE", "ACTIVE", "ACTIVE", "PAST_DUE", "CANCELLED"])
        
        c = Customer(
            id=f"CUST-{1000 + i}",
            name=name,
            email=email,
            phone=phone,
            clv=clv,
            tier=tier,
            join_date=datetime.utcnow() - timedelta(days=random.randint(30, 730)),
            historical_success_rate=success_rate,
            total_transactions=random.randint(5, 50),
            total_failed_amount=0.0,
            total_recovered_amount=0.0,
            churn_risk_score=round(random.uniform(0.05, 0.45), 2),
            subscription_status=sub_status
        )
        customers.append(c)
        db.add(c)
    db.commit()

    print("Generating 1,000 Transactions...")
    # Target distribution:
    # 700 Successful past transactions
    # 150 Already Recovered transactions totaling ~ ₹3,84,000
    # 150 Pending Failed / At-Risk transactions totaling ~ ₹8,42,000 (with ~ ₹5,17,000 recoverable)

    transactions = []
    
    # 1. Past Successful Transactions (700 txns)
    for i in range(1, 701):
        c = random.choice(customers)
        amt = round(random.uniform(500, 15000), 2)
        t = Transaction(
            id=f"TXN-{10000 + i}",
            customer_id=c.id,
            customer_name=c.name,
            customer_email=c.email,
            amount=amt,
            currency="INR",
            status="SUCCESS",
            failure_reason="None",
            payment_method=random.choice(PAYMENT_METHODS),
            subscription_id=f"SUB-{random.randint(100, 999)}",
            created_at=datetime.utcnow() - timedelta(days=random.randint(15, 180)),
            recovery_probability=1.0,
            expected_recovery=amt,
            recommended_action="None",
            action_status="EXECUTED",
            retry_count=0,
            max_retries=3,
            requires_human_approval=False,
            ai_explanation="Standard transaction completed successfully."
        )
        transactions.append(t)
        db.add(t)

    # 2. Recovered Transactions (150 txns, total ~ ₹3,84,000)
    recovered_target = 384000.0
    accumulated_recovered = 0.0
    for i in range(701, 851):
        c = random.choice(customers)
        # Calculate amount to sum to ~3,84,000
        remaining_count = 851 - i
        if remaining_count == 1:
            amt = round(recovered_target - accumulated_recovered, 2)
        else:
            avg_rem = (recovered_target - accumulated_recovered) / remaining_count
            amt = round(max(500, min(12000, random.gauss(avg_rem, 800))), 2)
        accumulated_recovered += amt

        fail_reason = random.choice(FAILURE_REASONS)
        pay_method = random.choice(PAYMENT_METHODS)
        retries = random.randint(1, 2)

        analysis = recovery_engine.analyze_transaction(
            amount=amt, failure_reason=fail_reason, retry_count=retries,
            customer_name=c.name, customer_ltv=c.clv,
            historical_success_rate=c.historical_success_rate,
            subscription_status=c.subscription_status, payment_method=pay_method
        )

        t = Transaction(
            id=f"TXN-{10000 + i}",
            customer_id=c.id,
            customer_name=c.name,
            customer_email=c.email,
            amount=amt,
            currency="INR",
            status="RECOVERED",
            failure_reason=fail_reason,
            payment_method=pay_method,
            subscription_id=f"SUB-{random.randint(100, 999)}",
            created_at=datetime.utcnow() - timedelta(days=random.randint(1, 14)),
            recovery_probability=analysis["recovery_probability"],
            expected_recovery=analysis["expected_recovery"],
            recommended_action=analysis["recommended_action"],
            action_status="EXECUTED",
            best_retry_time=analysis["best_retry_time"],
            ai_confidence=analysis["ai_confidence"],
            ai_explanation=analysis["ai_explanation"],
            ai_message_draft=analysis["ai_message_draft"],
            retry_count=retries,
            max_retries=3,
            requires_human_approval=amt >= 10000.0
        )
        c.total_recovered_amount += amt
        transactions.append(t)
        db.add(t)

        # Audit log for recovered transaction
        log = AuditLog(
            timestamp=datetime.utcnow() - timedelta(hours=random.randint(2, 48)),
            transaction_id=t.id,
            customer_name=c.name,
            amount=amt,
            action=analysis["recommended_action"],
            reason=fail_reason,
            recovery_probability=analysis["recovery_probability"],
            expected_recovery=analysis["expected_recovery"],
            result="RECOVERED_SUCCESS",
            executed_by="AI Agent"
        )
        db.add(log)

    # 3. Active Failed Transactions (150 txns, total risk ~ ₹8,42,000, recoverable ~ ₹5,17,000)
    risk_target = 842000.0
    accumulated_risk = 0.0

    for i in range(851, 1001):
        c = random.choice(customers)
        remaining_count = 1001 - i
        if remaining_count == 1:
            amt = round(risk_target - accumulated_risk, 2)
        else:
            avg_rem = (risk_target - accumulated_risk) / remaining_count
            amt = round(max(800, min(35000, random.gauss(avg_rem, 2500))), 2)
        accumulated_risk += amt

        fail_reason = random.choice(FAILURE_REASONS)
        pay_method = random.choice(PAYMENT_METHODS)
        retries = random.choice([0, 0, 1, 2])

        analysis = recovery_engine.analyze_transaction(
            amount=amt, failure_reason=fail_reason, retry_count=retries,
            customer_name=c.name, customer_ltv=c.clv,
            historical_success_rate=c.historical_success_rate,
            subscription_status=c.subscription_status, payment_method=pay_method
        )

        requires_app = amt >= 10000.0
        status = "REQUIRES_APPROVAL" if requires_app else "FAILED"

        t = Transaction(
            id=f"TXN-{10000 + i}",
            customer_id=c.id,
            customer_name=c.name,
            customer_email=c.email,
            amount=amt,
            currency="INR",
            status=status,
            failure_reason=fail_reason,
            payment_method=pay_method,
            subscription_id=f"SUB-{random.randint(100, 999)}",
            created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 72)),
            recovery_probability=analysis["recovery_probability"],
            expected_recovery=analysis["expected_recovery"],
            recommended_action=analysis["recommended_action"],
            action_status="PENDING",
            best_retry_time=analysis["best_retry_time"],
            ai_confidence=analysis["ai_confidence"],
            ai_explanation=analysis["ai_explanation"],
            ai_message_draft=analysis["ai_message_draft"],
            retry_count=retries,
            max_retries=3,
            requires_human_approval=requires_app
        )
        c.total_failed_amount += amt
        transactions.append(t)
        db.add(t)

        # Audit Log entry
        log = AuditLog(
            timestamp=datetime.utcnow() - timedelta(minutes=random.randint(5, 300)),
            transaction_id=t.id,
            customer_name=c.name,
            amount=amt,
            action=analysis["recommended_action"],
            reason=fail_reason,
            recovery_probability=analysis["recovery_probability"],
            expected_recovery=analysis["expected_recovery"],
            result="AI_ANALYZED_PENDING",
            executed_by="AI Agent"
        )
        db.add(log)

    # 4. System Settings
    settings = SystemSettings(
        id=1,
        max_retries=3,
        high_value_threshold=10000.0,
        auto_retry_enabled=True,
        min_confidence_threshold=0.60,
        razorpay_mode="TEST_MOCK"
    )
    db.add(settings)

    db.commit()
    db.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    generate_seed_data()
