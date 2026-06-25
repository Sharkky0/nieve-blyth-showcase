
-- form_rate_limits: explicit admin policies
CREATE POLICY "Admins read rate limits"
  ON public.form_rate_limits FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete rate limits"
  ON public.form_rate_limits FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- security_events: explicit INSERT policy (service role bypasses RLS for actual writes)
CREATE POLICY "Admins insert security events"
  ON public.security_events FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- photos bucket: restrict public reads to files that are actually listed in the public photos table
DROP POLICY IF EXISTS "Public read photos bucket" ON storage.objects;

CREATE POLICY "Public read listed photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'photos'
    AND name IN (SELECT storage_path FROM public.photos)
  );
