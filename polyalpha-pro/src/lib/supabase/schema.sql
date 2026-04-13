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

-- ─── User Profiles (public display names for leaderboard) ───
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  username TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet ON user_profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- Profiles are publicly readable (leaderboard), but only owners can write
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can read profiles" ON user_profiles FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users update own profile" ON user_profiles FOR ALL USING (user_id = current_setting('request.jwt.claims')::json->>'sub');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Leaderboard stats (aggregated by server, public read) ───
CREATE OR REPLACE FUNCTION get_leaderboard(
  p_period TEXT DEFAULT 'all',
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  user_id TEXT,
  wallet_address TEXT,
  username TEXT,
  total_pnl NUMERIC,
  win_count BIGINT,
  loss_count BIGINT,
  total_trades BIGINT,
  win_rate NUMERIC,
  pnl_7d NUMERIC,
  pnl_prev_7d NUMERIC,
  trend TEXT
) LANGUAGE sql STABLE AS $$
  WITH period_filter AS (
    SELECT CASE
      WHEN p_period = '7d'  THEN NOW() - INTERVAL '7 days'
      WHEN p_period = '30d' THEN NOW() - INTERVAL '30 days'
      ELSE '1970-01-01'::TIMESTAMPTZ
    END AS since
  ),
  user_trades AS (
    SELECT
      t.user_id,
      SUM(CASE WHEN t.side = 'SELL' THEN t.price * t.filled_size ELSE -(t.price * t.filled_size) END) AS total_pnl,
      COUNT(*) FILTER (WHERE t.side = 'SELL' AND t.price > 0.5) AS win_count,
      COUNT(*) FILTER (WHERE t.side = 'SELL' AND t.price <= 0.5) AS loss_count,
      COUNT(*) AS total_trades
    FROM trades t, period_filter pf
    WHERE t.status = 'filled' AND t.created_at >= pf.since
    GROUP BY t.user_id
  ),
  recent_pnl AS (
    SELECT
      t.user_id,
      SUM(CASE WHEN t.side = 'SELL' THEN t.price * t.filled_size ELSE -(t.price * t.filled_size) END)
        FILTER (WHERE t.created_at >= NOW() - INTERVAL '7 days') AS pnl_7d,
      SUM(CASE WHEN t.side = 'SELL' THEN t.price * t.filled_size ELSE -(t.price * t.filled_size) END)
        FILTER (WHERE t.created_at >= NOW() - INTERVAL '14 days' AND t.created_at < NOW() - INTERVAL '7 days') AS pnl_prev_7d
    FROM trades t
    WHERE t.status = 'filled'
    GROUP BY t.user_id
  )
  SELECT
    ut.user_id,
    COALESCE(up.wallet_address, '') AS wallet_address,
    up.username,
    ROUND(ut.total_pnl, 2) AS total_pnl,
    ut.win_count,
    ut.loss_count,
    ut.total_trades,
    CASE WHEN ut.total_trades > 0
      THEN ROUND((ut.win_count::NUMERIC / ut.total_trades) * 100, 1)
      ELSE 0
    END AS win_rate,
    COALESCE(ROUND(rp.pnl_7d, 2), 0) AS pnl_7d,
    COALESCE(ROUND(rp.pnl_prev_7d, 2), 0) AS pnl_prev_7d,
    CASE
      WHEN COALESCE(rp.pnl_7d, 0) > COALESCE(rp.pnl_prev_7d, 0) THEN 'up'
      WHEN COALESCE(rp.pnl_7d, 0) < COALESCE(rp.pnl_prev_7d, 0) THEN 'down'
      ELSE 'flat'
    END AS trend
  FROM user_trades ut
  LEFT JOIN user_profiles up ON up.user_id = ut.user_id
  LEFT JOIN recent_pnl rp ON rp.user_id = ut.user_id
  ORDER BY ut.total_pnl DESC
  LIMIT p_limit;
$$;
