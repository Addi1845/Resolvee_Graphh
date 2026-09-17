# Citizen Resolve

I am attaching a detailed product specification named ResolveGraph_AI_Vibe_Coding_Master_Prompt.md.

Read the complete attached file before generating or modifying anything. Treat it as the source of truth for the product logic, features, user roles, database entities, workflows, AI modules and acceptance criteria.

Primary objective

Build a polished, functional and presentation-ready MVP of ResolveGraph AI, an AI-powered complaint and grievance resolution intelligence platform.

This must not look like a generic AI dashboard, dark SaaS template or black-themed admin panel. The interface should feel like a modern, reliable and citizen-friendly government service website.

The website must be simple enough for citizens who are not technically skilled, while still providing powerful operational tools for officers and administrators.

Design direction

Use a bright, clean and accessible government-service design.

Required visual style

White or very light grey page backgrounds

Deep navy blue for the header and primary navigation

Medium blue or cyan for information and active elements

Green for verified, resolved and successful states

Orange for warnings and approaching SLA deadlines

Red only for critical incidents, hazards and destructive actions

Clear borders and subtle shadows

Large readable typography

Generous spacing

Simple icons with text labels

Professional data visualisations

Responsive layouts for desktop, tablet and mobile

Suggested colours:

Primary navy: #153B67

Service blue: #1677B8

Information cyan: #1AA7C8

Verified green: #278B62

Warning orange: #F28C28

Critical red: #D64545

Light background: #F5F8FA

Main text: #17212B

Muted text: #5C6B78

Avoid completely

Black backgrounds

Default dark mode

Neon colours

Purple AI gradients

Glassmorphism

Excessive rounded cards

Random glowing effects

Cryptocurrency-style visuals

Unnecessary animations

Generic robot illustrations

Excessively dense dashboards

Lorem ipsum or meaningless placeholder content

Use subtle motion only for loading, progress, state changes and notifications.

Government website inspiration

The experience should feel similar to a modern Indian digital public-service portal:

Clear service-oriented header

Language selector

Accessibility controls

Strong “Report a Complaint” and “Track Complaint” actions

Simple step-by-step forms

Important notices and emergency disclaimers

Visible complaint tracking number

Transparent status timeline

Department and deadline information

Clear help text

Mobile-friendly citizen experience

Do not use the Indian national emblem, government logos or claim official government affiliation. Use only the ResolveGraph AI identity and clearly label the application as a prototype where appropriate.

Multilanguage support

Implement multilingual support from the beginning.

Initial languages:

English

Hindi

Marathi

Display the language selector prominently in the header:

English | हिन्दी | मराठी

Multilanguage requirements

Store all interface text in translation files.

Do not hardcode visible strings inside components.

Use stable translation keys.

Persist the selected language in a cookie or local storage.

Retain the selected language after page refresh.

Use Noto Sans and Noto Sans Devanagari.

Support Devanagari characters correctly.

Format dates, times and numbers according to the selected locale.

Translate navigation, buttons, instructions, validation messages, status names, notifications and accessibility labels.

Complaint text written by a citizen must remain available in its original language.

If AI translation is shown, label it as “Translated version”.

Do not overwrite the original complaint.

Keep the architecture expandable for additional Indian languages.

Use an i18n library appropriate for the generated framework.

Use these locale codes:

English: en

Hindi: hi

Marathi: mr

Header structure

Create a responsive government-service header containing:

ResolveGraph AI logo and name

Subtitle: “Grievance Resolution Intelligence Platform”

Home

Report Complaint

Track Complaint

How It Works

Help

Language selector

Accessibility controls

Login button

For authenticated officers, replace citizen navigation with:

Command Centre

Incidents

Duplicate Review

My Tasks

Recurrence Alerts

Analytics

Administration

Profile

Public homepage

Create a welcoming public homepage.

Hero section

Heading:

“Report problems. Track action. Verify resolution.”

Supporting text:

“ResolveGraph AI connects related complaints, coordinates responsible departments and helps ensure that reported problems receive verified resolution.”

Primary actions:

Report a Complaint

Track Existing Complaint

Add a visible disclaimer:

“For emergencies or immediate threats to life, contact the appropriate emergency service. This portal handles non-emergency grievances.”

