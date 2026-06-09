
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin() FROM PUBLIC, anon, authenticated;

-- Storage policies: photos bucket
CREATE POLICY "Public read photos bucket" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
CREATE POLICY "Admins upload photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'photos' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'photos' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'photos' AND public.has_role(auth.uid(),'admin'));
