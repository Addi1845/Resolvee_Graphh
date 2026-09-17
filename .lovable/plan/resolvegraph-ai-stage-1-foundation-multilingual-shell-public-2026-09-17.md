# ResolveGraph AI — Stage 1: Foundation, Multilingual Shell, Public Homepage

## Understanding

ResolveGraph AI is a grievance-resolution platform that groups related complaints into one real incident, scores its public impact, plans cross-department work, warns about deadline risk, verifies closure evidence, and watches for the problem returning. Two audiences: citizens (simple, reassuring, multilingual) and officers (dense but ordered operations tools).

## Stack reality check

The spec asks for Next.js + FastAPI + Postgres/PostGIS/pgvector. This project runs on TanStack Start (React + TypeScript + Tailwind), which is fixed here. The plan keeps the spec's architecture intent by:

- Keeping all business logic (fusion score, priority score, SLA risk, evidence checks, recurrence) in a service layer with typed repository interfaces, never inside components.
- Backing that layer with Lovable Cloud (Postgres) in a later stage, using real relational tables — complaints separate from incidents, link tables, task dependencies, evidence decisions, audit events.
- Geo and similarity: distance via haversine and text similarity via a scored heuristic in the service layer, so pgvector/PostGIS can replace the implementation without touching callers.
- Stage 1 uses no database; services read from a clearly labelled demo dataset behind the same interfaces.

## Roles and pages (full scope, built in order)

Roles: Citizen, Intake Officer, Field Officer, Department Supervisor, Administrator, Auditor.

Routes:

```text
/                      Public homepage
/report                Complaint submission (4 steps)
/track                 Track by code + tracking detail
/how-it-works, /help   Citizen information
/login                 Sign in
/app/command-centre    Officer dashboard
/app/duplicates        Duplicate review
/app/incidents         Incident list
/app/incidents/$id     Incident workspace (overview, complaints, graph, tasks, evidence, SLA, timeline, audit)
/app/tasks             My tasks
/app/recurrence        Recurrence alerts
/app/analytics         Analytics
/app/admin/*           Departments, categories, SLA rules, priority rules, evidence rules, thresholds, users, languages, notifications
```

## Stage 1 deliverables (this stage only)

1. **Design system** in `src/styles.css` as semantic tokens — navy #153B67, service blue #1677B8, cyan #1AA7C8, green #278B62, orange #F28C28, red #D64545, light bg #F5F8FA, text #17212B, muted #5C6B78. Light only, square-ish corners, clear borders, subtle shadows, generous spacing. Noto Sans + Noto Sans Devanagari loaded via a link tag in the root route.
2. **Multilingual infrastructure** — a lightweight typed i18n provider with `en`, `hi`, `mr` JSON dictionaries, stable nested keys (`nav.report`, `home.hero.title`, `status.in_progress`, `a11y.skipToMain`), language persisted in localStorage plus cookie, locale-aware date/number formatting helpers. No visible string hardcoded in components.
3. **Application shell** — government-service header: logo + "ResolveGraph AI" + subtitle, citizen nav (Home, Report Complaint, Track Complaint, How It Works, Help), language selector `English | हिन्दी | मराठी`, accessibility controls (text size up/down, high contrast, keyboard help), Login button; mobile drawer nav; footer with prototype disclaimer, accessibility and privacy links. Skip-to-main link, visible focus rings, labelled controls.
4. **Public homepage** — hero with the specified heading, supporting text, Report / Track actions, emergency disclaimer banner; sections for how the process works, complaint categories, submission methods, tracking explanation, multilingual note, FAQ accordion, accessibility and privacy. Real service copy in all three languages, no placeholder text.
5. **Head metadata** per route, and a visible "Prototype — synthetic demo data" marker.

Stage 1 ends with verification: desktop and mobile layouts, all three languages rendering, language surviving refresh, keyboard navigation.

## Following stages (not built yet)

2. Complaint submission flow → 3. Tracking page → 4. Lovable Cloud schema, auth, roles and row-level security → 5. Command Centre → 6. Duplicate Review → 7. Incident workspace → 8. Resolution Graph → 9. SLA risk (labelled "Rule-based SLA Risk") → 10. Evidence verification → 11. Recurrence monitoring → 12. Administration → 13. Seed demo scenarios (water-main leak near College Road with twelve multilingual complaints; exposed electrical wire near a school) and final testing.

## Technical notes

- Maps (Leaflet) and the Resolution Graph (React Flow) are browser-only; they will be loaded after hydration behind a client-only boundary when those stages arrive.
- Recharts is already available for analytics.
- No automatic merging, no invented SLA deadlines, no claims of a trained model; every automated output is presented as a suggestion with an explanation and a human decision.
