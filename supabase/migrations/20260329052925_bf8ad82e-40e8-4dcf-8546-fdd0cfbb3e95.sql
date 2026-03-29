
CREATE TABLE IF NOT EXISTS public.ai_personalization (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  call_name text,
  profession text,
  about text,
  ai_traits text,
  custom_instructions text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_personalization ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own personalization" ON public.ai_personalization FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own personalization" ON public.ai_personalization FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own personalization" ON public.ai_personalization FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
