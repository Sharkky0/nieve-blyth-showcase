import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sendEnquiryEmail } from "@/lib/email.functions";
import { FadeIn } from "@/components/site/FadeIn";
import { PackagesList } from "@/components/site/PackagesList";
import { packagesQuery } from "@/lib/queries";

export const Route = createFileRoute("/booking")({
  head: () => ({
    meta: [
      { title: "Booking — Nieve Blyth Photography" },
      {
        name: "description",
        content:
          "Enquire about a portrait, wedding, family, or landscape session with Nieve Blyth Photography.",
      },
      { property: "og:title", content: "Booking — Nieve Blyth Photography" },
      { property: "og:description", content: "Book a photography session with Nieve Blyth." },
      { property: "og:url", content: "/booking" },
    ],
    links: [{ rel: "canonical", href: "/booking" }],
  }),
  component: BookingPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  event_type: z.string().trim().max(100).optional().or(z.literal("")),
  preferred_date: z.string().optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});
type Form = z.infer<typeof schema>;

function BookingPage() {
  const [sent, setSent] = useState(false);
  const { data: packages = [] } = useQuery(packagesQuery(true));
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Form) => {
    const payload = {
      name: values.name,
      email: values.email,
      phone: values.phone || null,
      event_type: values.event_type || null,
      preferred_date: values.preferred_date || null,
      message: values.message || null,
    };
    const { error } = await supabase.from("booking_enquiries").insert(payload);
    if (error) {
      toast.error("Couldn't send your enquiry. Please try again.");
      return;
    }
    try {
      await sendEnquiryEmail({
        data: {
          kind: "booking",
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          event_type: payload.event_type,
          preferred_date: payload.preferred_date,
          message: payload.message,
        },
      });
    } catch (e) {
      console.warn("email delivery failed", e);
    }
    setSent(true);
    reset();
  };

  return (
    <section className="pt-32 md:pt-40 pb-32 px-6 md:px-10">
      <div className="mx-auto max-w-2xl">
        <FadeIn className="text-center">
          <p className="eyebrow">Booking</p>
          <h1 className="mt-6 text-4xl md:text-5xl text-ink">Book a session</h1>
          <p className="mt-6 text-muted-foreground">
            Share a few details and Nieve will reply within a few days to discuss
            your session, dates, and how to make it everything you'd hoped for.
          </p>
        </FadeIn>

        <PackagesList />

        {sent ? (
          <FadeIn className="mt-16 border border-border p-10 text-center">
            <p className="eyebrow">Thank you</p>
            <p className="mt-4 text-xl text-ink">Your enquiry has been sent.</p>
            <p className="mt-3 text-sm text-muted-foreground">
              You'll hear back at the email address you provided.
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-8 border-b border-ink pb-1 text-xs uppercase tracking-[0.28em] hover:opacity-60"
            >
              Send another enquiry
            </button>
          </FadeIn>
        ) : (
          <FadeIn delay={0.15}>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-16 space-y-8" noValidate>
              <Field label="Name" error={errors.name?.message}>
                <input
                  {...register("name")}
                  autoComplete="name"
                  className="lf-input"
                />
              </Field>
              <div className="grid md:grid-cols-2 gap-8">
                <Field label="Email" error={errors.email?.message}>
                  <input
                    type="email"
                    {...register("email")}
                    autoComplete="email"
                    className="lf-input"
                  />
                </Field>
                <Field label="Phone number" error={errors.phone?.message}>
                  <input
                    type="tel"
                    {...register("phone")}
                    autoComplete="tel"
                    className="lf-input"
                  />
                </Field>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <Field label="Session / package" error={errors.event_type?.message}>
                  <select {...register("event_type")} className="lf-input bg-transparent">
                    <option value="">— Select a package —</option>
                    {packages.map((p) => (
                      <option key={p.id} value={p.title}>
                        {p.title}{p.price ? ` — ${p.price}` : ""}
                      </option>
                    ))}
                    <option value="Other">Other / not sure yet</option>
                  </select>
                </Field>
                <Field label="Preferred date" error={errors.preferred_date?.message}>
                  <input
                    type="date"
                    {...register("preferred_date")}
                    className="lf-input"
                  />
                </Field>
              </div>
              <Field label="Message" error={errors.message?.message}>
                <textarea
                  {...register("message")}
                  rows={5}
                  className="lf-input resize-none"
                  placeholder="Tell Nieve about the moment you'd like to capture."
                />
              </Field>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-ink text-white px-12 py-4 text-xs uppercase tracking-[0.28em] hover:bg-ink/85 transition-colors disabled:opacity-60"
              >
                {isSubmitting ? "Sending…" : "Send enquiry"}
              </button>
            </form>
            <style>{`
              .lf-input {
                width: 100%;
                background: transparent;
                border: 0;
                border-bottom: 1px solid var(--border);
                padding: 0.65rem 0;
                font-size: 0.95rem;
                color: var(--ink);
                outline: none;
                transition: border-color 200ms;
              }
              .lf-input:focus { border-bottom-color: var(--ink); }
            `}</style>
          </FadeIn>
        )}
      </div>
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="eyebrow block">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <span className="block mt-1 text-xs text-destructive">{error}</span>}
    </label>
  );
}
