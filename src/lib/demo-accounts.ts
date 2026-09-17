/**
 * Demo accounts for evaluation and presentations.
 *
 * Synthetic accounts only: they exist so a reviewer can open each role without
 * being handed real credentials. Citizen accounts and official accounts are
 * kept in separate groups, matching the two sign-in pages.
 */

export const DEMO_PASSWORD = "Rg-Demo-2026!x7";

export type DemoAccount = {
  key: string;
  email: string;
  label: string;
  hint: string;
};

export const DEMO_CITIZEN_ACCOUNTS: DemoAccount[] = [
  {
    key: "citizen",
    email: "demo.citizen@resolvegraph.app",
    label: "Citizen",
    hint: "Files reports and follows their own complaints.",
  },
];

export const DEMO_STAFF_ACCOUNTS: DemoAccount[] = [
  {
    key: "intake",
    email: "demo.intake@resolvegraph.app",
    label: "Intake & duplicate review",
    hint: "Checks new reports and suggested duplicate links.",
  },
  {
    key: "water",
    email: "demo.water@resolvegraph.app",
    label: "Water supply officer",
    hint: "Field officer working on water complaints.",
  },
  {
    key: "roads",
    email: "demo.roads@resolvegraph.app",
    label: "Roads & footpaths officer",
    hint: "Field officer working on road complaints.",
  },
  {
    key: "supervisor",
    email: "demo.supervisor@resolvegraph.app",
    label: "Supervisor",
    hint: "Reviews closure evidence and department workload.",
  },
  {
    key: "admin",
    email: "demo.admin@resolvegraph.app",
    label: "Administrator",
    hint: "Full official access across departments.",
  },
  {
    key: "auditor",
    email: "demo.auditor@resolvegraph.app",
    label: "Auditor (read only)",
    hint: "Can read everything, cannot change anything.",
  },
];
