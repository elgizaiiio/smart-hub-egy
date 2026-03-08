
CREATE TABLE public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type text NOT NULL DEFAULT 'support',
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  ai_reply text,
  reply_sent boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage contact_submissions"
  ON public.contact_submissions
  FOR ALL
  USING (true)
  WITH CHECK (true);
