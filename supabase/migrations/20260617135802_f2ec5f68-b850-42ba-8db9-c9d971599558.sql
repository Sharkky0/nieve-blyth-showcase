
-- Security event log
CREATE TABLE public.security_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  ip_hash text,
  user_agent text,
  path text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.security_events TO service_role;
GRANT SELECT ON public.security_events TO authenticated;

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read security events"
  ON public.security_events FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete security events"
  ON public.security_events FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX security_events_created_at_idx ON public.security_events (created_at DESC);
CREATE INDEX security_events_type_idx ON public.security_events (event_type);

-- Form rate-limit ledger (server-only)
CREATE TABLE public.form_rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_hash text NOT NULL,
  form_key text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.form_rate_limits TO service_role;

ALTER TABLE public.form_rate_limits ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated => no access via Data API. Service role bypasses RLS.

CREATE INDEX form_rate_limits_lookup_idx
  ON public.form_rate_limits (form_key, ip_hash, created_at DESC);
