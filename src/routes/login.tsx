import { createFileRoute } from "@tanstack/react-router";

import { StagePage } from "@/components/pages/StagePage";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Officer Login — ResolveGraph AI" },
      {
        name: "description",
        content:
          "Sign in for intake officers, field officers, supervisors, administrators and auditors of the ResolveGraph AI platform.",
      },
      { property: "og:title", content: "Officer Login — ResolveGraph AI" },
      { property: "og:description", content: "Staff sign-in for ResolveGraph AI." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return <StagePage titleKey="pages.login.title" introKey="pages.login.intro" />;
}
