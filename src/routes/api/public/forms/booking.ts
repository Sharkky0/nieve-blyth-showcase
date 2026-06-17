import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  checkRateLimit,
  getClientIp,
  hashIp,
  logSecurityEvent,
} from "@/lib/security.server";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  event_type: z.string().trim().max(100).optional().or(z.literal("")),
  preferred_date: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  // Honeypot — must be empty. Real users can't see it.
  website: z.string().max(0).optional().or(z.literal("")),
});

export const Route = createFileRoute("/api/public/forms/booking")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip = getClientIp(request);
        const ipHash = hashIp(ip);
        const ua = request.headers.get("user-agent");
        const path = "/api/public/forms/booking";

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          await logSecurityEvent({
            event_type: "form.invalid_json",
            severity: "warning",
            ip_hash: ipHash,
            user_agent: ua,
            path,
          });
          return Response.json({ error: "Invalid request" }, { status: 400 });
        }

        const parsed = schema.safeParse(body);
        if (!parsed.success) {
          // Honeypot trip looks like normal validation failure to bots.
          const honeypotTripped =
            typeof (body as any)?.website === "string" && (body as any).website.length > 0;
          await logSecurityEvent({
            event_type: honeypotTripped ? "form.honeypot" : "form.validation_failed",
            severity: "warning",
            ip_hash: ipHash,
            user_agent: ua,
            path,
            detail: { issues: parsed.error.issues.slice(0, 5) },
          });
          // Always return success-shaped 200 for honeypot to avoid signalling bots.
          if (honeypotTripped) return Response.json({ ok: true });
          return Response.json({ error: "Invalid submission" }, { status: 400 });
        }

        const rate = await checkRateLimit("booking", ipHash);
        if (!rate.allowed) {
          await logSecurityEvent({
            event_type: "form.rate_limited",
            severity: "warning",
            ip_hash: ipHash,
            user_agent: ua,
            path,
            detail: { form: "booking", count: rate.count },
          });
          return Response.json(
            { error: "Too many submissions — please try again later." },
            { status: 429 },
          );
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const v = parsed.data;
        const { error } = await supabaseAdmin.from("booking_enquiries").insert({
          name: v.name,
          email: v.email,
          phone: v.phone || null,
          event_type: v.event_type || null,
          preferred_date: v.preferred_date || null,
          message: v.message || null,
        });

        if (error) {
          await logSecurityEvent({
            event_type: "form.db_error",
            severity: "error",
            ip_hash: ipHash,
            user_agent: ua,
            path,
            detail: { code: error.code, message: error.message },
          });
          return Response.json({ error: "Could not save enquiry" }, { status: 500 });
        }

        await logSecurityEvent({
          event_type: "form.booking_submitted",
          severity: "info",
          ip_hash: ipHash,
          user_agent: ua,
          path,
        });

        return Response.json({ ok: true });
      },
    },
  },
});