Homepage sections

Include:

How the complaint process works

Supported complaint categories

Ways to submit: text, voice, image and location

Complaint-tracking explanation

Multilingual support

Frequently asked questions

Accessibility and privacy information

Avoid promotional marketing language. Focus on citizen services.

Citizen complaint flow

Build a simple step-by-step complaint form.

Step 1: Describe the issue

Complaint title

Detailed description

Category or “Not sure”

Preferred language

Voice input option

Step 2: Add location

Searchable location

Map pin

Current-location option

Landmark

Privacy explanation

Step 3: Add evidence

Upload or capture images

Add optional voice note

Display file requirements

Show upload progress

Step 4: Review

Show the entered information clearly.

Display AI-extracted suggestions separately:

Suggested category

Detected hazard

Suggested department

Urgency indicators

Allow the citizen to correct these suggestions before submission.

Submission result

After submission, show:

Complaint tracking code

Submission time

Current status

Expected acknowledgement time

Track Complaint button

Download or print acknowledgement option

Complaint tracking page

The tracking page should be understandable without technical knowledge.

Display:

Tracking code

Complaint title

Current status

Responsible department

Submission date

SLA deadline in plain language

Linked incident information

Progress timeline

Public task progress

Resolution evidence summary

Feedback option

Request Review option

Explain the SLA deadline using citizen-friendly text such as:

“The department aims to resolve this complaint by 18 September, 6:00 PM.”

Do not expose officer contact details, private notes or another citizen’s personal information.

Officer Command Centre

Create a professional operations dashboard with:

Total open incidents

Critical incidents

High SLA-risk incidents

Complaints awaiting duplicate review

Blocked tasks

Recurrence alerts

Department workload

Emerging complaint clusters on a map

Use meaningful operational charts only.

Do not fill the screen with unnecessary cards. Establish a clear hierarchy:

Critical alerts

SLA-risk incidents

Emerging clusters

Department workload

Recent activity

Duplicate Review page

Create a side-by-side review interface.

Left side:

New complaint

Description

Category

Location

Evidence

Submission time

Right side:

Candidate incident

Incident summary

Existing complaint count

Distance from incident

Current priority

Responsible department

Explain the comparison using:

Semantic similarity

Geographic similarity

Time similarity

Category match

Evidence similarity

Final fusion score

Actions:

Merge with Incident

Create New Incident

Defer for Manual Review

Never merge automatically in the MVP. Require an authorised officer’s decision.

Incident workspace

The incident page is the most important operational page.

Include:

Incident title and ID

Priority score

Priority explanation

Complaint count

Location and map

Responsible departments

SLA deadline

SLA-risk score

Current owner

Linked citizens count without exposing identities

Incident status

Escalation status

Organise information into these sections:

Overview

Linked Complaints

Resolution Graph

Tasks

Evidence

SLA and Risk

Timeline

Audit History for authorised users

Resolution Graph

Create an interactive graph that shows:

Departments

Assigned tasks

Task dependencies

Completed tasks

Blocked tasks

Evidence status

Due dates

Example:

Water Works repairs the damaged pipeline.

Road Department restores the road after pipeline repair.

Sanitation Department clears standing water after the leak stops.

Use colour carefully:

Grey: pending

Blue: in progress

Orange: blocked or at risk

Green: verified

Red: critical delay

When a user selects a graph node, open the complete task information.

SLA-risk display

For the MVP, label the result clearly as:

“Rule-based SLA Risk”

Show:

Risk percentage

Risk band

Time remaining

Factors contributing to risk

Recommended action

Example:

“78% High Risk”

Contributing factors:

82% of SLA time already used

Two dependent tasks remain incomplete

Department workload is high

One task is currently blocked

Do not claim that XGBoost is active unless a real trained and validated model is connected.

Evidence verification

Create an evidence workspace where officers can upload proof of completed work.

Display:

Required evidence checklist

Uploaded images

Before-and-after comparison

Upload timestamp

Location availability

Automated warnings

Officer note

Verification decision

Possible warnings:

Location unavailable

Required after-repair image missing

Image appears similar to earlier evidence

Capture time predates task assignment

Automated checks should only provide warnings. An authorised supervisor must approve or reject the evidence.

