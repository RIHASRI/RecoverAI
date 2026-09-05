import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib
import os

class RecoveryMLModel:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.encoders = {}
        self.feature_names = [
            "amount",
            "failure_reason",
            "retry_count",
            "customer_ltv",
            "historical_success_rate",
            "subscription_status",
            "payment_method"
        ]
        self.is_trained = False
        self._initialize_encoders()

    def _initialize_encoders(self):
        failure_reasons = ["Insufficient Funds", "Auth Failed", "Card Expired", "Bank Timeout", "Network Error"]
        sub_statuses = ["ACTIVE", "PAST_DUE", "CANCELLED"]
        pay_methods = ["UPI", "Credit Card", "Debit Card", "Netbanking", "Auto-Debit"]

        le_fail = LabelEncoder().fit(failure_reasons)
        le_sub = LabelEncoder().fit(sub_statuses)
        le_pay = LabelEncoder().fit(pay_methods)

        self.encoders["failure_reason"] = le_fail
        self.encoders["subscription_status"] = le_sub
        self.encoders["payment_method"] = le_pay

    def train_synthetic(self, num_samples=1500):
        """Train scikit-learn model on realistic synthetic training dataset."""
        np.random.seed(42)

        amounts = np.random.uniform(500, 45000, num_samples)
        failure_reasons = np.random.choice(["Insufficient Funds", "Auth Failed", "Card Expired", "Bank Timeout", "Network Error"], num_samples, p=[0.35, 0.25, 0.15, 0.15, 0.10])
        retry_counts = np.random.choice([0, 1, 2, 3], num_samples, p=[0.5, 0.3, 0.15, 0.05])
        ltvs = np.random.uniform(2000, 250000, num_samples)
        success_rates = np.random.uniform(0.4, 0.98, num_samples)
        subscription_statuses = np.random.choice(["ACTIVE", "PAST_DUE", "CANCELLED"], num_samples, p=[0.75, 0.20, 0.05])
        payment_methods = np.random.choice(["UPI", "Credit Card", "Debit Card", "Netbanking", "Auto-Debit"], num_samples, p=[0.40, 0.25, 0.20, 0.10, 0.05])

        # Generate target label: 1 if recovered, 0 if failed
        targets = []
        for i in range(num_samples):
            score = 0.5
            # Higher success rate -> +score
            score += (success_rates[i] - 0.5) * 0.4
            # Higher LTV -> +score
            score += min(ltvs[i] / 200000, 0.25)
            # Payment method boost (UPI and Auto-Debit recover well on retry)
            if payment_methods[i] in ["UPI", "Auto-Debit"]:
                score += 0.15
            elif payment_methods[i] == "Card Expired":
                score -= 0.3
            # Failure reason effects
            if failure_reasons[i] in ["Bank Timeout", "Network Error"]:
                score += 0.25  # High chance of recovery on retry
            elif failure_reasons[i] == "Card Expired":
                score -= 0.20  # Requires customer update
            elif failure_reasons[i] == "Insufficient Funds":
                score += 0.05
            # Retry count penalty
            score -= retry_counts[i] * 0.15
            # Active sub bonus
            if subscription_statuses[i] == "ACTIVE":
                score += 0.1

            prob = 1 / (1 + np.exp(-4 * (score - 0.5)))
            target = 1 if np.random.rand() < prob else 0
            targets.append(target)

        df = pd.DataFrame({
            "amount": amounts,
            "failure_reason": failure_reasons,
            "retry_count": retry_counts,
            "customer_ltv": ltvs,
            "historical_success_rate": success_rates,
            "subscription_status": subscription_statuses,
            "payment_method": payment_methods,
            "target": targets
        })

        X = self._transform_df(df)
        y = df["target"].values

        self.model.fit(X, y)
        self.is_trained = True

    def _transform_df(self, df):
        X_df = df.copy()
        for col in ["failure_reason", "subscription_status", "payment_method"]:
            if col in X_df:
                encoder = self.encoders[col]
                # Handle unknown values safely
                X_df[col] = X_df[col].apply(lambda x: x if x in encoder.classes_ else encoder.classes_[0])
                X_df[col] = encoder.transform(X_df[col])
        return X_df[self.feature_names]

    def predict_probability(self, amount, failure_reason, retry_count, customer_ltv, historical_success_rate, subscription_status, payment_method):
        """Return recovery probability between 0.05 and 0.98, and key feature importances."""
        if not self.is_trained:
            self.train_synthetic()

        input_data = pd.DataFrame([{
            "amount": amount,
            "failure_reason": failure_reason,
            "retry_count": retry_count,
            "customer_ltv": customer_ltv,
            "historical_success_rate": historical_success_rate,
            "subscription_status": subscription_status,
            "payment_method": payment_method
        }])

        X = self._transform_df(input_data)
        prob = self.model.predict_proba(X)[0][1]

        # Clip probability for realism
        prob = float(np.clip(prob, 0.05, 0.98))

        # Calculate contributing factors
        importances = self.model.feature_importances_
        factors = []
        for feat, imp in zip(self.feature_names, importances):
            val = input_data[feat].iloc[0]
            factors.append({
                "feature": feat,
                "importance": float(round(imp * 100, 1)),
                "value": str(val)
            })

        factors.sort(key=lambda x: x["importance"], reverse=True)

        return prob, factors

# Global singleton model instance
ml_model = RecoveryMLModel()
ml_model.train_synthetic()
