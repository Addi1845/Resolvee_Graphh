-- Which departments a staff member works for. Field officers are limited to
-- their own department; supervisors, admins, intake and auditors see everything.
CREATE TABLE IF NOT EXISTS public.staff_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, department_id)
);

GRANT SELECT ON public.staff_departments TO authenticated;
GRANT ALL ON public.staff_departments TO service_role;
ALTER TABLE public.staff_departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own staff department read" ON public.staff_departments;
CREATE POLICY "own staff department read" ON public.staff_departments
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- Demo field officers are tied to their service.
INSERT INTO public.staff_departments (user_id, department_id)
SELECT u.id, d.id
FROM auth.users u
JOIN public.departments d ON d.code = 'water'
WHERE u.email = 'demo.water@resolvegraph.app'
ON CONFLICT DO NOTHING;

INSERT INTO public.staff_departments (user_id, department_id)
SELECT u.id, d.id
FROM auth.users u
JOIN public.departments d ON d.code = 'roads'
WHERE u.email = 'demo.roads@resolvegraph.app'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Duplicate cluster demo: five separate citizens report one pipeline burst.
-- One report is kept as the working case; the rest are linked to it.
-- ---------------------------------------------------------------------------
DELETE FROM public.complaints WHERE tracking_code LIKE 'RG-2026-CL%';

INSERT INTO public.complaints (
  id, tracking_code, category, title, description, language, location_text, landmark,
  issue_lat, issue_lng, department_id, priority, status, due_date,
  proximity_state, proximity_distance_m, analysis_status, analysis_method,
  suggested_category, analysis_notes, priority_score, priority_band, priority_factors,
  reporter_name, created_at, updated_at
) VALUES
('22222222-2222-4222-8222-000000000001','RG-2026-CL01','water',
 'Main pipeline burst flooding Trimurti Chowk',
 'Demo sample. A main water pipeline has burst at the chowk. Water is running across both lanes, the road edge has caved in and mud has spread over the footpath.',
 'en','Trimurti Chowk, Ward 4','Opposite the bank',
 19.99720,73.78980,(SELECT id FROM public.departments WHERE code='water'),'critical','in_progress', CURRENT_DATE + 1,
 'nearby',18,'completed','ai_vision','water',
 '{"demo":true,"cluster":"trimurti-pipeline","role":"kept","summary":"Pipeline burst with road flooding, surface damage and mud spread."}'::jsonb,
 84,'critical','{"safety":"high","service_disruption":"high"}'::jsonb,
 'Demo reporter A', now() - interval '2 days', now() - interval '6 hours'),
('22222222-2222-4222-8222-000000000002','RG-2026-CL02','water',
 'Water gushing out near the bank at the chowk',
 'Demo sample. Water has been gushing from the road near the bank since morning. The whole lane is wet and traffic is slowed.',
 'en','Trimurti Chowk near bank, Ward 4',NULL,
 19.99732,73.78995,(SELECT id FROM public.departments WHERE code='water'),'high','submitted', CURRENT_DATE + 4,
 'nearby',26,'completed','rule_based_demo','water',
 '{"demo":true,"cluster":"trimurti-pipeline","role":"duplicate","summary":"Same pipeline burst reported by another resident."}'::jsonb,
 68,'high','{"service_disruption":"high"}'::jsonb,
 'Demo reporter B', now() - interval '2 days', now() - interval '2 days'),
('22222222-2222-4222-8222-000000000003','RG-2026-CL03','water',
 'Road caved in where water is leaking',
 'Demo sample. The road surface has sunk near the leak and two-wheelers are skidding on the wet mud.',
 'en','Trimurti Chowk, Ward 4','Beside the bus stop',
 19.99705,73.78962,(SELECT id FROM public.departments WHERE code='water'),'high','submitted', CURRENT_DATE + 4,
 'nearby',31,'completed','rule_based_demo','water',
 '{"demo":true,"cluster":"trimurti-pipeline","role":"duplicate","summary":"Surface damage caused by the same leak."}'::jsonb,
 70,'high','{"safety":"high"}'::jsonb,
 'Demo reporter C', now() - interval '1 day', now() - interval '1 day'),
