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
  message: z.string().trim().min(1).max(2000),
  website: z.string().max(0).optional().or(z.literal("")),
});

export const Route = createFileRoute("/api/public/forms/contact")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip = getClientIp(request);
        const ipHash = hashIp(ip);
        const ua = request.headers.get("user-agent");
        const path = "/api/public/forms/contact";

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
          if (honeypotTripped) return Response.json({ ok: true });
          return Response.json({ error: "Invalid submission" }, { status: 400 });
        }

        const rate = await checkRateLimit("contact", ipHash);
        if (!rate.allowed) {
          await logSecurityEvent({
            event_type: "form.rate_limited",
            severity: "warning",
            ip_hash: ipHash,
            user_agent: ua,
            path,
            detail: { form: "contact", count: rate.count },
          });
          return Response.json(
            { error: "Too many submissions — please try again later." },
            { status: 429 },
          );
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const v = parsed.data;
        const { error } = await supabaseAdmin.from("contact_messages").insert({
          name: v.name,
          email: v.email,
          message: v.message,
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
          return Response.json({ error: "Could not send message" }, { status: 500 });
        }

        await logSecurityEvent({
          event_type: "form.contact_submitted",
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
