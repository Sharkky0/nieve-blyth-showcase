import { createServerFn } from "@tanstack/react-start";

type Payload =
  | {
      kind: "booking";
      name: string;
      email: string;
      phone?: string | null;
      event_type?: string | null;
      preferred_date?: string | null;
      message?: string | null;
    }
  | { kind: "contact"; name: string; email: string; message: string };

// Stub: enquiries are always saved in the database (admin can see them in /admin).
// Once an email domain is configured for the project, this function will be
// upgraded to also dispatch a notification email to the studio inbox.
export const sendEnquiryEmail = createServerFn({ method: "POST" })
  .inputValidator((p: Payload) => p)
  .handler(async ({ data }) => {
    console.log("[enquiry] received:", data.kind, data.email);
    return { ok: true };
  });
