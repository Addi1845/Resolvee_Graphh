-- Citizen ownership + location, analysis and priority fields (all optional)
ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS issue_lat double precision,
  ADD COLUMN IF NOT EXISTS issue_lng double precision,
  ADD COLUMN IF NOT EXISTS device_lat double precision,
  ADD COLUMN IF NOT EXISTS device_lng double precision,
  ADD COLUMN IF NOT EXISTS device_accuracy_m double precision,
  ADD COLUMN IF NOT EXISTS device_observed_at timestamptz,
  ADD COLUMN IF NOT EXISTS proximity_state text NOT NULL DEFAULT 'unavailable',
  ADD COLUMN IF NOT EXISTS proximity_distance_m double precision,
  ADD COLUMN IF NOT EXISTS location_policy_version text NOT NULL DEFAULT 'proximity-v1',
  ADD COLUMN IF NOT EXISTS analysis_status text NOT NULL DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS analysis_method text NOT NULL DEFAULT 'rule_based_demo',
  ADD COLUMN IF NOT EXISTS suggested_category text,
  ADD COLUMN IF NOT EXISTS analysis_notes jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS priority_score integer,
  ADD COLUMN IF NOT EXISTS priority_band text,
  ADD COLUMN IF NOT EXISTS priority_factors jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS priority_policy_version text NOT NULL DEFAULT 'impact-v1';

CREATE INDEX IF NOT EXISTS complaints_created_by_idx ON public.complaints (created_by);
CREATE INDEX IF NOT EXISTS complaints_priority_score_idx ON public.complaints (priority_score DESC);

-- Citizens may read their own complaints through the Data API
DROP POLICY IF EXISTS "Citizens read own complaints" ON public.complaints;
CREATE POLICY "Citizens read own complaints"
ON public.complaints
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

-- Evidence attachments (originals stay in a private bucket)
CREATE TABLE IF NOT EXISTS public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  storage_key text NOT NULL,
  mime_type text NOT NULL,
  byte_size integer NOT NULL,
  kind text NOT NULL DEFAULT 'photo',
  source text NOT NULL DEFAULT 'unknown',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS attachments_complaint_idx ON public.attachments (complaint_id);

GRANT SELECT ON public.attachments TO authenticated;
GRANT ALL ON public.attachments TO service_role;

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff read attachments" ON public.attachments;
CREATE POLICY "Staff read attachments"
ON public.attachments
FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Citizens read own attachments" ON public.attachments;
CREATE POLICY "Citizens read own attachments"
ON public.attachments
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.complaints c
  WHERE c.id = attachments.complaint_id AND c.created_by = auth.uid()
));