('22222222-2222-4222-8222-000000000004','RG-2026-CL04','water',
 'No water at home since the pipeline broke',
 'Demo sample. Supply has stopped in our building since the pipe broke at the chowk nearby.',
 'en','Shivneri Apartments, Ward 4','200 m from Trimurti Chowk',
 19.99688,73.79020,(SELECT id FROM public.departments WHERE code='water'),'medium','submitted', CURRENT_DATE + 5,
 'uncertain',NULL,'completed','rule_based_demo','water',
 '{"demo":true,"cluster":"trimurti-pipeline","role":"duplicate","summary":"Supply loss caused by the same burst."}'::jsonb,
 58,'medium','{"service_disruption":"high"}'::jsonb,
 'Demo reporter D', now() - interval '1 day', now() - interval '1 day'),
('22222222-2222-4222-8222-000000000005','RG-2026-CL05','water',
 'Muddy water spreading over the footpath',
 'Demo sample. Dirty water and mud from the leak have covered the footpath and people are walking on the road.',
 'en','Trimurti Chowk footpath, Ward 4',NULL,
 19.99748,73.78955,(SELECT id FROM public.departments WHERE code='water'),'medium','submitted', CURRENT_DATE + 5,
 'nearby',44,'completed','rule_based_demo','water',
 '{"demo":true,"cluster":"trimurti-pipeline","role":"duplicate","summary":"Mud and dirty water from the same burst."}'::jsonb,
 55,'medium','{"health":"medium"}'::jsonb,
 'Demo reporter E', now() - interval '20 hours', now() - interval '20 hours');

INSERT INTO public.complaint_departments (complaint_id, department_id, role, source, reason)
SELECT r.complaint_id, d.id, r.role, 'demo_seed', r.reason
FROM (VALUES
 ('22222222-2222-4222-8222-000000000001'::uuid,'water','primary','Accountable owner: the burst main belongs to water supply.'),
 ('22222222-2222-4222-8222-000000000001'::uuid,'roads','supporting','Road surface restoration after the excavation.'),
 ('22222222-2222-4222-8222-000000000001'::uuid,'sanitation','supporting','Clearing the mud and dirty water left behind.'),
 ('22222222-2222-4222-8222-000000000002'::uuid,'water','primary','Accountable owner for the leak.'),
 ('22222222-2222-4222-8222-000000000003'::uuid,'water','primary','Accountable owner for the leak.'),
 ('22222222-2222-4222-8222-000000000003'::uuid,'roads','supporting','Surface repair once the leak is stopped.'),
 ('22222222-2222-4222-8222-000000000004'::uuid,'water','primary','Accountable owner for the supply loss.'),
 ('22222222-2222-4222-8222-000000000005'::uuid,'water','primary','Accountable owner for the leak.'),
 ('22222222-2222-4222-8222-000000000005'::uuid,'sanitation','supporting','Clean-up of the affected footpath.')
) AS r(complaint_id, dept_code, role, reason)
JOIN public.departments d ON d.code = r.dept_code;

-- Four links point at the kept case. Three are already confirmed by an officer,
-- one is still waiting for a decision so the review action can be demonstrated.
INSERT INTO public.complaint_duplicates (complaint_id, related_complaint_id, similarity, reason, state, source, reviewed_at)
VALUES
 ('22222222-2222-4222-8222-000000000002','22222222-2222-4222-8222-000000000001',
  91.0,'Same problem type (water); pins are 18 m apart; shared wording: water, chowk, road','confirmed','rule_based_demo', now() - interval '1 day'),
 ('22222222-2222-4222-8222-000000000003','22222222-2222-4222-8222-000000000001',
  86.0,'Same problem type (water); pins are 25 m apart; shared wording: water, leak, road','confirmed','rule_based_demo', now() - interval '20 hours'),
 ('22222222-2222-4222-8222-000000000005','22222222-2222-4222-8222-000000000001',
  79.0,'Same problem type (water); pins are 33 m apart; shared wording: water, mud, footpath','confirmed','rule_based_demo', now() - interval '12 hours'),
 ('22222222-2222-4222-8222-000000000004','22222222-2222-4222-8222-000000000001',
  63.0,'Same problem type (water); pins are 48 m apart; shared wording: water, pipeline, chowk','suggested','rule_based_demo', NULL);

INSERT INTO public.complaint_updates (complaint_id, status, note) VALUES
 ('22222222-2222-4222-8222-000000000001','acknowledged','Demo sample. Intake desk acknowledged the report.'),
 ('22222222-2222-4222-8222-000000000001','assigned','Demo sample. Kept as the working case for this location; related reports linked to it.'),
 ('22222222-2222-4222-8222-000000000001','in_progress','Demo sample. Water crew shutting the valve; roads and sanitation informed.');