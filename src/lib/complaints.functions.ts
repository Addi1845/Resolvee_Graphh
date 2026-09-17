import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  LOCATION_POLICY,
  MEDIA_POLICY,
  assessPriority,
  evaluateProximity,
  suggestCategory,
  type DeviceObservation,
} from "@/lib/policy";

export const CATEGORIES = [
  "water",
  "roads",
  "electricity",
  "sanitation",
  "drainage",
  "safety",
  "health",
  "other",
] as const;

export const STATUSES = [
  "submitted",
  "acknowledged",
  "assigned",
  "in_progress",
  "awaiting_verification",
  "resolved",
  "rejected",
] as const;

export type PhotoInput = {
  dataUrl: string;
  mime: string;
  source: "in_app_capture" | "gallery_upload" | "unknown";
};

export type ComplaintInput = {
  category: string;
  title: string;
  description: string;
  language: string;
  locationText: string;
  landmark?: string;
  reporterName?: string;
  reporterContact?: string;
  issueLat?: number | null;
  issueLng?: number | null;
  device?: DeviceObservation | null;
  photos?: PhotoInput[];
};

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function generateTrackingCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `RG-${new Date().getFullYear()}-${suffix}`;
}

function decodeDataUrl(dataUrl: string): { mime: string; bytes: Uint8Array } | null {
  const match = /^data:([^;,]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const mime = match[1]!;
  if (!(MEDIA_POLICY.acceptedMime as readonly string[]).includes(mime)) return null;
  try {
    const binary = atob(match[2]!);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    if (bytes.byteLength > MEDIA_POLICY.maxPhotoBytes) return null;
    return { mime, bytes };
  } catch {
    return null;
  }
}

/** Optional caller identity: intake stays open to people without an account. */
async function optionalUserId(): Promise<string | null> {
  const header = getRequestHeader("authorization");
  const token = header?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.auth.getUser(token);
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

export const submitComplaint = createServerFn({ method: "POST" })
  .inputValidator((input: ComplaintInput) => {
    const category = CATEGORIES.includes(input.category as (typeof CATEGORIES)[number])
      ? input.category
      : "other";
    const title = str(input.title, 160);
    const description = str(input.description, 4000);
    const locationText = str(input.locationText, 300);
    if (title.length < 4) throw new Error("TITLE_TOO_SHORT");
    if (description.length < 15) throw new Error("DESCRIPTION_TOO_SHORT");
    if (locationText.length < 3) throw new Error("LOCATION_REQUIRED");

    const device = input.device
      ? {
          lat: num(input.device.lat) ?? 0,
          lng: num(input.device.lng) ?? 0,
          accuracyM: num(input.device.accuracyM) ?? 0,
          observedAt: str(input.device.observedAt, 40) || new Date().toISOString(),
        }
      : null;

    return {
      category,
      title,
      description,
      locationText,
      landmark: str(input.landmark, 200),
      reporterName: str(input.reporterName, 120),
      reporterContact: str(input.reporterContact, 120),
      language: ["en", "hi", "mr"].includes(input.language) ? input.language : "en",
      issueLat: num(input.issueLat),
      issueLng: num(input.issueLng),
      device,
      photos: (input.photos ?? []).slice(0, MEDIA_POLICY.maxPhotos),
    };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = await optionalUserId();

    const { data: dept } = await supabaseAdmin
      .from("departments")
      .select("id")
      .eq("code", data.category)
      .maybeSingle();

    const issuePoint =
      data.issueLat !== null && data.issueLng !== null
        ? { lat: data.issueLat, lng: data.issueLng }
        : null;
    const proximity = evaluateProximity(issuePoint, data.device);

    const analysisText = `${data.title} ${data.description} ${data.landmark}`;
    const suggestion = suggestCategory(analysisText);
    const priority = assessPriority({
      category: data.category,
      text: analysisText,
      hasPhotos: data.photos.length > 0,
    });

    const due = new Date();
    due.setDate(due.getDate() + 7);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const trackingCode = generateTrackingCode();
      const { data: row, error } = await supabaseAdmin
        .from("complaints")
        .insert({
          tracking_code: trackingCode,
          category: data.category,
          title: data.title,
          description: data.description,
          language: data.language,
          location_text: data.locationText,
          landmark: data.landmark || null,
          reporter_name: data.reporterName || null,
          reporter_contact: data.reporterContact || null,
          department_id: dept?.id ?? null,
          due_date: due.toISOString().slice(0, 10),
          created_by: userId,
          issue_lat: data.issueLat,
          issue_lng: data.issueLng,
          device_lat: data.device?.lat ?? null,
          device_lng: data.device?.lng ?? null,
          device_accuracy_m: data.device?.accuracyM ?? null,
          device_observed_at: data.device?.observedAt ?? null,
          proximity_state: proximity.state,
          proximity_distance_m: proximity.distanceM,
          location_policy_version: LOCATION_POLICY.version,
          analysis_status: "completed",
          analysis_method: "rule_based_demo",
          suggested_category: suggestion.category,
          analysis_notes: { matched_terms: suggestion.matched, needs_review: true },
          priority_score: priority.score,
          priority_band: priority.band,
          priority_factors: {
            factors: priority.factors,
            unknowns: priority.unknowns,
            urgent_review: priority.urgentReviewFlag,
          },
          priority_policy_version: priority.policyVersion,
          priority: priority.band,
        })
        .select("id, tracking_code, created_at")
        .single();

      if (!error && row) {
        await supabaseAdmin.from("complaint_updates").insert({
          complaint_id: row.id,
          status: "submitted",
          note: "Complaint received through the citizen portal.",
        });

        let stored = 0;
        for (const photo of data.photos) {
          const decoded = decodeDataUrl(photo.dataUrl);
          if (!decoded) continue;
          const ext = decoded.mime.split("/")[1] ?? "jpg";
          const key = `${row.id}/${crypto.randomUUID()}.${ext}`;
          const { error: uploadError } = await supabaseAdmin.storage
            .from("complaint-media")
            .upload(key, decoded.bytes, { contentType: decoded.mime, upsert: false });
          if (uploadError) {
            console.error("attachment upload failed", uploadError.message);
            continue;
          }
          await supabaseAdmin.from("attachments").insert({
            complaint_id: row.id,
            storage_key: key,
            mime_type: decoded.mime,
            byte_size: decoded.bytes.byteLength,
            kind: "photo",
            source: ["in_app_capture", "gallery_upload"].includes(photo.source)
              ? photo.source
              : "unknown",
          });
          stored += 1;
        }

        return {
          trackingCode: row.tracking_code,
          createdAt: row.created_at,
          photosStored: stored,
          proximityState: proximity.state,
          priorityBand: priority.band,
          priorityScore: priority.score,
          suggestedCategory: suggestion.category,
          urgentReview: priority.urgentReviewFlag,
        };
      }
      if (error && !error.message.includes("duplicate")) {
        console.error("submitComplaint failed", error.message);
        throw new Error("SUBMIT_FAILED");
      }
    }
    throw new Error("SUBMIT_FAILED");
  });

async function signedPhotoUrls(complaintId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: rows } = await supabaseAdmin
    .from("attachments")
    .select("id, storage_key, mime_type, source, created_at")
    .eq("complaint_id", complaintId)
    .order("created_at", { ascending: true });

  const photos: { id: string; url: string; source: string }[] = [];
  for (const row of rows ?? []) {
    const { data: signed } = await supabaseAdmin.storage
      .from("complaint-media")
      .createSignedUrl(row.storage_key, 60 * 60);
    if (signed?.signedUrl) photos.push({ id: row.id, url: signed.signedUrl, source: row.source });
  }
  return photos;
}

