-- Add gamification fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS streak_freezes_available INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS gems INTEGER DEFAULT 0;

-- Create daily_challenges table (templates)
CREATE TABLE IF NOT EXISTS daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_type TEXT NOT NULL, -- 'main', 'secondary', 'bonus'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirement_type TEXT NOT NULL, -- 'lessons_completed', 'conversation_minutes', 'pronunciation_perfect', etc
  requirement_value INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL,
  gems_reward INTEGER DEFAULT 0,
  difficulty TEXT NOT NULL, -- 'beginner', 'intermediate', 'advanced'
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_daily_challenges table (tracking)
CREATE TABLE IF NOT EXISTS user_daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, challenge_id, challenge_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_daily_challenges_user_date ON user_daily_challenges(user_id, challenge_date);
CREATE INDEX IF NOT EXISTS idx_user_daily_challenges_completed ON user_daily_challenges(completed) WHERE completed = false;
CREATE INDEX IF NOT EXISTS idx_daily_challenges_active ON daily_challenges(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_challenges
CREATE POLICY "Anyone can view active challenges"
  ON daily_challenges FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role can manage challenges"
  ON daily_challenges FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for user_daily_challenges
CREATE POLICY "Users can view their own challenge progress"
  ON user_daily_challenges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenge progress"
  ON user_daily_challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenge progress"
  ON user_daily_challenges FOR UPDATE
  USING (auth.uid() = user_id);

-- Create update trigger for user_daily_challenges
CREATE OR REPLACE FUNCTION update_user_daily_challenges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER set_user_daily_challenges_updated_at
  BEFORE UPDATE ON user_daily_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_user_daily_challenges_updated_at();

-- Insert initial challenge templates
INSERT INTO daily_challenges (challenge_type, title, description, requirement_type, requirement_value, xp_reward, gems_reward, difficulty, icon) VALUES
('main', 'Complete 3 lições sem erros', 'Finalize três lições com 100% de acertos', 'lessons_perfect', 3, 100, 10, 'intermediate', '📖'),
('main', 'Pratique 10 minutos de conversação', 'Tenha uma conversa em inglês por 10 minutos', 'conversation_minutes', 10, 100, 10, 'beginner', '💬'),
('main', 'Acerte 20 pronúncias perfeitas', 'Pronuncie 20 palavras corretamente na primeira tentativa', 'pronunciation_perfect', 20, 100, 10, 'intermediate', '🎤'),
('secondary', 'Complete 2 lições', 'Finalize duas lições de qualquer nível', 'lessons_completed', 2, 50, 0, 'beginner', '📚'),
('secondary', 'Pratique por 15 minutos', 'Dedique 15 minutos ao aprendizado', 'practice_minutes', 15, 50, 0, 'beginner', '⏱️'),
('secondary', 'Aprenda 10 palavras novas', 'Adicione 10 novas palavras ao seu vocabulário', 'words_learned', 10, 50, 0, 'intermediate', '📝'),
('bonus', 'Mantenha sua sequência', 'Continue sua sequência de dias ativos', 'streak_maintained', 1, 25, 0, 'beginner', '🔥'),
('bonus', 'Pratique 5 exercícios', 'Complete 5 exercícios de qualquer tipo', 'exercises_completed', 5, 25, 0, 'beginner', '✍️'),
('bonus', 'Use o chat por 5 minutos', 'Converse com o assistente por 5 minutos', 'chat_minutes', 5, 25, 0, 'beginner', '💭');

-- Create function to calculate level from XP
CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  IF xp < 100 THEN RETURN 1;
  ELSIF xp < 250 THEN RETURN 2;
  ELSIF xp < 500 THEN RETURN 3;
  ELSIF xp < 1000 THEN RETURN 4;
  ELSIF xp < 2000 THEN RETURN 5;
  ELSIF xp < 3500 THEN RETURN 6;
  ELSIF xp < 5000 THEN RETURN 7;
  ELSIF xp < 7500 THEN RETURN 8;
  ELSIF xp < 10000 THEN RETURN 9;
  ELSIF xp < 15000 THEN RETURN 10;
  ELSIF xp < 20000 THEN RETURN 15;
  ELSIF xp < 30000 THEN RETURN 20;
  ELSIF xp < 50000 THEN RETURN 30;
  ELSIF xp < 75000 THEN RETURN 40;
  ELSIF xp < 100000 THEN RETURN 50;
  ELSE RETURN 50 + ((xp - 100000) / 5000);
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;