Recurrence monitoring

Create a recurrence-alert page that compares:

New complaint

Previously closed incident

Distance between them

Text similarity

Previous closure date

Previous evidence

Monitoring window

Recurrence confidence

Actions:

Reopen Previous Incident

Create Linked Recurrence Incident

Dismiss Alert with Reason

Administration pages

Create settings for:

Departments

Complaint categories

SLA rules

Priority rules

Required evidence

Incident-fusion thresholds

Users and roles

Languages

Notification settings

The organisation defines SLA deadlines. The AI must not invent official deadlines.

Authentication and user roles

Support these roles:

Citizen

Intake Officer

Field Officer

Department Supervisor

Administrator

Auditor

Enforce permissions in the data and API layer, not only by hiding frontend buttons.

Demo data

Use clearly labelled synthetic demo data.

Create a main incident:

“Major water-main leak near College Road”

Include:

Twelve related complaints with different wording

Complaints submitted in English, Hindi and Marathi

Nearby map coordinates

Water Works task

Road Department task

Sanitation Department task

Task dependencies

High SLA-risk warning

Closure evidence

Recurrence alert after closure

Create a second critical incident:

“Exposed electrical wire near a school”

Use it to demonstrate:

Public-safety risk

Vulnerable location

Critical priority

Short SLA deadline

Immediate escalation

Never present demo complaints as real citizen or government data.

Technical implementation

Follow the architecture in the attached Markdown document.

Preferred architecture:

Next.js or Lovable’s supported React framework

TypeScript

Tailwind CSS

Accessible component library

PostgreSQL or Supabase PostgreSQL

PostGIS for location queries

pgvector for semantic similarity

FastAPI-compatible API service structure

React Flow for the Resolution Graph

Leaflet and OpenStreetMap for maps

Recharts for operational analytics

If Lovable cannot directly create the FastAPI backend, build the frontend and prototype data layer through clean service and repository interfaces. Do not tightly couple business logic to static frontend data.

If Supabase is used:

Use Supabase PostgreSQL

Create proper tables and relationships

Add row-level security

Use Supabase Storage for attachments

Keep AI processing behind secure server-side functions

Never place AI provider keys in browser code

Document how the frontend will connect to the future FastAPI services

Data integrity requirements

Use real relational entities, not one large JSON object.

Keep complaints separate from incidents.

Preserve original complaint text.

Store complaint-to-incident links.

Store priority components.

Store the applied SLA-rule snapshot.

Store task dependencies.

Store evidence decisions.

Store recurrence alerts.

Create audit events for overrides and status changes.

Prevent incidents from closing when mandatory tasks or evidence remain incomplete.

Accessibility

Meet practical WCAG requirements:

Keyboard navigation

Visible focus indicators

Screen-reader labels

Sufficient colour contrast

Text alternatives for meaningful images

Accessible form errors

Do not communicate status through colour alone

Support browser zoom

Minimum comfortable touch-target sizes

“Skip to main content” link

Include controls for:

Increase text size

Decrease text size

High-contrast mode

Keyboard navigation information

Implementation order

Do not generate disconnected pages randomly.

Implement in this order:

Design system and responsive application shell

Multilingual infrastructure

Public homepage

Complaint-submission flow

Complaint-tracking page

Authentication and role-based navigation

Command Centre

Duplicate Review

Incident workspace

Resolution Graph

SLA-risk interface

Evidence verification

Recurrence monitoring

Administration

Seed data and final testing

After each stage:

Preserve previously working functionality.

Test desktop and mobile layouts.

Confirm all visible text works in English, Hindi and Marathi.

Report the files changed.

State which functions use real logic and which still use demo data.

Do not silently leave non-functional buttons.

First task

Start by reading the attached Markdown specification completely.

Then:

Summarise your understanding of ResolveGraph AI.

Identify the required pages and user roles.

Propose the route structure and data model.

Define the visual design system.

Define the English, Hindi and Marathi translation structure.

Create the responsive application shell and public homepage.

Stop after completing and verifying this first stage.

Do not build every feature in one uncontrolled generation. Continue feature by feature while following the attached specification.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/78105dfe-f7b9-4183-af37-b685bf89ad9d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
