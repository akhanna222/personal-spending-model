-- Seed data for SpendLens
-- Initial risk pattern templates

INSERT INTO risk_pattern_templates (pattern_type, display_name, description, severity, learning_score)
VALUES
    ('spending_spike', 'Spending Spike', 'Spending increased by >50% compared to historical average', 'medium', 0.7),
    ('income_drop', 'Income Drop', 'Income decreased by >20% compared to previous period', 'high', 0.8),
    ('debt_accumulation', 'Debt Accumulation', 'Increasing loan payments or credit card charges', 'critical', 0.9),
    ('subscription_creep', 'Subscription Creep', 'Accumulation of recurring subscriptions over time', 'low', 0.6),
    ('gambling', 'Gambling Activity', 'Transactions to gambling or betting platforms', 'high', 0.85),
    ('unusual_merchant', 'Unusual Merchant', 'First-time large purchase at unknown merchant', 'medium', 0.5),
    ('time_anomaly', 'Time Anomaly', 'Unusual timing patterns (e.g., late night transactions)', 'medium', 0.55),
    ('category_shift', 'Category Shift', 'Significant increase in spending in a specific category', 'low', 0.6),
    ('cash_withdrawal', 'Cash Withdrawal Pattern', 'Unusual pattern of cash withdrawals', 'medium', 0.65),
    ('foreign_transaction', 'Foreign Transactions', 'Unexpected foreign transactions or currency exchanges', 'medium', 0.7),
    ('late_payment', 'Late Payment Pattern', 'Pattern of late payments or fees', 'high', 0.75),
    ('overdraft', 'Overdraft Pattern', 'Recurring overdraft fees or negative balances', 'critical', 0.9)
ON CONFLICT (pattern_type) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    severity = EXCLUDED.severity,
    updated_at = CURRENT_TIMESTAMP;
