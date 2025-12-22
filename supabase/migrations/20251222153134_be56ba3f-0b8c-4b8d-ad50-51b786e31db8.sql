-- Add new fields to profiles table for onboarding
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS learning_goal TEXT,
ADD COLUMN IF NOT EXISTS proficiency_level TEXT,
ADD COLUMN IF NOT EXISTS preferred_training_mode TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Add check constraints for valid values
ALTER TABLE public.profiles
ADD CONSTRAINT valid_proficiency_level 
CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced') OR proficiency_level IS NULL);

ALTER TABLE public.profiles
ADD CONSTRAINT valid_training_mode
CHECK (preferred_training_mode IN ('conversation', 'reading', 'writing', 'balanced') OR preferred_training_mode IS NULL);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON public.profiles(onboarding_completed);