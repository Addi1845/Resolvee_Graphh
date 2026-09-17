import { ExternalLink } from "lucide-react";

import { useI18n } from "@/i18n";
import { MapPanel } from "@/components/map/MapPanel";

/**
 * The reported location of one complaint: the pin the citizen shared, plus a
 * link to open the same spot in a full map for further locating. A pin shows
 * where the report says the problem is, nothing more.
 */
export function ComplaintLocation({
  lat,
  lng,
  title,
  subtitle,
  band,
  locationText,
  height = 240,
  heading,
}: {
  lat: number | null;
  lng: number | null;
  title: string;
  subtitle?: string;
  band?: string | null;
  locationText?: string;
  height?: number;
  heading?: string;
}) {
  const { t } = useI18n();

  if (lat === null || lng === null) {
    return (
      <div className="rounded-sm border border-border bg-muted/30 p-4">
        <p className="text-sm font-semibold text-foreground">{heading ?? t("app.map.single")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("app.map.noLocation")}</p>
        {locationText ? (
          <p className="mt-1 text-sm text-foreground">{locationText}</p>
        ) : null}
      </div>
    );
  }

  const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;

  return (
    <div>
      <MapPanel
        title={heading ?? t("app.map.single")}
        height={height}
        points={[
          {
            id: `${lat}-${lng}`,
            lat,
            lng,
            title,
            band: band ?? null,
            ...(subtitle ? { subtitle } : {}),
          },
        ]}
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {t("app.map.coords", { lat: lat.toFixed(5), lng: lng.toFixed(5) })}
        </p>
        <a
          href={osmUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-secondary underline"
        >
          <ExternalLink aria-hidden="true" className="size-4" />
          {t("app.map.locate")}
        </a>
      </div>
    </div>
  );
}
