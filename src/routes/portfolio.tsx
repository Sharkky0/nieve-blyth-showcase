import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { photosQuery, categoriesQuery, type Photo } from "@/lib/queries";
import { FadeIn } from "@/components/site/FadeIn";
import { Lightbox } from "@/components/site/Lightbox";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — Nieve Blyth Photography" },
      {
        name: "description",
        content:
          "A selection of photography by Nieve Blyth across portrait, wedding, family, landscape, and lifestyle work.",
      },
      { property: "og:title", content: "Portfolio — Nieve Blyth Photography" },
      { property: "og:description", content: "Selected photographs across multiple styles." },
      { property: "og:url", content: "/portfolio" },
    ],
    links: [{ rel: "canonical", href: "/portfolio" }],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const { data: photos = [], isLoading } = useQuery(photosQuery());
  const { data: categories = [] } = useQuery(categoriesQuery());
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered = useMemo(
    () => (activeCat ? photos.filter((p) => p.category_id === activeCat) : photos),
    [photos, activeCat],
  );

  // Distribute into 3 columns for masonry
  const columns = useMemo(() => {
    const cols: Photo[][] = [[], [], []];
    filtered.forEach((p, i) => cols[i % 3].push(p));
    return cols;
  }, [filtered]);

  return (
    <>
      <section className="pt-32 md:pt-40 pb-16 px-6 md:px-10">
        <div className="mx-auto max-w-[1400px]">
          <FadeIn className="text-center max-w-2xl mx-auto">
            <p className="eyebrow">Portfolio</p>
            <h1 className="mt-6 text-4xl md:text-6xl text-ink">Selected photographs</h1>
            <p className="mt-6 text-muted-foreground">
              A growing collection of work across portrait, wedding, family,
              landscape, and lifestyle photography.
            </p>
          </FadeIn>

          {categories.length > 0 && (
            <FadeIn delay={0.2} className="mt-14 flex flex-wrap justify-center gap-2 md:gap-3">
              <FilterChip active={activeCat === null} onClick={() => setActiveCat(null)}>
                All
              </FilterChip>
              {categories.map((c) => (
                <FilterChip
                  key={c.id}
                  active={activeCat === c.id}
                  onClick={() => setActiveCat(c.id)}
                >
                  {c.name}
                </FilterChip>
              ))}
            </FadeIn>
          )}
        </div>
      </section>

      <section className="px-2 md:px-6 pb-32">
        <div className="mx-auto max-w-[1600px]">
          {isLoading ? (
            <div className="text-center py-32 text-muted-foreground text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-32 text-muted-foreground text-sm">
              {photos.length === 0
                ? "The gallery will be added shortly."
                : "No photographs in this category yet."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
              {columns.map((col, ci) => (
                <div key={ci} className="flex flex-col gap-2 md:gap-4">
                  {col.map((p) => {
                    const idx = filtered.findIndex((x) => x.id === p.id);
                    return (
                      <FadeIn
                        key={p.id}
                        className="hover-zoom cursor-zoom-in bg-stone"
                        style={{
                          aspectRatio:
                            p.width && p.height ? `${p.width} / ${p.height}` : "4 / 5",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setLightboxIndex(idx)}
                          className="block h-full w-full"
                          aria-label={p.alt_text || "View photograph"}
                        >
                          <img
                            src={p.public_url}
                            alt={p.alt_text}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                          />
                        </button>
                      </FadeIn>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Lightbox
        photos={filtered}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChange={setLightboxIndex}
      />
    </>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 text-[11px] uppercase tracking-[0.22em] border transition-colors",
        active
          ? "bg-ink text-white border-ink"
          : "border-border text-muted-foreground hover:text-ink hover:border-ink",
      )}
    >
      {children}
    </button>
  );
}
