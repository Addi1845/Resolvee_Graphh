-- Duplicate suggestions between related complaints (always human-reviewed).
CREATE TABLE IF NOT EXISTS public.complaint_duplicates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  related_complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  similarity NUMERIC(5,2) NOT NULL DEFAULT 0,
  reason TEXT,
  state TEXT NOT NULL DEFAULT 'suggested',
  source TEXT NOT NULL DEFAULT 'rule_based_demo',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT complaint_duplicates_state_check CHECK (state IN ('suggested','confirmed','rejected')),
  CONSTRAINT complaint_duplicates_distinct CHECK (complaint_id <> related_complaint_id),
  CONSTRAINT complaint_duplicates_unique UNIQUE (complaint_id, related_complaint_id)
);

CREATE INDEX IF NOT EXISTS complaint_duplicates_complaint_idx ON public.complaint_duplicates(complaint_id);
CREATE INDEX IF NOT EXISTS complaint_duplicates_state_idx ON public.complaint_duplicates(state);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaint_duplicates TO authenticated;
GRANT ALL ON public.complaint_duplicates TO service_role;
ALTER TABLE public.complaint_duplicates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read duplicate links" ON public.complaint_duplicates
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff review duplicate links" ON public.complaint_duplicates
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Closure verification decisions (evidence reviewed by a second person).
CREATE TABLE IF NOT EXISTS public.complaint_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  decision TEXT NOT NULL,
  note TEXT,
  reviewer_id UUID,
  reviewer_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT complaint_verifications_decision_check CHECK (decision IN ('verified','rework'))
);

CREATE INDEX IF NOT EXISTS complaint_verifications_complaint_idx ON public.complaint_verifications(complaint_id);

GRANT SELECT, INSERT ON public.complaint_verifications TO authenticated;
GRANT ALL ON public.complaint_verifications TO service_role;
ALTER TABLE public.complaint_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read verifications" ON public.complaint_verifications
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff record verifications" ON public.complaint_verifications
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
