export interface DashboardMetrics {
  revenue_at_risk: number;
  potentially_recoverable: number;
  revenue_recovered: number;
  recovery_rate: number;
  successful_recoveries: number;
  failed_retries: number;
  trend_data: { day: string; recovered: number; at_risk: number }[];
  failure_breakdown: { reason: string; count: number; amount: number }[];
  payment_method_breakdown: { method: string; count: number; amount: number }[];
}

export interface Transaction {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email?: string;
  amount: number;
  currency?: string;
  status: 'FAILED' | 'RECOVERED' | 'RETRY_IN_PROGRESS' | 'STOPPED' | 'REQUIRES_APPROVAL' | 'SUCCESS';
  failure_reason: string;
  payment_method: string;
  recovery_probability: number;
  expected_recovery: number;
  recommended_action: string;
  action_status?: string;
  retry_count: number;
  max_retries?: number;
  requires_human_approval?: boolean;
  best_retry_time?: string;
  ai_confidence?: number;
  ai_explanation?: string;
  ai_message_draft?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  clv: number;
  tier: string;
  historical_success_rate: number;
  churn_risk_score: number;
  subscription_status: string;
  total_failed_amount: number;
  total_recovered_amount: number;
}

export interface AuditLogItem {
  id: number;
  timestamp: string;
  transaction_id: string;
  customer_name: string;
  amount: number;
  action: string;
  reason: string;
  recovery_probability: number;
  expected_recovery: number;
  result: string;
  executed_by: string;
}

export interface SystemSettings {
  max_retries: number;
  high_value_threshold: number;
  auto_retry_enabled: boolean;
  min_confidence_threshold: number;
  razorpay_mode: string;
}

export type TabType = 
  | 'dashboard'
  | 'queue'
  | 'transactions'
  | 'customers'
  | 'analytics'
  | 'command_center'
  | 'simulation'
  | 'audit_logs'
  | 'settings';
