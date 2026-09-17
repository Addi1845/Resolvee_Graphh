import { createFileRoute } from "@tanstack/react-router";

import { StagePage } from "@/components/pages/StagePage";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track a Complaint — ResolveGraph AI" },
      {
        name: "description",
        content:
          "Use your tracking code to see the status, responsible department, deadline and verified closure evidence for your complaint.",
      },
      { property: "og:title", content: "Track a Complaint — ResolveGraph AI" },
      {
        property: "og:description",
        content: "Check the progress of a complaint using its tracking code.",
      },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  return <StagePage titleKey="pages.track.title" introKey="pages.track.intro" />;
}
