import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Home" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/about", label: "About" },
  { to: "/booking", label: "Booking" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  const transparent = isHome && !scrolled;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        transparent
          ? "bg-transparent"
          : "bg-background/85 backdrop-blur-md border-b border-border/60",
      )}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5 md:px-10">
        <Link
          to="/"
          className={cn(
            "font-serif text-lg tracking-tight transition-colors",
            transparent ? "text-white" : "text-ink",
          )}
        >
          Nieve Blyth
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className={cn(
                "text-[11px] uppercase tracking-[0.22em] transition-opacity hover:opacity-60",
                transparent ? "text-white/90" : "text-ink",
              )}
              activeProps={{ className: "opacity-100 [&]:font-medium" }}
              inactiveProps={{ className: "opacity-80" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "md:hidden p-2 -mr-2",
            transparent ? "text-white" : "text-ink",
          )}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-background border-t border-border animate-fade-in-slow">
          <nav className="flex flex-col px-6 py-6 gap-5">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-sm uppercase tracking-[0.22em] text-ink"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
