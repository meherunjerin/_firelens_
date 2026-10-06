import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const items = [
  { label: "Mission", href: "/#mission" },
  { label: "Fire Intelligence", href: "/#map" },
  { label: "FireDNA", href: "/#firedna" },
  { label: "Anomalies", href: "/#anomaly" },
  { label: "Fire Insights", href: "/#insights" },
  { label: "Response Center", href: "/#response" },
];

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="relative grid h-8 w-8 place-items-center rounded-full border border-sat/40">
        <span className="absolute inset-1 rounded-full border border-fire/60" />
        <span className="h-2 w-2 rounded-full bg-fire glow-fire" />
      </span>
      <span className="font-display text-lg font-extrabold tracking-tight">Fire<span className="text-fire">Lens</span></span>
    </Link>
  );
}

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all ${scrolled ? "glass border-x-0 border-t-0" : "border-b border-transparent"}`}>
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6">
        <Logo />
        <nav className="hidden items-center gap-6 lg:flex">
          {items.map((i) => (
            <a key={i.href} href={i.href} className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground">
              {i.label}
            </a>
          ))}
          <Link to="/heroes" className="font-mono text-[11px] uppercase tracking-[0.16em] text-ember hover:text-amber">Hotspot Heroes</Link>
          <Link to="/data" className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground">About the Data</Link>
        </nav>
        <a href="/#map" className="rounded-sm bg-fire-gradient px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-foreground glow-fire">
          Launch
        </a>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <Logo />
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          NASA Space Apps Challenge 2026 · Data: NASA FIRMS MODIS C6.1 & VIIRS 375m · Demo values
        </p>
        <div className="flex gap-5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          <Link to="/data" className="hover:text-foreground">Methodology</Link>
          <Link to="/heroes" className="hover:text-foreground">Hotspot Heroes</Link>
          <Link to="/firescope/$regionId" params={{ regionId: "amazonas" }} className="hover:text-foreground">FireScope</Link>
        </div>
      </div>
    </footer>
  );
}
