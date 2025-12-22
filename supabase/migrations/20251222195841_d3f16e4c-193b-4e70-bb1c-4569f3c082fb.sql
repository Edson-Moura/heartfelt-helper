-- Create testimonials table
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- We intentionally do NOT add a foreign key to auth.users to avoid coupling to auth schema
  user_id UUID,
  -- Student data
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT,
  age INTEGER,
  location TEXT,
  -- Content
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  before TEXT,
  after TEXT,
  -- Media
  video_url TEXT,
  image_url TEXT,
  -- Metrics
  days_using INTEGER,
  lessons_completed INTEGER,
  level_start TEXT,
  level_current TEXT,
  -- Meta / moderation
  verified BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  approved BOOLEAN DEFAULT false,
  platform TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on testimonials
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Only expose approved testimonials publicly
CREATE POLICY "Public can view approved testimonials" 
ON public.testimonials
FOR SELECT
USING (approved = true);

-- Users can insert their own testimonials, but cannot self-approve/verify/feature unless service_role
CREATE POLICY "Users can insert own testimonials" 
ON public.testimonials
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (user_id IS NULL OR user_id = auth.uid())
  AND (
    (auth.jwt() ->> 'role') = 'service_role'
    OR (
      approved IS NOT TRUE
      AND verified IS NOT TRUE
      AND featured IS NOT TRUE
    )
  )
);

-- Users can update their own testimonials (content only), approvals reserved for service_role
CREATE POLICY "Users can update own testimonials" 
ON public.testimonials
FOR UPDATE
USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
WITH CHECK (
  auth.uid() = user_id
  AND (
    (auth.jwt() ->> 'role') = 'service_role'
    OR (
      approved IS NOT TRUE
      AND verified IS NOT TRUE
      AND featured IS NOT TRUE
    )
  )
);

-- Service role can manage testimonials fully
CREATE POLICY "Service role can manage testimonials" 
ON public.testimonials
AS PERMISSIVE
FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- Indexes for common queries on public testimonials
CREATE INDEX IF NOT EXISTS idx_testimonials_featured 
ON public.testimonials(featured)
WHERE approved = true;

CREATE INDEX IF NOT EXISTS idx_testimonials_rating 
ON public.testimonials(rating)
WHERE approved = true;

-- Trigger to keep updated_at in sync for testimonials
CREATE TRIGGER set_timestamp_testimonials
BEFORE UPDATE ON public.testimonials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- Create nps_responses table
CREATE TABLE IF NOT EXISTS public.nps_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Again, keep a loose reference to user id without FK to auth.users
  user_id UUID,
  score INTEGER CHECK (score >= 0 AND score <= 10),
  feedback TEXT,
  category TEXT, -- 'promoter' | 'neutral' | 'detractor'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on nps_responses
ALTER TABLE public.nps_responses ENABLE ROW LEVEL SECURITY;

-- Users can insert their own NPS responses
CREATE POLICY "Users can insert own nps responses" 
ON public.nps_responses
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- Users can view their own NPS responses
CREATE POLICY "Users can view own nps responses" 
ON public.nps_responses
FOR SELECT
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Service role can manage all NPS responses
CREATE POLICY "Service role can manage nps responses" 
ON public.nps_responses
AS PERMISSIVE
FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');