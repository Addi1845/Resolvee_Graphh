import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  DUPLICATE_POLICY,
  LOCATION_POLICY,
  MEDIA_POLICY,
  assessPriority,
  evaluateProximity,
  scoreDuplicate,
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
  kind?: "photo" | "video";
  source: "in_app_capture" | "gallery_upload" | "unknown";
};

export type ComplaintInput = {
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

function decodeDataUrl(
  dataUrl: string,
): { mime: string; bytes: Uint8Array; kind: "photo" | "video" } | null {
  const match = /^data:([^;,]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const mime = match[1]!;
  const isPhoto = (MEDIA_POLICY.acceptedMime as readonly string[]).includes(mime);
  const isVideo = (MEDIA_POLICY.acceptedVideoMime as readonly string[]).includes(mime);
  if (!isPhoto && !isVideo) return null;
  try {
    const binary = atob(match[2]!);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const limit = isVideo ? MEDIA_POLICY.maxVideoBytes : MEDIA_POLICY.maxPhotoBytes;
    if (bytes.byteLength > limit) return null;
    return { mime, bytes, kind: isVideo ? "video" : "photo" };
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

export const STAFF_ROLES = [
  "intake_officer",
  "field_officer",
  "supervisor",
  "admin",
  "auditor",
] as const;

type AuthedContext = { supabase: { from: (table: string) => any }; userId: string };

async function rolesOf(context: AuthedContext): Promise<string[]> {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  return ((data ?? []) as { role: string }[]).map((row) => row.role);
}

/** Official-only areas: citizens must never read or change another person's complaint. */
async function requireStaff(context: AuthedContext): Promise<string[]> {
  const roles = await rolesOf(context);
  const staff = roles.filter((role) => (STAFF_ROLES as readonly string[]).includes(role));
  if (staff.length === 0) throw new Error("NOT_STAFF");
  return staff;
}

/**
 * Compare a new report with recent ones and store suggested duplicate links.
 * Suggestions only: two reports are never merged without an officer's decision.
 */
async function suggestDuplicates(input: {
  id: string;
  category: string;
  text: string;
  lat: number | null;
  lng: number | null;
}): Promise<{ trackingCode: string; score: number; reasons: string[] }[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const since = new Date(Date.now() - DUPLICATE_POLICY.windowDays * 86_400_000).toISOString();

  const { data: recent } = await supabaseAdmin
    .from("complaints")
    .select("id, tracking_code, category, title, description, location_text, issue_lat, issue_lng")
    .eq("category", input.category)
    .neq("id", input.id)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(60);

  const matches: { trackingCode: string; score: number; reasons: string[] }[] = [];
  const rows: {
    complaint_id: string;
    related_complaint_id: string;
    similarity: number;
    reason: string;
    state: string;
    source: string;
  }[] = [];

  for (const candidate of recent ?? []) {
    const { score, reasons } = scoreDuplicate(
      { category: input.category, text: input.text, lat: input.lat, lng: input.lng },
      {
        category: candidate.category,
        text: `${candidate.title} ${candidate.description} ${candidate.location_text}`,
        lat: candidate.issue_lat,
        lng: candidate.issue_lng,
      },
    );
    if (score < DUPLICATE_POLICY.minScore) continue;
    matches.push({ trackingCode: candidate.tracking_code, score, reasons });
    rows.push({
      complaint_id: input.id,
      related_complaint_id: candidate.id,
      similarity: score,
      reason: reasons.join("; "),
      state: "suggested",
      source: "rule_based_demo",
    });
  }

  if (rows.length > 0) {
    const { error } = await supabaseAdmin
      .from("complaint_duplicates")
      .insert(rows.slice(0, 5) as never);
    if (error) console.error("duplicate suggestion insert failed", error.message);
  }

  return matches.sort((a, b) => b.score - a.score).slice(0, 5);
}


export const submitComplaint = createServerFn({ method: "POST" })
  .inputValidator((input: ComplaintInput) => {
    const title = str(input.title, 160);
    const description = str(input.description, 4000);
    const locationText = str(input.locationText, 300);
    if (title.length < 4) throw new Error("TITLE_TOO_SHORT");
    if (description.length < 15) throw new Error("DESCRIPTION_TOO_SHORT");
    if (locationText.length < 3) throw new Error("LOCATION_REQUIRED");

    // Photo evidence is mandatory: every complaint must carry at least one image.
    const incoming = input.photos ?? [];
    const images = incoming
      .filter((item) => item.kind !== "video")
      .slice(0, MEDIA_POLICY.maxPhotos);
    const videos = incoming
      .filter((item) => item.kind === "video")
      .slice(0, MEDIA_POLICY.maxVideos);
    const photos = [...images, ...videos];
    if (images.length === 0) throw new Error("PHOTO_REQUIRED");


    const device = input.device
      ? {
          lat: num(input.device.lat) ?? 0,
          lng: num(input.device.lng) ?? 0,
          accuracyM: num(input.device.accuracyM) ?? 0,
          observedAt: str(input.device.observedAt, 40) || new Date().toISOString(),
        }
      : null;

    return {
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
      photos,
    };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { triageComplaint } = await import("@/lib/ai-triage.server");
    const { resolveDepartments, ROUTING_POLICY_VERSION } = await import("@/lib/routing");
    const userId = await optionalUserId();

    const issuePoint =
      data.issueLat !== null && data.issueLng !== null
        ? { lat: data.issueLat, lng: data.issueLng }
        : null;
    const proximity = evaluateProximity(issuePoint, data.device);

    const analysisText = `${data.title}\n${data.description}\nLocation: ${data.locationText} ${data.landmark}`;

    // The citizen never picks a department. The model reads the text and the
    // photos, and the routing policy turns its category codes into departments.
    const triage = await triageComplaint({
      text: analysisText,
      // Only still images are sent for analysis; video clips are stored as
      // evidence for officers and are not read by the model.
      photoDataUrls: data.photos
        .filter((photo) => photo.kind !== "video")
        .map((photo) => photo.dataUrl),
    });

    const routed = resolveDepartments(triage.category, triage.supportingCategories);
    const { data: departmentRows } = await supabaseAdmin
      .from("departments")
      .select("id, code")
      .in("code", routed.map((entry) => entry.code));
    const departmentIdByCode = new Map(
      (departmentRows ?? []).map((row) => [row.code, row.id] as const),
    );
    const primaryDepartmentId = departmentIdByCode.get(triage.category) ?? null;

    const priority = assessPriority({
      category: triage.category,
      text: `${analysisText} ${triage.hazards.join(" ")}`,
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
          category: triage.category,
          title: data.title,
          description: data.description,
          language: data.language,
          location_text: data.locationText,
          landmark: data.landmark || null,
          reporter_name: data.reporterName || null,
          reporter_contact: data.reporterContact || null,
          department_id: primaryDepartmentId,
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
          analysis_method: triage.method,
          suggested_category: triage.category,
          analysis_notes: {
            summary: triage.summary,
            hazards: triage.hazards,
            severity: triage.severity,
            supporting_categories: triage.supportingCategories,
            supporting_evidence: triage.evidence,
            needs_review: triage.needsReview,
            routing_policy_version: ROUTING_POLICY_VERSION,
            fallback_note: triage.note ?? null,
          },
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

        // Record every responsible department: one accountable owner plus the
        // services expected to contribute. Staff can correct this in review.
        const routingRows = routed
          .map((entry) => ({
            complaint_id: row.id,
            department_id: departmentIdByCode.get(entry.code) ?? null,
            role: entry.role,
            source: triage.method === "ai_vision" ? "ai_suggested" : "rule_based_demo",
            reason: entry.reason,
          }))
          .filter((entry) => entry.department_id !== null);
        if (routingRows.length > 0) {
          await supabaseAdmin.from("complaint_departments").insert(routingRows as never);
        }

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
            kind: decoded.kind,
            source: ["in_app_capture", "gallery_upload"].includes(photo.source)
              ? photo.source
              : "unknown",
          });
          stored += 1;
        }

        // Suggest possible duplicates of recent nearby reports. Nothing is
        // merged: an officer confirms or rejects every suggested link.
        const duplicates = await suggestDuplicates({
          id: row.id,
          category: triage.category,
          text: `${data.title} ${data.description} ${data.locationText}`,
          lat: data.issueLat,
          lng: data.issueLng,
        });

        return {
          duplicateSuggestions: duplicates,
          trackingCode: row.tracking_code,
          createdAt: row.created_at,
          photosStored: stored,
          proximityState: proximity.state,
          priorityBand: priority.band,
          priorityScore: priority.score,
          detectedCategory: triage.category,
          analysisMethod: triage.method,
          needsReview: triage.needsReview,
          hazards: triage.hazards,
          departments: routed.map((entry) => ({ code: entry.code, role: entry.role })),
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
    .select("id, storage_key, mime_type, kind, source, created_at")
    .eq("complaint_id", complaintId)
    .order("created_at", { ascending: true });

  const photos: { id: string; url: string; source: string; kind: string; mime: string }[] = [];
  for (const row of rows ?? []) {
    const { data: signed } = await supabaseAdmin.storage
      .from("complaint-media")
      .createSignedUrl(row.storage_key, 60 * 60);
    if (signed?.signedUrl) {
      photos.push({
        id: row.id,
        url: signed.signedUrl,
        source: row.source,
        kind: row.kind,
        mime: row.mime_type,
      });
    }
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

    const { data: routed } = await supabaseAdmin
      .from("complaint_departments")
      .select("role, reason, departments(code, name_en, name_hi, name_mr)")
      .eq("complaint_id", complaint.id);

    const photos = await signedPhotoUrls(complaint.id);
    const { id: _id, ...safe } = complaint;
    return {
      found: true as const,
      complaint: safe,
      updates: updates ?? [],
      photos,
      routedDepartments: (routed ?? []).sort((a, b) =>
        a.role === b.role ? 0 : a.role === "primary" ? -1 : 1,
      ),
    };
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
    await requireStaff(context);
    let query = context.supabase
      .from("complaints")
      .select(
        "id, tracking_code, category, title, description, location_text, landmark, status, priority, priority_score, priority_band, priority_factors, suggested_category, analysis_method, proximity_state, proximity_distance_m, issue_lat, issue_lng, due_date, reporter_name, reporter_contact, created_at",
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
    const roles = await rolesOf(context);
    const staffRoles = roles.filter((role) => (STAFF_ROLES as readonly string[]).includes(role));
    return {
      roles,
      isStaff: staffRoles.length > 0,
      canUpdate: staffRoles.some((role) => role !== "auditor"),
    };
  });

/** Department-wise tracking for the official dashboard. */
export const getDepartmentTracking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context);

    const { data: departments } = await context.supabase
      .from("departments")
      .select("id, code, name_en, name_hi, name_mr")
      .order("name_en", { ascending: true });

    const { data: rows, error } = await context.supabase
      .from("complaints")
      .select("department_id, status, due_date, priority_band")
      .limit(5000);
    if (error) {
      console.error("getDepartmentTracking failed", error.message);
      throw new Error("LIST_FAILED");
    }

    const today = new Date().toISOString().slice(0, 10);
    const closed = ["resolved", "rejected"];
    const buckets = new Map<
      string,
      { total: number; open: number; overdue: number; resolved: number; critical: number }
    >();

    for (const row of rows ?? []) {
      const key = row.department_id ?? "unassigned";
      const bucket =
        buckets.get(key) ?? { total: 0, open: 0, overdue: 0, resolved: 0, critical: 0 };
      bucket.total += 1;
      if (row.status === "resolved") bucket.resolved += 1;
      if (!closed.includes(row.status)) {
        bucket.open += 1;
        if (row.due_date && row.due_date < today) bucket.overdue += 1;
      }
      if (row.priority_band === "critical") bucket.critical += 1;
      buckets.set(key, bucket);
    }

    const empty = { total: 0, open: 0, overdue: 0, resolved: 0, critical: 0 };
    const departmentRows = (departments ?? [])
      .map((dept) => ({ ...dept, ...(buckets.get(dept.id) ?? empty) }))
      .filter((dept) => dept.total > 0)
      .sort((a, b) => b.open - a.open || b.total - a.total);

    const unassigned = buckets.get("unassigned");

    return {
      departments: departmentRows,
      unassigned: unassigned ?? null,
      totals: {
        total: (rows ?? []).length,
        open: (rows ?? []).filter((row) => !closed.includes(row.status)).length,
      },
    };
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
    const staffRoles = await requireStaff(context);
    // Auditors may read the queue but never change a complaint.
    if (!staffRoles.some((role) => role !== "auditor")) throw new Error("READ_ONLY_ROLE");
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

/**
 * Duplicate review queue. Every link is a suggestion waiting for an officer:
 * confirming one never closes a complaint by itself.
 */
export const listDuplicateReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context);
    const { data, error } = await context.supabase
      .from("complaint_duplicates")
      .select(
        "id, similarity, reason, state, created_at, complaint:complaints!complaint_duplicates_complaint_id_fkey(tracking_code, title, location_text, created_at), related:complaints!complaint_duplicates_related_complaint_id_fkey(tracking_code, title, location_text, created_at)",
      )
      .order("similarity", { ascending: false })
      .limit(50);
    if (error) {
      console.error("listDuplicateReview failed", error.message);
      throw new Error("LIST_FAILED");
    }
    return {
      links: data ?? [],
      policyVersion: DUPLICATE_POLICY.version,
    };
  });

export const reviewDuplicateLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; state: string }) => ({
    id: str(input.id, 40),
    state: ["confirmed", "rejected"].includes(input.state) ? input.state : "suggested",
  }))
  .handler(async ({ data, context }) => {
    const staffRoles = await requireStaff(context);
    if (!staffRoles.some((role) => role !== "auditor")) throw new Error("READ_ONLY_ROLE");
    const { error } = await context.supabase
      .from("complaint_duplicates")
      .update({
        state: data.state,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) {
      console.error("reviewDuplicateLink failed", error.message);
      throw new Error("UPDATE_FAILED");
    }
    return { ok: true };
  });

/** Closure verification: a person checks the evidence before a complaint closes. */
export const listVerificationQueue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context);
    const { data, error } = await context.supabase
      .from("complaints")
      .select("id, tracking_code, title, category, location_text, due_date, updated_at")
      .eq("status", "awaiting_verification")
      .order("updated_at", { ascending: true })
      .limit(50);
    if (error) {
      console.error("listVerificationQueue failed", error.message);
      throw new Error("LIST_FAILED");
    }

    const { data: decisions } = await context.supabase
      .from("complaint_verifications")
      .select("complaint_id, decision, note, reviewer_name, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    return { pending: data ?? [], recent: decisions ?? [] };
  });

