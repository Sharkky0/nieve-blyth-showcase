import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Facebook, Instagram } from "lucide-react";
import { siteContentQuery } from "@/lib/queries";

export function SiteFooter() {
  const { data: contact } = useQuery(siteContentQuery("contact"));
  const email = (contact?.value as any)?.email ?? "nieve_blyth@icloud.com";
  const facebookUrl = (contact?.value as any)?.facebookUrl ?? "";
  const instagramUrl = (contact?.value as any)?.instagramUrl ?? "";

  return (
    <footer className="border-t border-border bg-cream/40 mt-24">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-serif text-2xl text-ink">Nieve Blyth Photography</p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Honest, timeless photography for the moments that matter — portraits,
            weddings, families, and the landscapes we love.
          </p>
        </div>

        <div>
          <p className="eyebrow">Explore</p>
          <ul className="mt-5 space-y-3 text-sm">
            <li><Link to="/portfolio" className="hover:opacity-60">Portfolio</Link></li>
            <li><Link to="/about" className="hover:opacity-60">About</Link></li>
            <li><Link to="/booking" className="hover:opacity-60">Booking</Link></li>
            <li><Link to="/contact" className="hover:opacity-60">Contact</Link></li>
          </ul>
        </div>

        <div>
          <p className="eyebrow">Contact</p>
          <ul className="mt-5 space-y-3 text-sm">
            <li>
              <a href={`mailto:${email}`} className="hover:opacity-60">{email}</a>
            </li>
            <li className="flex gap-4 pt-2">
              {facebookUrl && (
                <a href={facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook" className="hover:opacity-60">
                  <Facebook size={18} strokeWidth={1.5} />
                </a>
              )}
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:opacity-60">
                  <Instagram size={18} strokeWidth={1.5} />
                </a>
              )}
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 py-6 flex flex-col sm:flex-row justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Nieve Blyth Photography. All rights reserved.</p>
          <Link to="/auth" className="hover:opacity-60">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
