import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { packagesQuery } from "@/lib/queries";
import { FadeIn } from "@/components/site/FadeIn";

export function PackagesList() {
  const { data: packages = [] } = useQuery(packagesQuery(true));
  if (packages.length === 0) return null;

  return (
    <FadeIn className="mt-20">
      <div className="text-center">
        <p className="eyebrow">Offers & Packages</p>
        <h2 className="mt-5 text-2xl md:text-3xl text-ink">Choose your session</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Scroll to explore current offerings.
        </p>
      </div>

      <div className="mt-10 max-h-[520px] overflow-y-auto pr-2 space-y-5 lf-scroll">
        {packages.map((p) => (
          <article
            key={p.id}
            className="relative border border-border bg-white p-6 md:p-7 hover:border-ink/40 transition-colors"
          >
            {p.badge && (
              <span className="absolute -top-2 left-6 bg-ink text-white text-[10px] uppercase tracking-[0.22em] px-3 py-1">
                {p.badge}
              </span>
            )}
            <div className="flex justify-between items-start gap-4 flex-wrap">
              <div>
                <h3 className="text-lg text-ink">{p.title}</h3>
                {p.description && (
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-md">
                    {p.description}
                  </p>
                )}
              </div>
              {p.price && (
                <p className="text-xl text-ink whitespace-nowrap">{p.price}</p>
              )}
            </div>
            {p.features.length > 0 && (
              <ul className="mt-5 space-y-2">
                {p.features.map((f, i) => (
                  <li key={i} className="flex gap-3 text-sm text-ink/85">
                    <Check size={16} strokeWidth={1.5} className="mt-0.5 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>

      <style>{`
        .lf-scroll::-webkit-scrollbar { width: 6px; }
        .lf-scroll::-webkit-scrollbar-track { background: transparent; }
        .lf-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
        .lf-scroll::-webkit-scrollbar-thumb:hover { background: var(--ink); }
      `}</style>
    </FadeIn>
  );
}