export const trackComplaint = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => ({
    code: str(input.code, 40).toUpperCase(),
  }))
  .handler(async ({ data }) => {
    if (!data.code) return { found: false as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: complaint } = await supabaseAdmin
      .from("complaints")
      .select(
        "id, tracking_code, category, title, description, location_text, landmark, status, priority, priority_score, priority_band, due_date, resolution_note, created_at, updated_at, analysis_status, analysis_method, suggested_category, proximity_state, proximity_distance_m, departments(name_en, name_hi, name_mr)",
      )
      .eq("tracking_code", data.code)
      .maybeSingle();

    if (!complaint) return { found: false as const };

    const { data: updates } = await supabaseAdmin
      .from("complaint_updates")
      .select("status, note, actor_name, created_at")
      .eq("complaint_id", complaint.id)
      .order("created_at", { ascending: true });

    const photos = await signedPhotoUrls(complaint.id);
    const { id: _id, ...safe } = complaint;
    return { found: true as const, complaint: safe, updates: updates ?? [], photos };
  });

export const listMyComplaints = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows, error } = await context.supabase
      .from("complaints")
      .select(
        "id, tracking_code, category, title, status, priority_band, due_date, created_at, location_text",
      )
      .eq("created_by", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      console.error("listMyComplaints failed", error.message);
      throw new Error("LIST_FAILED");
    }
    return { complaints: rows ?? [] };
  });

