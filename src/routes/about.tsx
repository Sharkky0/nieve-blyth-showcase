import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { siteContentQuery } from "@/lib/queries";
import { FadeIn } from "@/components/site/FadeIn";
import { ReviewsCarousel } from "@/components/site/ReviewsCarousel";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Nieve Blyth Photography" },
      {
        name: "description",
        content:
          "Meet Nieve Blyth — the photographer behind the studio. Story, approach, and what to expect when working together.",
      },
      { property: "og:title", content: "About — Nieve Blyth Photography" },
      { property: "og:description", content: "About the photographer." },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { data } = useQuery(siteContentQuery("about"));
  const about = (data?.value as any) ?? {};

  return (
    <>
    <section className="pt-32 md:pt-44 pb-32 px-6 md:px-10">
      <div className="mx-auto max-w-[1200px] grid md:grid-cols-2 gap-16 md:gap-24 items-center">
        <FadeIn className="order-2 md:order-1">
          <p className="eyebrow">About</p>
          <h1 className="mt-6 text-4xl md:text-5xl text-ink leading-[1.1]">
            {about.heading ?? "About Nieve"}
          </h1>
          <div className="mt-8 space-y-5 text-muted-foreground leading-relaxed">
            {(about.body ?? "")
              .split("\n\n")
              .filter(Boolean)
              .map((p: string, i: number) => (
                <p key={i}>{p}</p>
              ))}
          </div>
          <Link
            to="/booking"
            className="mt-10 inline-block border-b border-ink pb-1 text-xs uppercase tracking-[0.28em] hover:opacity-60"
          >
            Work with Nieve
          </Link>
        </FadeIn>
        <FadeIn delay={0.2} className="order-1 md:order-2">
          <div className="aspect-[4/5] bg-stone hover-zoom">
            {about.portraitUrl ? (
              <img
                src={about.portraitUrl}
                alt="Portrait of Nieve Blyth"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Portrait
              </div>
            )}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
