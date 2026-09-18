import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, MapPin, ShieldAlert } from "lucide-react";

import { useI18n } from "@/i18n";
import { isInNashik, type DeviceObservation } from "@/lib/policy";

type GateState = "checking" | "outside" | "blocked";

/**
 * Shown as soon as a citizen opens the report page. Asks for the device
 * location once and only lets people physically inside the Nashik service
 * area continue — complaints from anywhere else are stopped here.
 */
export function NashikGate({
  onAllowed,
}: {
  onAllowed: (observation: DeviceObservation) => void;
}) {
  const { t } = useI18n();
  const [state, setState] = useState<GateState>("checking");

  const check = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState("blocked");
      return;
    }
    setState("checking");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const observation: DeviceObservation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracyM: position.coords.accuracy,
          observedAt: new Date().toISOString(),
        };
        if (isInNashik(observation)) onAllowed(observation);
        else setState("outside");
      },
      () => setState("blocked"),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, [onAllowed]);

  useEffect(() => {
    check();
    // Run the location check once when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="nashik-gate-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"
    >
      <div className="w-full max-w-md rounded-md border border-border bg-surface p-6 shadow-lg">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-full bg-secondary-soft p-2">
            <MapPin aria-hidden="true" className="size-5 text-secondary" />
          </span>
          <div>
            <h2 id="nashik-gate-title" className="text-lg font-bold text-foreground">
              {t("app.gate.title")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("app.gate.intro")}</p>
          </div>
        </div>

        {state === "checking" ? (
          <p role="status" className="mt-5 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Loader2 aria-hidden="true" className="size-4 animate-spin text-secondary" />
            {t("app.gate.checking")}
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            <p
              role="alert"
              className="flex gap-2 rounded-sm border border-warning/40 bg-warning-soft p-3 text-sm font-semibold text-warning-foreground"
            >
              <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{state === "outside" ? t("app.gate.outside") : t("app.gate.blocked")}</span>
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={check}
                className="inline-flex min-h-12 items-center rounded-sm bg-secondary px-5 text-base font-semibold text-secondary-foreground hover:bg-secondary/90"
              >
                {t("app.gate.retry")}
              </button>
              <Link to="/" className="text-sm font-semibold text-secondary underline">
                {t("app.gate.goHome")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