export const recordVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; decision: string; note?: string }) => ({
    id: str(input.id, 40),
    decision: input.decision === "rework" ? "rework" : "verified",
    note: str(input.note, 1000),
  }))
  .handler(async ({ data, context }) => {
    const staffRoles = await requireStaff(context);
    if (!staffRoles.some((role) => role !== "auditor")) throw new Error("READ_ONLY_ROLE");

    const { error } = await context.supabase.from("complaint_verifications").insert({
      complaint_id: data.id,
      decision: data.decision,
      note: data.note || null,
      reviewer_id: context.userId,
    });
    if (error) {
      console.error("recordVerification failed", error.message);
      throw new Error("UPDATE_FAILED");
    }

    // A verified closure resolves the complaint; rework sends it back to the
    // department instead of closing it.
    const nextStatus = data.decision === "verified" ? "resolved" : "in_progress";
    await context.supabase
      .from("complaints")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
        ...(data.decision === "verified" && data.note ? { resolution_note: data.note } : {}),
      })
      .eq("id", data.id);

    await context.supabase.from("complaint_updates").insert({
      complaint_id: data.id,
      status: nextStatus,
      note:
        data.decision === "verified"
          ? `Closure evidence verified. ${data.note}`.trim()
          : `Closure evidence sent back for rework. ${data.note}`.trim(),
      created_by: context.userId,
    });

    return { ok: true, status: nextStatus };
  });

