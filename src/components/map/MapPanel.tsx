import { Suspense, lazy, useEffect, useState } from "react";
import { MapPin } from "lucide-react";

import { useI18n } from "@/i18n";
import type { MapPoint } from "./ComplaintMap";

const ComplaintMap = lazy(() => import("./ComplaintMap"));

/**
 * Card wrapper around the map. Leaflet touches the browser directly, so the map
 * is only loaded after the page has been rendered in the browser.
 */
export function MapPanel({
  title,
  points,
  height,
}: {
  title?: string;
  points: MapPoint[];
  height?: number;
}) {
  const { t } = useI18n();
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);

  return (
    <section className="rounded-sm border border-border bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-primary">{title ?? t("app.map.title")}</h2>
        <MapPin aria-hidden="true" className="size-5 text-secondary" />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{t("app.map.note")}</p>

      <div className="mt-4">
        {points.length === 0 ? (
          <p className="text-base text-muted-foreground">{t("app.map.empty")}</p>
        ) : ready ? (
          <Suspense
            fallback={<p className="text-base text-muted-foreground">{t("app.common.loading")}</p>}
          >
            <ComplaintMap points={points} height={height} />
          </Suspense>
        ) : (
          <p className="text-base text-muted-foreground">{t("app.common.loading")}</p>
        )}
      </div>
    </section>
  );
}
