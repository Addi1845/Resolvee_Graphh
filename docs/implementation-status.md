# Implementation status

Honest status of ResolveGraph AI as built. This prototype is not affiliated with
any government body and contains synthetic demonstration data only.

## Real (persisted and enforced)

- Citizen intake: four-step report wizard (describe, location, photos, review)
  with a device-local draft, English/Hindi/Marathi wording.
- Tracking codes (`RG-YYYY-XXXXXX`) and public status lookup by code.
- Photo evidence: up to 5 images, downscaled in the browser, stored in a
  **private** storage bucket; staff and the owning citizen view them through
  short-lived signed links only.
- Optional issue location and device location observation, stored with the
  reported accuracy and observation time.
- Accounts, roles (`citizen`, `intake_officer`, `field_officer`, `supervisor`,
  `admin`, `auditor`) in a separate `user_roles` table with row-level security.
- Citizen "My complaints" list for reports submitted while signed in.
- Staff dashboard: queue summary, status/category/sort filters, status updates
  written to an append-only complaint timeline.

## Rule-based, labelled as such in the UI

- Category suggestion (`Demo / rule-based analysis`) — keyword matching, never a
  trained model, and always confirmed by a person before routing is trusted.
- Impact score (`impact-v1`): weighted factors (safety 0.35, severity 0.25,
  service disruption 0.15, sensitive site 0.10, age pressure 0.10,
  corroboration 0.05); bands Low <30, Medium 30-54, High 55-74, Critical >=75.
  Unknown inputs are excluded and shown as unknown, not guessed.
- Proximity check (`proximity-v1`): 150 m radius, 120 s freshness window, 200 m
  accuracy ceiling. Results are `unavailable`, `stale`, `uncertain`, `nearby`,
  `outside` or `boundary`. A device location is a signal, never proof of
  presence, and "outside" never means a report is false.

- Duplicate suggestions (`duplicate-v1`): same category, within 150 m, within 30
  days, shared wording. Suggestions only — an officer confirms or rejects each
  link; nothing is merged automatically.
- Closure verification: complaints awaiting verification are listed for staff,
  who accept the evidence (resolved) or send it back for rework. Every decision
  is stored with a note and written to the complaint timeline.
- Optional video evidence: one clip per report, stored privately alongside the
  photos. The model reads only the photos; video is evidence for officers.
- Synthetic demo complaints (`RG-2026-DEMO01`…`DEMO10`) covering all
  departments, statuses, priorities, multi-department routing, duplicates and
  verification history. Clearly labelled "Demo sample".

## Partial

- Deadlines: complaints currently carry a fixed 7-day target date. Configurable
  per-department SLA policies with stored policy snapshots are not built yet.
- Staff scoping: staff see all complaints; department and jurisdiction scoping
  is not implemented.
- Video and voice notes are not accepted yet; photos only.

## Not built yet

- Incident grouping, duplicate review queue, cross-department tasks and
  dependencies.
- Evidence/closure review workflow with independent verification.
- Recurrence monitoring, admin department/policy/analytics/audit screens.
- Notifications.

## Explicit non-claims

- No emergency dispatch. Emergencies must go to the appropriate emergency service.
- No automatic closure, no autonomous rejection, no guaranteed fake-media
  detection. Missing photo metadata means unavailable, not fraudulent.
- No official endorsement, and no comparison claims about other systems.
