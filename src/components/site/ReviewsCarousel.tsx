import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { reviewsQuery } from "@/lib/queries";
import { FadeIn } from "@/components/site/FadeIn";

export function ReviewsCarousel() {
  const { data: reviews = [] } = useQuery(reviewsQuery());
  const [emblaRef, embla] = useEmblaCarousel({
    align: "start",
    loop: false,
    skipSnaps: false,
    duration: 28,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!embla) return;
    setCanPrev(embla.canScrollPrev());
    setCanNext(embla.canScrollNext());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    onSelect();
    embla.on("select", onSelect);
    embla.on("reInit", onSelect);
  }, [embla, onSelect]);

  if (reviews.length === 0) return null;

  return (
    <section className="pb-32 px-6 md:px-10">
      <div className="mx-auto max-w-[1200px]">
        <FadeIn className="text-center">
          <p className="eyebrow">Kind words</p>
          <h2 className="mt-6 text-3xl md:text-4xl text-ink">From Facebook</h2>
        </FadeIn>

        <FadeIn delay={0.15} className="mt-14 relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6">
              {reviews.map((r) => (
                <article
                  key={r.id}
                  className="flex-[0_0_100%] sm:flex-[0_0_70%] md:flex-[0_0_46%] lg:flex-[0_0_32%] min-w-0 border border-border bg-cream/30 p-8 flex flex-col"
                >
                  <div className="flex gap-1 text-ink" aria-label={`${r.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        strokeWidth={1.5}
                        className={i < r.rating ? "fill-current" : "opacity-25"}
                      />
                    ))}
                  </div>
                  <p className="mt-5 text-sm leading-relaxed text-ink/85 whitespace-pre-wrap flex-1">
                    "{r.body}"
                  </p>
                  <p className="mt-6 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    — {r.author}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <button
            onClick={() => embla?.scrollPrev()}
            disabled={!canPrev}
            aria-label="Previous review"
            className="absolute -left-2 md:-left-6 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white border border-border flex items-center justify-center shadow-sm hover:bg-cream transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => embla?.scrollNext()}
            disabled={!canNext}
            aria-label="Next review"
            className="absolute -right-2 md:-right-6 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white border border-border flex items-center justify-center shadow-sm hover:bg-cream transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>
        </FadeIn>
      </div>
    </section>
  );
}
