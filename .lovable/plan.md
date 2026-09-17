# Split ResolveGraph AI into backend (Render) + frontend (Vercel)

## Outcome
A clean GitHub repo under your account with two folders — `backend/` (Express API on Render) and `frontend/` (Vite SPA on Vercel) — sharing one `supabase/` migrations folder and a `shared/` module, both talking to the same Lovable Cloud database and the same AI tools. No Lovable branding text anywhere; the Lovable npm packages are removed entirely.

## Important trade-offs (read before approving)
1. **This ends in-editor Lovable development.** After the split, the Lovable preview stops working (the project root is no longer a runnable TanStack Start app). You develop in your own IDE (clone the GitHub repo) and deploy from there. The Lovable GitHub sync is used only as the one-time delivery mechanism to get the repo onto your GitHub account.
2. **Privileged database key limitation.** Today some operations (cross-user duplicate scanning, signed media URLs, public complaint insert) use a privileged service key. Lovable Cloud does **not** expose that key. On Render against Lovable Cloud, those operations run under the caller's own login + Row-Level-Security instead, so: public (no-account) complaint submission and cross-user duplicate suggestions degrade. For full parity on Render, you connect **your own** Supabase project (which gives you a service key) — the database and AI tools still work the same way. You decide later; the code is written to work with Lovable Cloud now and upgrade cleanly.
3. **AI Gateway domain.** The AI calls hit `ai.gateway.lovable.dev` (the domain literally contains "lovable"). This is infrastructure, not branding a judge reads, so I keep it. If you want zero "lovable" strings, the alternative is your own OpenAI/Google key on Render — say so and I switch the backend to that.

## Repo layout
```
/
├─ backend/            Express API (Render)
│  ├─ src/
│  │  ├─ index.ts      server bootstrap + CORS
│  │  ├─ auth.ts       verify Supabase JWT from Authorization header
│  │  ├─ supabase.ts   publishable-key + (optional) service-key client
│  │  ├─ routes/       one file per resource (complaints, dashboard, duplicates, verifications, voice)
│  │  ├─ ai/           triage.ts (Responses API), transcribe.ts — server-side, LOVABLE_API_KEY
│  │  └─ lib/          policy, routing, duplicate scoring (copied from shared)
│  ├─ package.json     express, @supabase/supabase-js, zod, drizzle-orm, postgres
│  └─ .env.example
├─ frontend/          Vite + React SPA (Vercel)
│  ├─ src/
│  │  ├─ routes/       TanStack Router (client-side), no SSR, no server fns
│  │  ├─ components/   existing UI preserved as-is
│  │  ├─ i18n, integrations/supabase (browser client), lib/api.ts (fetch wrapper)
│  │  └─ styles.css
│  ├─ vite.config.ts   plain Vite (React + Tailwind + path alias) — no Lovable config pkg
│  ├─ package.json    no @lovable.dev/* packages
│  └─ .env.example     VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_API_BASE_URL
├─ shared/            types, constants, policy, routing, i18n strings — imported by both
├─ supabase/          existing migrations (unchanged)
├─ README.md          project README, no Lovable mentions
└─ .gitignore
```

## Backend (Express) — endpoints mapped from the 14 existing server functions
| Method | Path | Auth | From |
|---|---|---|---|
| POST | /api/complaints | public (optional JWT) | submitComplaint |
| POST | /api/complaints/track | public | trackComplaint |
| GET | /api/complaints/mine | citizen | listMyComplaints |
| GET | /api/complaints | staff | listComplaints |
| GET | /api/complaints/:code | staff | getComplaintDetail |
| POST | /api/complaints/:id/evidence | staff | getComplaintEvidence |
| GET | /api/access | any user | getMyAccess |
| GET | /api/tracking | staff | getDepartmentTracking |
| PATCH | /api/complaints/:id/status | staff | updateComplaintStatus |
| GET | /api/duplicates | staff | listDuplicateReview |
| GET | /api/duplicates/clusters | staff | listDuplicateClusters |
| POST | /api/duplicates/:id/review | staff | reviewDuplicateLink |
| GET | /api/verifications | staff | listVerificationQueue |
| POST | /api/verifications | staff | recordVerification |
| POST | /api/voice/transcribe | public | transcribeVoiceNote |

- Auth = verify the Supabase JWT from `Authorization: Bearer <token>` using `supabase.auth.getUser(token)`; on success, query Supabase **as that user** (RLS-enforced) — same security model as today.
- AI triage (`ai/triage.ts`) and voice transcription stay server-side, reading `LOVABLE_API_KEY` inside the handler. Model: `openai/gpt-6-astra` (triage) and `google/gemini-3.5-transcribe` (voice), unchanged.
- CORS: allow the Vercel frontend origin (env-configured).

## Frontend (Vite SPA) changes
- Replace `@lovable.dev/vite-tanstack-config` with a plain `vite.config.ts` (React plugin + Tailwind v4 + `@` alias).
- Drop `@tanstack/react-start` (server fns, loaders, SSR). Keep `@tanstack/react-router` for **client-side** routing.
- Every `useServerFn(x)` call site becomes a `fetch(VITE_API_BASE_URL + path)` call wrapped in TanStack Query (same keys/hooks used today). ~9 call sites across report, track, staff-login, my-complaints, dashboard, complaint detail, VoiceInput.
- Auth: Supabase browser client (publishable key) handles sign-in/up; the JWT is sent as Bearer to the backend. Demo-account picker, Leaflet map, Recharts graphs, voice input, and all existing components are preserved unchanged.
- Remove `@lovable.dev/cloud-auth-js` if auth is pure Supabase (verify during build).

## Remove Lovable branding
- Rewrite `README.md` (no "built with Lovable").
- Strip the Lovable comment header from `vite.config.ts`, `AGENTS.md`, error-reporting module, and any code comments referencing Lovable.
- Remove `.lovable/` and `AGENTS.md` from the repo root (they are Lovable-internal).
- The only remaining "lovable" strings are the AI Gateway URL and the `LOVABLE_API_KEY` env var name (infrastructure). See trade-off #3.

## Env files (committed examples, no real secrets)
- `backend/.env.example`: `PORT`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`(optional, blank on Lovable Cloud), `LOVABLE_API_KEY`, `CORS_ORIGIN`.
- `frontend/.env.example`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_API_BASE_URL`.
- Real publishable (anon) keys are safe and included as defaults; service-role keys are never committed.

## Verification (preview won't run after split)
- `cd backend && bun install && bunx tsc --noEmit && bun run dev` → smoke-test each endpoint with `curl` (submit, track, dashboard, voice).
- `cd frontend && bun install && bunx vite build` → build must succeed; run the SPA locally with the backend URL and test complaint submit, track, staff login, dashboard, duplicate cluster, voice input.
- No Lovable preview checks — the Lovable preview is intentionally retired by this change.

## GitHub delivery
- The split is performed in the Lovable project working directory, so the Lovable two-way sync pushes the new `backend/`/`frontend/` structure to your GitHub repo.
- You then connect the repo (Plus menu → GitHub → Connect project) if not already connected.
- After delivery you develop from the GitHub clone in your own IDE.

## Out of scope
- No new product features, no UI/theme changes, no database schema changes.
- No automatic Vercel/Render CI wiring (I provide build commands + env lists; you configure the platforms).
- Switching the AI provider away from the Lovable Gateway (only if you ask — trade-off #3).
