import { createFileRoute } from "@tanstack/react-router";

import { StagePage } from "@/components/pages/StagePage";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Report a Complaint — ResolveGraph AI" },
      {
        name: "description",
        content:
          "Report a civic problem with a description, location and photographs. ResolveGraph AI links related reports and tracks verified resolution.",
      },
      { property: "og:title", content: "Report a Complaint — ResolveGraph AI" },
      {
        property: "og:description",
        content: "Submit a non-emergency grievance in English, Hindi or Marathi.",
      },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  return <StagePage titleKey="pages.report.title" introKey="pages.report.intro" />;
}
