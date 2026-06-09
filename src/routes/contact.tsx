import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Facebook, Instagram, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { siteContentQuery } from "@/lib/queries";
import { sendEnquiryEmail } from "@/lib/email.functions";
import { FadeIn } from "@/components/site/FadeIn";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Nieve Blyth Photography" },
      {
        name: "description",
        content: "Get in touch with Nieve Blyth Photography — email and social.",
      },
      { property: "og:title", content: "Contact — Nieve Blyth Photography" },
      { property: "og:description", content: "Contact Nieve Blyth Photography." },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(1).max(2000),
});
type Form = z.infer<typeof schema>;

function ContactPage() {
  const { data } = useQuery(siteContentQuery("contact"));
  const contact = (data?.value as any) ?? {};
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Form) => {
    const { error } = await supabase.from("contact_messages").insert(values);
    if (error) {
      toast.error("Couldn't send your message. Please try again.");
      return;
    }
    try {
      await sendEnquiryEmail({
        data: { kind: "contact", name: values.name, email: values.email, message: values.message },
      });
    } catch (e) {
      console.warn("email delivery failed", e);
    }
    setSent(true);
    reset();
  };

  return (
    <section className="pt-32 md:pt-40 pb-32 px-6 md:px-10">
      <div className="mx-auto max-w-[1100px] grid md:grid-cols-2 gap-16 md:gap-24">
        <FadeIn>
          <p className="eyebrow">Contact</p>
          <h1 className="mt-6 text-4xl md:text-5xl text-ink leading-[1.1]">
            Say hello.
          </h1>
          <p className="mt-6 text-muted-foreground max-w-md leading-relaxed">
            For collaborations, questions, or just to start a conversation —
            Nieve loves hearing from people who care about photographs as much
            as she does.
          </p>
          <ul className="mt-12 space-y-5 text-sm">
            <li>
              <p className="eyebrow">Email</p>
              <a
                href={`mailto:${contact.email ?? "nieve_blyth@icloud.com"}`}
                className="mt-2 inline-flex items-center gap-3 text-ink hover:opacity-60"
              >
                <Mail size={16} strokeWidth={1.5} />
                {contact.email ?? "nieve_blyth@icloud.com"}
              </a>
            </li>
            <li>
              <p className="eyebrow">Social</p>
              <div className="mt-2 flex gap-5">
                {contact.facebookUrl && (
                  <a href={contact.facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook" className="text-ink hover:opacity-60">
                    <Facebook size={18} strokeWidth={1.5} />
                  </a>
                )}
                {contact.instagramUrl && (
                  <a href={contact.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram" className="text-ink hover:opacity-60">
                    <Instagram size={18} strokeWidth={1.5} />
                  </a>
                )}
                {!contact.facebookUrl && !contact.instagramUrl && (
                  <span className="text-xs text-muted-foreground">Social links coming soon.</span>
                )}
              </div>
            </li>
          </ul>
        </FadeIn>

        <FadeIn delay={0.15}>
          {sent ? (
            <div className="border border-border p-10 text-center">
              <p className="eyebrow">Thank you</p>
              <p className="mt-4 text-xl text-ink">Your message has been sent.</p>
              <button
                onClick={() => setSent(false)}
                className="mt-6 border-b border-ink pb-1 text-xs uppercase tracking-[0.28em] hover:opacity-60"
              >
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-7" noValidate>
              <label className="block">
                <span className="eyebrow">Name</span>
                <input {...register("name")} className="lf-input mt-1" />
                {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
              </label>
              <label className="block">
                <span className="eyebrow">Email</span>
                <input type="email" {...register("email")} className="lf-input mt-1" />
                {errors.email && <span className="text-xs text-destructive">{errors.email.message}</span>}
              </label>
              <label className="block">
                <span className="eyebrow">Message</span>
                <textarea {...register("message")} rows={6} className="lf-input mt-1 resize-none" />
                {errors.message && <span className="text-xs text-destructive">{errors.message.message}</span>}
              </label>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-ink text-white px-10 py-4 text-xs uppercase tracking-[0.28em] hover:bg-ink/85 transition-colors disabled:opacity-60"
              >
                {isSubmitting ? "Sending…" : "Send message"}
              </button>
              <style>{`
                .lf-input { width:100%; background:transparent; border:0; border-bottom:1px solid var(--border); padding:0.65rem 0; font-size:0.95rem; color:var(--ink); outline:none; transition:border-color 200ms; }
                .lf-input:focus { border-bottom-color: var(--ink); }
              `}</style>
            </form>
          )}
        </FadeIn>
      </div>
    </section>
  );
}
