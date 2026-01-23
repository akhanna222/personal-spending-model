-- SpendLens Database Schema
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(50) DEFAULT 'light',
    currency VARCHAR(10) DEFAULT 'USD',
    date_format VARCHAR(50) DEFAULT 'YYYY-MM-DD',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Bank statements table
CREATE TABLE IF NOT EXISTS bank_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_transactions INTEGER DEFAULT 0,
    date_range_start DATE,
    date_range_end DATE,
    metadata JSONB
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    statement_id UUID REFERENCES bank_statements(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    transaction_text TEXT NOT NULL,
    payment_in DECIMAL(15, 2) DEFAULT 0,
    payment_out DECIMAL(15, 2) DEFAULT 0,
    balance DECIMAL(15, 2),
    transaction_description TEXT,
    transaction_primary VARCHAR(100),
    transaction_detailed VARCHAR(100),
    confidence_score DECIMAL(3, 2),
    is_reviewed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Risk pattern templates table
CREATE TABLE IF NOT EXISTS risk_pattern_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pattern_type VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20) DEFAULT 'medium',
    learning_score DECIMAL(3, 2) DEFAULT 0.5,
    total_detections INTEGER DEFAULT 0,
    accurate_feedbacks INTEGER DEFAULT 0,
    success_rate DECIMAL(5, 4) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User risk patterns table
CREATE TABLE IF NOT EXISTS user_risk_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    pattern_type VARCHAR(100) NOT NULL,
    pattern_name VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20) DEFAULT 'medium',
    confidence DECIMAL(3, 2),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    affected_transactions JSONB,
    timeframe VARCHAR(100),
    amount_involved DECIMAL(15, 2),
    recommendation TEXT,
    is_dismissed BOOLEAN DEFAULT FALSE,
    dismissed_at TIMESTAMP
);

-- Risk pattern feedback table
CREATE TABLE IF NOT EXISTS risk_pattern_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    pattern_id UUID REFERENCES user_risk_patterns(id) ON DELETE CASCADE,
    template_id UUID REFERENCES risk_pattern_templates(id) ON DELETE SET NULL,
    is_accurate BOOLEAN,
    is_relevant BOOLEAN,
    is_actionable BOOLEAN,
    notes TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_bank_statements_user_id ON bank_statements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_risk_patterns_user_id ON user_risk_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_user_risk_patterns_detected_at ON user_risk_patterns(detected_at);
CREATE INDEX IF NOT EXISTS idx_risk_feedback_user_id ON risk_pattern_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_feedback_pattern_id ON risk_pattern_feedback(pattern_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risk_templates_updated_at BEFORE UPDATE ON risk_pattern_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