/**
 * Full officer report for one complaint, opened from the queue.
 * Staff only: citizens use the public tracking page for their own reports.
 */
export const getComplaintDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string }) => ({ code: str(input.code, 40).toUpperCase() }))
  .handler(async ({ data, context }) => {
    await requireStaff(context);

    const { data: complaint } = await context.supabase
      .from("complaints")
      .select(
        "id, tracking_code, category, title, description, language, location_text, landmark, status, priority, priority_score, priority_band, priority_factors, priority_policy_version, analysis_method, analysis_notes, suggested_category, proximity_state, proximity_distance_m, issue_lat, issue_lng, due_date, resolution_note, reporter_name, reporter_contact, created_at, updated_at, departments(code, name_en, name_hi, name_mr)",
      )
      .eq("tracking_code", data.code)
      .maybeSingle();

    if (!complaint) return { found: false as const };

    const [{ data: updates }, { data: routed }, { data: duplicates }, { data: verifications }] =
      await Promise.all([
        context.supabase
          .from("complaint_updates")
          .select("status, note, actor_name, created_at")
          .eq("complaint_id", complaint.id)
          .order("created_at", { ascending: true }),
        context.supabase
          .from("complaint_departments")
          .select("role, reason, source, departments(code, name_en, name_hi, name_mr)")
          .eq("complaint_id", complaint.id),
        context.supabase
          .from("complaint_duplicates")
          .select(
            "id, similarity, reason, state, related:complaints!complaint_duplicates_related_complaint_id_fkey(tracking_code, title)",
          )
          .eq("complaint_id", complaint.id)
          .order("similarity", { ascending: false }),
        context.supabase
          .from("complaint_verifications")
          .select("decision, note, reviewer_name, created_at")
          .eq("complaint_id", complaint.id)
          .order("created_at", { ascending: false }),
      ]);

    return {
      found: true as const,
      complaint,
      updates: updates ?? [],
      routedDepartments: (routed ?? []).sort((a: { role: string }, b: { role: string }) =>
        a.role === b.role ? 0 : a.role === "primary" ? -1 : 1,
      ),
      duplicates: duplicates ?? [],
      verifications: verifications ?? [],
      photos: await signedPhotoUrls(complaint.id),
    };
  });
