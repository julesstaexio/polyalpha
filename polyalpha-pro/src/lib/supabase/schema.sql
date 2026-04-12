-- PolyAlpha Pro Database Schema

-- Enable crypto for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── CLOB API Credentials (encrypted at rest) ───
CREATE TABLE IF NOT EXISTS clob_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  wallet_address TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  secret_encrypted TEXT NOT NULL,
  passphrase_encrypted TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clob_credentials_user ON clob_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_clob_credentials_wallet ON clob_credentials(wallet_address);

-- ─── Bot Configurations (must come before trades due to FK) ───
CREATE TABLE IF NOT EXISTS bot_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  strategy TEXT NOT NULL CHECK (strategy IN ('threshold', 'mean_reversion', 'momentum', 'ai_signal', 'custom')),
  params JSONB NOT NULL DEFAULT '{}',
  market_filters JSONB DEFAULT '{}',
  risk_limits JSONB NOT NULL DEFAULT '{"maxPositionPerMarket": 100, "dailyLossLimit": 50, "maxOpenPositions": 5, "stopLossPercent": 20}',
  status TEXT DEFAULT 'stopped' CHECK (status IN ('running', 'stopped', 'error', 'paused')),
  total_pnl DECIMAL(18, 6) DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  win_rate DECIMAL(5, 2) DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bot_configs_user ON bot_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_configs_status ON bot_configs(status);

-- ─── Trades ───
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  market_id TEXT NOT NULL,
  condition_id TEXT NOT NULL,
  market_question TEXT,
  side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
  outcome TEXT NOT NULL CHECK (outcome IN ('Yes', 'No')),
  price DECIMAL(10, 6) NOT NULL,
  size DECIMAL(18, 6) NOT NULL,
  filled_size DECIMAL(18, 6) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'open', 'filled', 'cancelled', 'failed')),
  clob_order_id TEXT,
  tx_hash TEXT,
  bot_id UUID REFERENCES bot_configs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trades_user ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_market ON trades(market_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_bot ON trades(bot_id);

-- ─── Bot Execution Logs ───
CREATE TABLE IF NOT EXISTS bot_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES bot_configs(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('BUY', 'SELL', 'SKIP', 'ERROR')),
  market_id TEXT,
  market_question TEXT,
  reason TEXT,
  trade_id UUID REFERENCES trades(id) ON DELETE SET NULL,
  pnl DECIMAL(18, 6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bot_runs_bot ON bot_runs(bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_runs_created ON bot_runs(created_at DESC);

-- ─── Signals ───
CREATE TABLE IF NOT EXISTS signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  market_id TEXT NOT NULL,
  market_slug TEXT,
  question TEXT,
  category TEXT,
  end_date TEXT,
  poly_prob DECIMAL(5, 4),
  ai_prob DECIMAL(5, 4),
  gap DECIMAL(5, 4),
  signal TEXT CHECK (signal IN ('LONG', 'SHORT', 'NEUTRAL')),
  verdict TEXT,
  confidence DECIMAL(5, 2),
  edge DECIMAL(5, 4),
  analysis_json JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  result TEXT CHECK (result IN ('WIN', 'LOSS', 'PUSH')),
  final_prob DECIMAL(5, 4),
  pnl DECIMAL(18, 6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signals_user ON signals(user_id);
CREATE INDEX IF NOT EXISTS idx_signals_market ON signals(market_id);

-- ─── User Preferences ───
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  default_order_size DECIMAL(18, 6) DEFAULT 10,
  risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
  notification_telegram BOOLEAN DEFAULT FALSE,
  telegram_chat_id TEXT,
  auto_refresh_interval INTEGER DEFAULT 120,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Row Level Security ───
ALTER TABLE clob_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ BEGIN
  CREATE POLICY "Users see own credentials" ON clob_credentials FOR ALL USING (user_id = current_setting('request.jwt.claims')::json->>'sub');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users see own trades" ON trades FOR ALL USING (user_id = current_setting('request.jwt.claims')::json->>'sub');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users see own bots" ON bot_configs FOR ALL USING (user_id = current_setting('request.jwt.claims')::json->>'sub');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users see own bot runs" ON bot_runs FOR ALL USING (bot_id IN (SELECT id FROM bot_configs WHERE user_id = current_setting('request.jwt.claims')::json->>'sub'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users see own signals" ON signals FOR ALL USING (user_id = current_setting('request.jwt.claims')::json->>'sub');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users see own preferences" ON user_preferences FOR ALL USING (user_id = current_setting('request.jwt.claims')::json->>'sub');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
