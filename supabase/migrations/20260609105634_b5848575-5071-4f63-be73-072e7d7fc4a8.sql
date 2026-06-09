
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Photos
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  title TEXT,
  alt_text TEXT NOT NULL DEFAULT '',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order INT NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  width INT,
  height INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.photos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.photos TO authenticated;
GRANT ALL ON public.photos TO service_role;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read photos" ON public.photos FOR SELECT USING (true);
CREATE POLICY "Admins manage photos" ON public.photos FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER photos_updated_at BEFORE UPDATE ON public.photos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX photos_category_idx ON public.photos(category_id);
CREATE INDEX photos_featured_idx ON public.photos(featured) WHERE featured = TRUE;

-- Site content (key/value)
CREATE TABLE public.site_content (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read content" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "Admins manage content" ON public.site_content FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER site_content_updated_at BEFORE UPDATE ON public.site_content FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed default content
INSERT INTO public.site_content (key, value) VALUES
  ('hero', '{"title":"Nieve Blyth Photography","subtitle":"Quiet moments, beautifully kept.","cta":"Book a Session"}'),
  ('intro', '{"heading":"A studio devoted to honest, timeless imagery.","body":"From portraits to landscapes, weddings to everyday life — every frame is made with patience, care, and an eye for the light that makes a moment feel like itself."}'),
  ('about', '{"heading":"About Nieve","body":"Nieve Blyth is a photographer drawn to natural light, soft tones, and the small details that make a story feel true. Working across portrait, wedding, family, and landscape photography, she creates images that feel like the moments themselves — unhurried, considered, and quietly luxurious.","portraitUrl":""}'),
  ('contact', '{"email":"nieve_blyth@icloud.com","facebookUrl":"","instagramUrl":""}');

-- Booking enquiries
CREATE TABLE public.booking_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  event_type TEXT,
  preferred_date DATE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.booking_enquiries TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.booking_enquiries TO authenticated;
GRANT ALL ON public.booking_enquiries TO service_role;
ALTER TABLE public.booking_enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit booking" ON public.booking_enquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read bookings" ON public.booking_enquiries FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update bookings" ON public.booking_enquiries FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete bookings" ON public.booking_enquiries FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Contact messages
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contact" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read contacts" ON public.contact_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete contacts" ON public.contact_messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Seed default categories
INSERT INTO public.categories (slug, name, sort_order) VALUES
  ('portrait', 'Portrait', 10),
  ('wedding', 'Wedding', 20),
  ('family', 'Family', 30),
  ('landscape', 'Landscape', 40),
  ('lifestyle', 'Lifestyle', 50);

-- Auto-promote first user to admin via trigger
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created_bootstrap_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.bootstrap_first_admin();
