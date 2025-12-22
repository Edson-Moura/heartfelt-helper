-- Create user_gamification table for aggregated gamification stats
CREATE TABLE public.user_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  -- XP & Level
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  -- Streaks
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  streak_freezes_available INTEGER NOT NULL DEFAULT 1,
  streak_freezes_used INTEGER NOT NULL DEFAULT 0,
  -- Currency
  gems INTEGER NOT NULL DEFAULT 0,
  -- Stats
  lessons_completed INTEGER NOT NULL DEFAULT 0,
  battles_won INTEGER NOT NULL DEFAULT 0,
  battles_lost INTEGER NOT NULL DEFAULT 0,
  perfect_exercises INTEGER NOT NULL DEFAULT 0,
  -- Rankings
  weekly_xp INTEGER NOT NULL DEFAULT 0,
  monthly_xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_gamification_user ON public.user_gamification(user_id);
CREATE INDEX idx_user_gamification_weekly_xp ON public.user_gamification(weekly_xp DESC);

-- Enable RLS on user_gamification
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;

-- RLS: users can view their own gamification data
CREATE POLICY "Users can view their own gamification data"
ON public.user_gamification
FOR SELECT
USING (auth.uid() = user_id);

-- RLS: users can insert their own gamification row
CREATE POLICY "Users can insert their own gamification data"
ON public.user_gamification
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS: users can update their own gamification row
CREATE POLICY "Users can update their own gamification data"
ON public.user_gamification
FOR UPDATE
USING (auth.uid() = user_id);

-- Auto-update updated_at on user_gamification
CREATE TRIGGER trg_user_gamification_updated_at
BEFORE UPDATE ON public.user_gamification
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- Create battles table for 1v1 battles
CREATE TABLE public.battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID NOT NULL,
  player2_id UUID NOT NULL,
  battle_type TEXT NOT NULL,
  player1_score INTEGER NOT NULL DEFAULT 0,
  player2_score INTEGER NOT NULL DEFAULT 0,
  winner_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_battles_players ON public.battles(player1_id, player2_id);
CREATE INDEX idx_battles_status ON public.battles(status);

ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;

-- Players can view battles they participate in
CREATE POLICY "Players can view their battles"
ON public.battles
FOR SELECT
USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Player1 (creator) can insert a battle
CREATE POLICY "Players can create battles as player1"
ON public.battles
FOR INSERT
WITH CHECK (auth.uid() = player1_id);

-- Players can update their battles (e.g., scores, status)
CREATE POLICY "Players can update their battles"
ON public.battles
FOR UPDATE
USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Auto-update updated_at on battles
CREATE TRIGGER trg_battles_updated_at
BEFORE UPDATE ON public.battles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- Create events table for global/community events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  event_type TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  rewards JSONB,
  community_goal INTEGER,
  community_progress INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_active ON public.events(active);
CREATE INDEX idx_events_type ON public.events(event_type);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Anyone can view active and past events
CREATE POLICY "Events are viewable by everyone"
ON public.events
FOR SELECT
USING (true);

-- Only service role can manage events
CREATE POLICY "Service role can manage events"
ON public.events
FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role');

-- Auto-update updated_at on events
CREATE TRIGGER trg_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
