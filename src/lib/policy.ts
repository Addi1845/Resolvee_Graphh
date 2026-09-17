/**
 * Prototype policies for ResolveGraph AI.
 *
 * Every number here is a configurable demonstration policy, not a validated
 * model and not an official municipal service commitment. Versions are stored
 * with each complaint so later policy changes never rewrite history.
 */

export const MEDIA_POLICY = {
  maxPhotos: 5,
  maxPhotoBytes: 10 * 1024 * 1024,
  acceptedMime: ["image/jpeg", "image/png", "image/webp"] as const,
  /** Client-side downscale target before upload. */
  maxEdgePx: 1600,
};

export const LOCATION_POLICY = {
  version: "proximity-v1",
  /** Metres between the issue pin and the device observation. */
  radiusMetres: 150,
  /** A device observation older than this is treated as stale. */
  maxAgeSeconds: 120,
  /** A reported accuracy worse than this cannot support a proximity claim. */
  maxAccuracyMetres: 200,
};

export const PRIORITY_POLICY = {
  version: "impact-v1",
  weights: {
    safety: 0.35,
    severity: 0.25,
    serviceDisruption: 0.15,
    sensitiveSite: 0.1,
    agePressure: 0.1,
    corroboration: 0.05,
  },
  bands: { medium: 30, high: 55, critical: 75 },
};

export type ProximityState =
  | "unavailable"
  | "stale"
  | "uncertain"
  | "nearby"
  | "outside"
  | "boundary";

export type DeviceObservation = {
  lat: number;
  lng: number;
  accuracyM: number;
  observedAt: string;
};

