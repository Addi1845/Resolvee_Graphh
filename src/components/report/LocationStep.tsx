import { lazy, Suspense, useEffect, useState } from "react";
import { Crosshair, Info, MapPin } from "lucide-react";

import { useI18n } from "@/i18n";
import {
  LOCATION_POLICY,
  evaluateProximity,
  isInNashik,
  type DeviceObservation,
} from "@/lib/policy";

const NashikLocationPicker = lazy(() => import("@/components/map/NashikLocationPicker"));

const fieldClass =
  "mt-1.5 block w-full rounded-sm border border-border-strong bg-surface px-3 py-3 text-base text-foreground outline-none focus:border-secondary focus:ring-2 focus:ring-ring";

export type LocationDraft = {
  locationText: string;
  landmark: string;
  issue: { lat: number; lng: number } | null;
  device: DeviceObservation | null;
};

export function LocationStep({
  value,
  onChange,
}: {
  value: LocationDraft;
  onChange: (next: LocationDraft) => void;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => setMapReady(true), []);

  function shareLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setMessage(t("app.location.unsupported"));
      return;
    }
    setBusy(true);
    setMessage(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const observation: DeviceObservation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracyM: position.coords.accuracy,
          observedAt: new Date().toISOString(),
        };
        if (!isInNashik(observation)) {
          setMessage(t("app.location.outsideNashik"));
          setBusy(false);
          return;
        }
        onChange({
          ...value,
          device: observation,
          // The map pin always comes from the device GPS — never from tapping the map.
          issue: { lat: observation.lat, lng: observation.lng },
        });
        setBusy(false);
      },
      () => {
        setMessage(t("app.location.denied"));
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  const proximity = evaluateProximity(value.issue, value.device);

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="location" className="text-sm font-semibold text-foreground">
          {t("app.report.locationLabel")}
        </label>
        <input
          id="location"
          value={value.locationText}
          onChange={(event) => onChange({ ...value, locationText: event.target.value })}
          placeholder={t("app.report.locationPlaceholder")}
          className={fieldClass}
          required
        />
      </div>

      <div>
        <label htmlFor="landmark" className="text-sm font-semibold text-foreground">
          {t("app.report.landmarkLabel")}{" "}
          <span className="font-normal text-muted-foreground">({t("app.common.optional")})</span>
        </label>
        <input
          id="landmark"
          value={value.landmark}
          onChange={(event) => onChange({ ...value, landmark: event.target.value })}
          className={fieldClass}
        />
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{t("app.location.mapTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("app.location.mapHelp")}</p>
        </div>
        {mapReady ? (
          <Suspense
            fallback={
              <div className="flex h-80 items-center justify-center rounded-sm border border-border bg-muted/30 text-sm text-muted-foreground">
                {t("app.common.loading")}
              </div>
            }
          >
            <NashikLocationPicker value={value.issue} />
          </Suspense>
        ) : (
          <div className="flex h-80 items-center justify-center rounded-sm border border-border bg-muted/30 text-sm text-muted-foreground">
            {t("app.common.loading")}
          </div>
        )}
        {value.issue ? (
          <p className="text-sm font-semibold text-success-foreground">
            {t("app.location.pinSelected", {
              lat: value.issue.lat.toFixed(5),
              lng: value.issue.lng.toFixed(5),
            })}
          </p>
        ) : (
          <p className="text-sm font-semibold text-warning-foreground">
            {t("app.location.pinRequired")}
          </p>
        )}
      </div>

      <div className="rounded-sm border border-border bg-muted/40 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={shareLocation}
            disabled={busy}
            className="inline-flex min-h-12 items-center gap-2 rounded-sm border border-border-strong bg-surface px-5 text-base font-semibold text-foreground hover:bg-muted disabled:opacity-60"
          >
            <Crosshair aria-hidden="true" className="size-4" />
            {busy ? t("app.location.locating") : t("app.location.useCurrent")}
          </button>
          {value.device ? (
            <button
              type="button"
              onClick={() => onChange({ ...value, device: null, issue: null })}
              className="text-sm font-semibold text-secondary underline"
            >
              {t("app.location.clear")}
            </button>
          ) : null}
        </div>

        {value.device ? (
          <dl className="mt-4 space-y-1 text-sm text-foreground">
            <div className="flex items-center gap-2">
              <MapPin aria-hidden="true" className="size-4 text-secondary" />
              <span>{t("app.location.captured")}</span>
            </div>
            <p className="text-muted-foreground">
              {t("app.location.accuracy", { m: Math.round(value.device.accuracyM) })}
            </p>
            <p className="text-muted-foreground">
              {t(`app.location.states.${proximity.state}`)}
              {proximity.distanceM !== null
                ? ` · ${Math.round(proximity.distanceM)} m / ${LOCATION_POLICY.radiusMetres} m`
                : ""}
            </p>
          </dl>
        ) : null}

        {message ? (
          <p role="status" className="mt-3 text-sm font-semibold text-warning-foreground">
            {message}
          </p>
        ) : null}

        <p className="mt-4 flex gap-2 text-sm text-muted-foreground">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{t("app.location.notProof")}</span>
        </p>
      </div>

      <p className="rounded-sm border border-warning/40 bg-warning-soft p-3 text-sm text-warning-foreground">
        {t("app.location.safety")}
      </p>
    </div>
  );
}
