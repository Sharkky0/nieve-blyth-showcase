// Server-only helpers for form hardening and security event logging.
import { createHash } from "node:crypto";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 5; // submissions per IP / form / window

export function hashIp(ip: string | null | undefined): string {
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "fallback-salt";
  return createHash("sha256").update(`${salt}:${ip ?? "unknown"}`).digest("hex").slice(0, 32);
}

export function getClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

type LogArgs = {
  event_type: string;
  severity?: "info" | "warning" | "error";
  ip_hash?: string;
  user_agent?: string | null;
  path?: string | null;
  detail?: Record<string, unknown>;
};

export async function logSecurityEvent(args: LogArgs): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("security_events").insert({
      event_type: args.event_type,
      severity: args.severity ?? "info",
      ip_hash: args.ip_hash ?? null,
      user_agent: args.user_agent ?? null,
      path: args.path ?? null,
      detail: (args.detail ?? {}) as any,
    });
  } catch (e) {
    console.warn("[security] log failed", e);
  }
}

export async function checkRateLimit(
  formKey: string,
  ipHash: string,
): Promise<{ allowed: boolean; count: number }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

  const { count, error } = await supabaseAdmin
    .from("form_rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("form_key", formKey)
    .eq("ip_hash", ipHash)
    .gte("created_at", since);

  if (error) {
    console.warn("[security] rate-limit query failed", error);
    return { allowed: true, count: 0 };
  }

  const c = count ?? 0;
  if (c >= RATE_LIMIT_MAX) return { allowed: false, count: c };

  await supabaseAdmin.from("form_rate_limits").insert({ form_key: formKey, ip_hash: ipHash });

  // best-effort cleanup of old rows for this key/ip
  await supabaseAdmin
    .from("form_rate_limits")
    .delete()
    .eq("form_key", formKey)
    .eq("ip_hash", ipHash)
    .lt("created_at", since);

  return { allowed: true, count: c + 1 };
}