export const listComplaints = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { status?: string; search?: string; category?: string; sort?: string }) => ({
    status: str(input?.status, 40),
    search: str(input?.search, 80),
    category: str(input?.category, 40),
    sort: str(input?.sort, 20) || "priority",
  }))
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("complaints")
      .select(
        "id, tracking_code, category, title, description, location_text, landmark, status, priority, priority_score, priority_band, priority_factors, suggested_category, analysis_method, proximity_state, proximity_distance_m, due_date, reporter_name, reporter_contact, created_at",
      )
      .limit(100);

    if (data.status) query = query.eq("status", data.status);
    if (data.category) query = query.eq("category", data.category);
    if (data.search) query = query.ilike("title", `%${data.search}%`);

    query =
      data.sort === "oldest"
        ? query.order("created_at", { ascending: true })
        : data.sort === "newest"
          ? query.order("created_at", { ascending: false })
          : data.sort === "deadline"
            ? query.order("due_date", { ascending: true })
            : query
                .order("priority_score", { ascending: false, nullsFirst: false })
                .order("created_at", { ascending: true });

    const { data: rows, error } = await query;
    if (error) {
      console.error("listComplaints failed", error.message);
      throw new Error("LIST_FAILED");
    }

    const today = new Date().toISOString().slice(0, 10);
    const complaints = rows ?? [];
    return {
      complaints,
      summary: {
        total: complaints.length,
        critical: complaints.filter((row) => row.priority_band === "critical").length,
        overdue: complaints.filter(
          (row) =>
            row.due_date !== null &&
            row.due_date < today &&
            !["resolved", "rejected"].includes(row.status),
        ).length,
        open: complaints.filter((row) => !["resolved", "rejected"].includes(row.status)).length,
      },
    };
  });

export const getComplaintEvidence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => ({ id: str(input.id, 40) }))
  .handler(async ({ data, context }) => {
    const { data: allowed } = await context.supabase
      .from("complaints")
      .select("id")
      .eq("id", data.id)
      .maybeSingle();
    if (!allowed) throw new Error("NOT_AUTHORISED");
    return { photos: await signedPhotoUrls(data.id) };
  });

export const getMyAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    return { roles: (roles ?? []).map((r) => r.role as string) };
  });

export const updateComplaintStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: string; note?: string; priority?: string }) => {
    const status = STATUSES.includes(input.status as (typeof STATUSES)[number])
      ? input.status
      : "submitted";
    return {
      id: str(input.id, 40),
      status,
      note: str(input.note, 1000),
      priority: ["low", "medium", "high", "critical"].includes(input.priority ?? "")
        ? input.priority!
        : "",
    };
  })
  .handler(async ({ data, context }) => {
    const patch = {
      status: data.status,
      updated_at: new Date().toISOString(),
      ...(data.priority ? { priority: data.priority } : {}),
      ...(data.status === "resolved" && data.note ? { resolution_note: data.note } : {}),
    };

    const { error } = await context.supabase.from("complaints").update(patch).eq("id", data.id);
    if (error) {
      console.error("updateComplaintStatus failed", error.message);
      throw new Error("UPDATE_FAILED");
    }

    const { error: logError } = await context.supabase.from("complaint_updates").insert({
      complaint_id: data.id,
      status: data.status,
      note: data.note || null,
      created_by: context.userId,
    });
    if (logError) console.error("complaint_updates insert failed", logError.message);

    return { ok: true };
  });
