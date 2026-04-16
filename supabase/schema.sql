-- BodhiWords Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  name        TEXT,
  level       TEXT NOT NULL DEFAULT 'B1',
  streak      INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- DAILY SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.daily_sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  word_ids    TEXT[] NOT NULL DEFAULT '{}',
  completed   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions" ON public.daily_sessions
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- USER PROGRESS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_progress (
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  word_id       TEXT NOT NULL,
  correct_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'new',  -- new | weak | learning | mastered
  last_seen     TIMESTAMPTZ,
  next_review   TIMESTAMPTZ,
  PRIMARY KEY (user_id, word_id)
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own progress" ON public.user_progress
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- TEST RESULTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.test_results (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  word_id       TEXT NOT NULL,
  question_type TEXT NOT NULL,    -- mcq_meaning | mcq_reverse | fill_blank
  correct       BOOLEAN NOT NULL,
  session_date  DATE NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own results" ON public.test_results
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTION: Auto-create user row on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, level, streak)
  VALUES (NEW.id, NEW.email, 'B1', 0)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_daily_sessions_user_date ON public.daily_sessions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_user ON public.test_results(user_id);
