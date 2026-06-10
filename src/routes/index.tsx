import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { featuredPhotosQuery, siteContentQuery } from "@/lib/queries";
import { FadeIn } from "@/components/site/FadeIn";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nieve Blyth Photography — Portrait, Wedding & Landscape" },
      {
        name: "description",
        content:
          "Quiet, considered photography by Nieve Blyth — portraits, weddings, families, and landscapes captured with patience and natural light.",
      },
      { property: "og:title", content: "Nieve Blyth Photography" },
      {
        property: "og:description",
        content: "Portrait, wedding, family, and landscape photography by Nieve Blyth.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  const { data: hero } = useQuery(siteContentQuery("hero"));
  const { data: intro } = useQuery(siteContentQuery("intro"));
  const { data: featured } = useQuery(featuredPhotosQuery());

  const heroData = (hero?.value as any) ?? {};
  const introData = (intro?.value as any) ?? {};

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const heroImage = featured?.[0]?.public_url;

  return (
    <>
      {/* Hero */}
      <section ref={heroRef} className="relative h-dvh w-full overflow-hidden bg-ink">
        <motion.div style={{ y }} className="absolute inset-0">
          {heroImage ? (
            <img
              src={heroImage}
              alt={featured?.[0]?.alt_text || "Featured photograph"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-b from-stone-200 to-stone-400" />
          )}
          <div className="absolute inset-0 bg-black/25" />
        </motion.div>

        <motion.div
          style={{ opacity }}
          className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white px-6"
        >
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.3 }}
            className="eyebrow text-white/80"
          >
            Photography Studio
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, delay: 0.5 }}
            className="mt-6 text-5xl md:text-7xl lg:text-8xl font-light tracking-tight max-w-4xl"
          >
            {heroData.title ?? "Nieve Blyth Photography"}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, delay: 0.8 }}
            className="mt-6 max-w-xl text-base md:text-lg font-light text-white/85"
          >
            {heroData.subtitle ?? "Quiet moments, beautifully kept."}
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, delay: 1.1 }}
            className="mt-10"
          >
            <Link
              to="/booking"
              className="inline-block border border-white/70 px-10 py-4 text-xs uppercase tracking-[0.28em] text-white hover:bg-white hover:text-ink transition-all duration-500"
            >
              {heroData.cta ?? "Book a Session"}
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/70 text-[10px] uppercase tracking-[0.3em]"
        >
          Scroll
        </motion.div>
      </section>

      {/* Portfolio CTA */}
      <section className="py-32 md:py-44 px-6 md:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <FadeIn><p className="eyebrow">Studio</p></FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="mt-6 text-3xl md:text-5xl leading-tight text-ink">
              {introData.heading ?? "A studio devoted to honest, timeless imagery."}
            </h2>
          </FadeIn>
          <FadeIn delay={0.25}>
            <p className="mt-8 text-base md:text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              {introData.body ??
                "Every frame is made with patience, care, and an eye for the light that makes a moment feel like itself."}
            </p>
          </FadeIn>
          <FadeIn delay={0.4}>
            <Link
              to="/portfolio"
              className="group mt-12 inline-flex items-center gap-4 bg-ink text-white px-12 py-6 md:px-16 md:py-7 text-sm md:text-base uppercase tracking-[0.32em] shadow-xl hover:bg-ink/85 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-500"
            >
              <span>Explore the Portfolio</span>
              <span aria-hidden className="inline-block transition-transform duration-500 group-hover:translate-x-2">→</span>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* Featured grid */}
      {featured && featured.length > 1 && (
        <section className="px-2 md:px-6 pb-32">
          <div className="mx-auto max-w-[1400px]">
            <FadeIn className="text-center mb-16">
              <p className="eyebrow">Selected Work</p>
              <h2 className="mt-4 text-3xl md:text-4xl text-ink">From the portfolio</h2>
            </FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
              {featured.slice(1, 7).map((p, i) => (
                <FadeIn key={p.id} delay={i * 0.08} className="hover-zoom aspect-[4/5] bg-stone">
                  <img
                    src={p.public_url}
                    alt={p.alt_text}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </FadeIn>
              ))}
            </div>
            <FadeIn className="text-center mt-16">
              <Link
                to="/portfolio"
                className="inline-block border-b border-ink pb-1 text-xs uppercase tracking-[0.28em] hover:opacity-60 transition-opacity"
              >
                View full portfolio
              </Link>
            </FadeIn>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-cream/60 py-32 px-6">
        <div className="mx-auto max-w-2xl text-center">
          <FadeIn><p className="eyebrow">Begin</p></FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="mt-6 text-3xl md:text-5xl text-ink">
              Let's create something to keep.
            </h2>
          </FadeIn>
          <FadeIn delay={0.25}>
            <p className="mt-6 text-muted-foreground">
              Booking is open for portraits, weddings, and personal commissions.
            </p>
          </FadeIn>
          <FadeIn delay={0.4}>
            <Link
              to="/booking"
              className="mt-10 inline-block bg-ink text-white px-10 py-4 text-xs uppercase tracking-[0.28em] hover:bg-ink/85 transition-colors"
            >
              Enquire about a session
            </Link>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
