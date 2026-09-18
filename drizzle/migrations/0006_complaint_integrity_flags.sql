ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS integrity_flag text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS integrity_reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS integrity_acknowledged boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS duplicate_suspect boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'complaints_integrity_flag_check'
  ) THEN
    ALTER TABLE public.complaints
      ADD CONSTRAINT complaints_integrity_flag_check
      CHECK (integrity_flag IN ('none', 'suspected_fake', 'cleared'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS complaints_integrity_flag_idx ON public.complaints (integrity_flag);
CREATE INDEX IF NOT EXISTS complaints_duplicate_suspect_idx ON public.complaints (duplicate_suspect);