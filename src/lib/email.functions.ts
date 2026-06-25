import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const bookingSchema = z.object({
  kind: z.literal("booking"),
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).nullish(),
  event_type: z.string().trim().max(100).nullish(),
  preferred_date: z
    .string()
    .trim()
    .max(40)
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")
    .nullish(),
  message: z.string().trim().max(2000).nullish(),
});

const contactSchema = z.object({
  kind: z.literal("contact"),
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(1).max(2000),
});

const payloadSchema = z.discriminatedUnion("kind", [bookingSchema, contactSchema]);

// Stub: enquiries are always saved in the database (admin can see them in /admin).
// Once an email domain is configured for the project, this function will be
// upgraded to also dispatch a notification email to the studio inbox.
export const sendEnquiryEmail = createServerFn({ method: "POST" })
  .inputValidator((p: unknown) => payloadSchema.parse(p))
  .handler(async ({ data }) => {
    console.log("[enquiry] received:", data.kind);
    return { ok: true };
  });