export function haversineMetres(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Uncertainty-aware proximity heuristic. A "nearby" result is a signal that the
 * device was close to the reported pin — it is never proof of presence, and an
 * "outside" result never means the report is false.
 */
export function evaluateProximity(
  issue: { lat: number; lng: number } | null,
  device: DeviceObservation | null,
  now = new Date(),
): { state: ProximityState; distanceM: number | null } {
  if (!issue || !device) return { state: "unavailable", distanceM: null };

  const ageSeconds = (now.getTime() - new Date(device.observedAt).getTime()) / 1000;
  const distance = haversineMetres(issue, device);

  if (!Number.isFinite(distance)) return { state: "unavailable", distanceM: null };
  if (ageSeconds > LOCATION_POLICY.maxAgeSeconds) return { state: "stale", distanceM: distance };
  if (!Number.isFinite(device.accuracyM) || device.accuracyM <= 0) {
    return { state: "uncertain", distanceM: distance };
  }
  if (device.accuracyM > LOCATION_POLICY.maxAccuracyMetres) {
    return { state: "uncertain", distanceM: distance };
  }
  if (distance + device.accuracyM <= LOCATION_POLICY.radiusMetres) {
    return { state: "nearby", distanceM: distance };
  }
  if (distance - device.accuracyM > LOCATION_POLICY.radiusMetres) {
    return { state: "outside", distanceM: distance };
  }
  return { state: "boundary", distanceM: distance };
}

/** Category-level starting points for the demo impact score (0-100 each). */
const CATEGORY_BASELINE: Record<string, { safety: number; severity: number; disruption: number }> = {
  water: { safety: 35, severity: 55, disruption: 70 },
  roads: { safety: 55, severity: 50, disruption: 55 },
  electricity: { safety: 75, severity: 55, disruption: 60 },
  sanitation: { safety: 35, severity: 45, disruption: 45 },
  drainage: { safety: 50, severity: 55, disruption: 60 },
  safety: { safety: 80, severity: 60, disruption: 40 },
  health: { safety: 65, severity: 60, disruption: 45 },
  other: { safety: 30, severity: 35, disruption: 35 },
};

const HAZARD_TERMS = [
  "live wire",
  "electric shock",
  "shock",
  "spark",
  "fire",
  "collapse",
  "collapsed",
  "sinkhole",
  "gas leak",
  "open manhole",
  "manhole",
  "drowning",
  "child",
  "school",
  "hospital",
  "accident",
  "injur",
  "बिजली",
  "करंट",
  "आग",
  "शाळा",
  "स्कूल",
  "अस्पताल",
  "रुग्णालय",
  "मॅनहोल",
];

export type PriorityFactor = {
  code: string;
  value: number | null;
  weight: number;
  reason: string;
};

export type PriorityResult = {
  score: number;
  band: "low" | "medium" | "high" | "critical";
  factors: PriorityFactor[];
  unknowns: string[];
  urgentReviewFlag: boolean;
  policyVersion: string;
};

/**
 * Rule-based, explainable impact score. It is a tunable demo policy: the number
 * is a score out of 100, never a calibrated probability, and unknown inputs stay
 * visible as unknown instead of being guessed.
 */
export function assessPriority(input: {
  category: string;
  text: string;
  hasPhotos: boolean;
  corroborationCount?: number;
}): PriorityResult {
  const baseline = CATEGORY_BASELINE[input.category] ?? CATEGORY_BASELINE['other']!;
  const text = input.text.toLowerCase();
  const hazardHits = HAZARD_TERMS.filter((term) => text.includes(term));
  const hazard = hazardHits.length > 0;

  const safety = Math.min(100, baseline.safety + (hazard ? 25 : 0));
  const severity = baseline.severity;
  const disruption = baseline.disruption;
  const sensitive = /school|hospital|शाळा|स्कूल|अस्पताल|रुग्णालय|market|bus stop/.test(text)
    ? 70
    : null;
  const corroboration = Math.min(100, (input.corroborationCount ?? 0) * 20);

  const w = PRIORITY_POLICY.weights;
  const factors: PriorityFactor[] = [
    {
      code: "safety",
      value: safety,
      weight: w.safety,
      reason: hazard
        ? `Reported hazard wording: ${hazardHits.slice(0, 3).join(", ")}`
        : "Category safety baseline",
    },
    { code: "severity", value: severity, weight: w.severity, reason: "Category severity baseline" },
    {
      code: "service_disruption",
      value: disruption,
      weight: w.serviceDisruption,
      reason: "Category service-disruption baseline",
    },
    {
      code: "sensitive_site_context",
      value: sensitive,
      weight: w.sensitiveSite,
      reason: sensitive
        ? "Reporter mentioned a sensitive nearby site"
        : "No sensitive site stated; treated as unknown",
    },
    {
      code: "age_pressure",
      value: 0,
      weight: w.agePressure,
      reason: "New report; age pressure starts at zero",
    },
    {
      code: "corroboration",
      value: corroboration,
      weight: w.corroboration,
      reason: "Independent corroboration is capped and reviewed",
    },
  ];

  const available = factors.filter((factor) => factor.value !== null);
  const weightSum = available.reduce((sum, factor) => sum + factor.weight, 0);
  const weighted = available.reduce(
    (sum, factor) => sum + (factor.value as number) * factor.weight,
    0,
  );
  const score = weightSum > 0 ? Math.round(weighted / weightSum) : 0;

  const band =
    score >= PRIORITY_POLICY.bands.critical
      ? "critical"
      : score >= PRIORITY_POLICY.bands.high
        ? "high"
        : score >= PRIORITY_POLICY.bands.medium
          ? "medium"
          : "low";

  const unknowns = factors.filter((factor) => factor.value === null).map((factor) => factor.code);
  if (!input.hasPhotos) unknowns.push("photo_evidence");

  return {
    score,
    band,
    factors,
    unknowns,
    urgentReviewFlag: hazard,
    policyVersion: PRIORITY_POLICY.version,
  };
}

const CATEGORY_TERMS: Record<string, string[]> = {
  water: ["water", "pipeline", "leak", "tap", "पानी", "पाणी", "नळ", "गळती"],
  roads: ["road", "pothole", "footpath", "सड़क", "रस्ता", "खड्डा", "गड्ढा"],
  electricity: ["light", "street light", "pole", "wire", "electric", "बिजली", "वीज", "दिवा"],
  sanitation: ["garbage", "waste", "kachra", "कचरा", "सफाई", "स्वच्छता"],
  drainage: ["drain", "sewage", "flood", "gutter", "नाली", "गटार", "पाणी साचले"],
  safety: ["unsafe", "danger", "accident", "खतरा", "धोका", "अपघात"],
  health: ["mosquito", "dengue", "stray", "health", "डेंगू", "आरोग्य", "स्वास्थ्य"],
};

/**
 * Deterministic, rule-based category suggestion. Displayed to staff as
 * "Demo / rule-based analysis" — no live model is involved.
 */
export function suggestCategory(text: string): { category: string | null; matched: string[] } {
  const lower = text.toLowerCase();
  let best: { category: string; matched: string[] } | null = null;
  for (const [category, terms] of Object.entries(CATEGORY_TERMS)) {
    const matched = terms.filter((term) => lower.includes(term));
    if (matched.length > 0 && (!best || matched.length > best.matched.length)) {
      best = { category, matched };
    }
  }
  return best ? { category: best.category, matched: best.matched } : { category: null, matched: [] };
}
