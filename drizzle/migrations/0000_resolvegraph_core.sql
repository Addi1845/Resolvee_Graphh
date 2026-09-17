-- Roles
CREATE TYPE public.app_role AS ENUM ('citizen','intake_officer','field_officer','supervisor','admin','auditor');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile write" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('intake_officer','field_officer','supervisor','admin','auditor')
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'citizen')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Departments
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_hi TEXT NOT NULL,
  name_mr TEXT NOT NULL
);
GRANT SELECT ON public.departments TO authenticated, anon;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "departments public read" ON public.departments FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.departments (code, name_en, name_hi, name_mr) VALUES
 ('water','Water Supply','जल आपूर्ति','पाणीपुरवठा'),
 ('roads','Roads and Footpaths','सड़क एवं फुटपाथ','रस्ते व पदपथ'),
 ('electricity','Electricity and Street Lighting','बिजली एवं स्ट्रीट लाइट','वीज व पथदिवे'),
 ('sanitation','Sanitation and Waste','स्वच्छता एवं कचरा','स्वच्छता व कचरा'),
 ('drainage','Drainage and Flooding','जल निकासी एवं बाढ़','जलनिस्सारण व पूर'),
 ('safety','Public Safety','सार्वजनिक सुरक्षा','सार्वजनिक सुरक्षा'),
 ('health','Public Health','सार्वजनिक स्वास्थ्य','सार्वजनिक आरोग्य'),
 ('other','Unassigned','अवर्गीकृत','अवर्गीकृत');

-- Complaints
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  location_text TEXT NOT NULL,
  landmark TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  reporter_name TEXT,
  reporter_contact TEXT,
  reporter_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id),
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'submitted',
  due_date DATE,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read complaints" ON public.complaints FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "own complaints read" ON public.complaints FOR SELECT TO authenticated USING (auth.uid() = reporter_user_id);
CREATE POLICY "staff update complaints" ON public.complaints FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()) AND NOT public.has_role(auth.uid(),'auditor'));

CREATE TABLE public.complaint_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  actor_name TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.complaint_updates TO authenticated;
GRANT ALL ON public.complaint_updates TO service_role;
ALTER TABLE public.complaint_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read updates" ON public.complaint_updates FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert updates" ON public.complaint_updates FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND NOT public.has_role(auth.uid(),'auditor'));

CREATE INDEX complaints_created_idx ON public.complaints (created_at DESC);
CREATE INDEX complaint_updates_complaint_idx ON public.complaint_updates (complaint_id, created_at);
