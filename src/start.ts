import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Baseline security headers on every server response.
const securityHeadersMiddleware = createMiddleware().server(async ({ next }) => {
  const response = await next();
  const res = response as unknown as Response;
  if (res && typeof res.headers?.set === "function") {
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    );
    res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    res.headers.set("X-DNS-Prefetch-Control", "off");
  }
  return response;
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [securityHeadersMiddleware, errorMiddleware],
}));
