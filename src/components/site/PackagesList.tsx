import { useQuery } from "@tanstack/react-query";
import { packagesQuery } from "@/lib/queries";
import { FadeIn } from "@/components/site/FadeIn";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function PackagesList() {
  const { data: packages = [] } = useQuery(packagesQuery(true));
  if (packages.length === 0) return null;

  return (
    <FadeIn className="mt-20">
      <div className="text-center">
        <p className="eyebrow">Offers & Packages</p>
        <h2 className="mt-5 text-2xl md:text-3xl text-ink">Choose your session</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Scroll sideways to explore current offerings.
        </p>
      </div>

      <Carousel
        opts={{ align: "start", loop: packages.length > 1 }}
        className="mt-10 w-full"
      >
        <CarouselContent className="-ml-4 pt-4">
          {packages.map((p) => (
            <CarouselItem
              key={p.id}
              className="pl-4 basis-full sm:basis-1/2 md:basis-1/2 lg:basis-1/3"
            >
              <article className="relative border border-border bg-white p-6 md:p-7 hover:border-ink/40 transition-colors h-full">
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
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-0 -translate-x-1/2" />
        <CarouselNext className="right-0 translate-x-1/2" />
      </Carousel>
    </FadeIn>
  );
}
