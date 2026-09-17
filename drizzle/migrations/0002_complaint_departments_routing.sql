CREATE TABLE public.complaint_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('primary','supporting')),
  source text NOT NULL DEFAULT 'policy',
  reason text,
  confirmed_by uuid,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (complaint_id, department_id)
);

CREATE INDEX complaint_departments_complaint_idx ON public.complaint_departments(complaint_id);
CREATE INDEX complaint_departments_department_idx ON public.complaint_departments(department_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaint_departments TO authenticated;
GRANT ALL ON public.complaint_departments TO service_role;

ALTER TABLE public.complaint_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read complaint routing"
ON public.complaint_departments FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'intake_officer')
  OR public.has_role(auth.uid(), 'field_officer')
  OR public.has_role(auth.uid(), 'supervisor')
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'auditor')
  OR EXISTS (
    SELECT 1 FROM public.complaints c
    WHERE c.id = complaint_departments.complaint_id AND c.created_by = auth.uid()
  )
);

CREATE POLICY "Staff manage complaint routing"
ON public.complaint_departments FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'intake_officer')
  OR public.has_role(auth.uid(), 'supervisor')
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'intake_officer')
  OR public.has_role(auth.uid(), 'supervisor')
  OR public.has_role(auth.uid(), 'admin')
);