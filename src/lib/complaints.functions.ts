import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

export type ComplaintInput = {
  category: string;
  title: string;
  description: string;
  language: string;
  locationText: string;
  landmark?: string;
  reporterName?: string;
  reporterContact?: string;
};

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function generateTrackingCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `RG-${new Date().getFullYear()}-${suffix}`;
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
    return {
      category,
      title,
      description,
      locationText,
      landmark: str(input.landmark, 200),
      reporterName: str(input.reporterName, 120),
      reporterContact: str(input.reporterContact, 120),
      language: ["en", "hi", "mr"].includes(input.language) ? input.language : "en",
    };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: dept } = await supabaseAdmin
      .from("departments")
      .select("id")
      .eq("code", data.category)
      .maybeSingle();

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
        })
        .select("tracking_code, created_at")
        .single();

      if (!error && row) {
        await supabaseAdmin.from("complaint_updates").insert({
          complaint_id: undefined as never,
          status: "submitted",
        } as never);
        return { trackingCode: row.tracking_code, createdAt: row.created_at };
      }
      if (error && !error.message.includes("duplicate")) {
        console.error("submitComplaint failed", error.message);
        throw new Error("SUBMIT_FAILED");
      }
    }
    throw new Error("SUBMIT_FAILED");
  });

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
        "id, tracking_code, category, title, description, location_text, landmark, status, priority, due_date, resolution_note, created_at, updated_at, departments(name_en, name_hi, name_mr)",
      )
      .eq("tracking_code", data.code)
      .maybeSingle();

    if (!complaint) return { found: false as const };

    const { data: updates } = await supabaseAdmin
      .from("complaint_updates")
      .select("status, note, actor_name, created_at")
      .eq("complaint_id", complaint.id)
      .order("created_at", { ascending: true });

    const { id: _id, ...safe } = complaint;
    return { found: true as const, complaint: safe, updates: updates ?? [] };
  });

export const listComplaints = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { status?: string; search?: string }) => ({
    status: str(input?.status, 40),
    search: str(input?.search, 80),
  }))
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("complaints")
      .select(
        "id, tracking_code, category, title, description, location_text, status, priority, due_date, reporter_name, reporter_contact, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (data.status) query = query.eq("status", data.status);
    if (data.search) query = query.ilike("title", `%${data.search}%`);

    const { data: rows, error } = await query;
    if (error) {
      console.error("listComplaints failed", error.message);
      throw new Error("LIST_FAILED");
    }
    return { complaints: rows ?? [] };
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
    const patch: Record<string, unknown> = {
      status: data.status,
      updated_at: new Date().toISOString(),
    };
    if (data.priority) patch['priority'] = data.priority;
    if (data.status === "resolved" && data.note) patch['resolution_note'] = data.note;

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
