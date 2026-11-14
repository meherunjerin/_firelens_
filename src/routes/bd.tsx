import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight, Gamepad2 } from "lucide-react";
import { SiteNav, Footer } from "@/components/fl/SiteNav";
import { Embers } from "@/components/fl/ui";
import { Button } from "@/components/ui/button";
import { DIVISIONS, OUTLINE } from "@/lib/bdgeo";

export const Route = createFileRoute("/bd")({
  head: () => ({ meta: [
    { title: "FireLens — Is this fire normal? Bangladesh" },
    { name: "description", content: "MODIS and VIIRS fire records merged into one history for Bangladesh, with a burning calendar, anomaly score and zones." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { property: "og:title", content: "FireLens — Is this fire normal? Bangladesh" },
    { property: "og:description", content: "Harmonized MODIS + VIIRS fire history for Bangladesh. NASA Space Apps 2026." },
  ] }),
  component: Index,
});

const K = Math.cos((23.5 * Math.PI) / 180), MW = 380, MH = Math.round(((26.75 - 20.5) / ((92.8 - 88) * K)) * MW);
const px = (lon: number) => ((lon - 88) / (92.8 - 88)) * MW, py = (lat: number) => ((26.75 - lat) / (26.75 - 20.5)) * MH;
const toPath = (rings: number[][]) => rings.map((r) => r.reduce((d, v, i) => d + (i % 2 ? py(v).toFixed(1) : `${i ? "L" : "M"}${px(v).toFixed(1)},`), "") + "Z").join("");
const OUTLINE_D = toPath(OUTLINE), DIV_D = DIVISIONS.map((d) => toPath(d.rings));

const layers = [
  { n: "1", t: "Harmonize", d: "MODIS and VIIRS count fires differently. FireLens learns the conversion on the years both satellites observed, then builds one consistent history, with proof on hidden years." },
  { n: "2", t: "Calendar", d: "Pick a division, a grid cell or your own bounds, then see a month-by-year heatmap, the median of the same month in earlier years, and a CSV download." },
  { n: "3", t: "Understand", d: "A Normal / Elevated / Extreme score with a confidence level and a plain-language “Why flagged?”, plus recurring and emerging zones and a division watchlist." },
];

function Index() {
  const [v, setV] = useState<{ r2?: number | undefined; years?: string | undefined } | null>(null);
  useEffect(() => {
    fetch("/data/validation.json").then((r) => (r.ok ? r.json() : null)).then((j) => {
      if (!j) return; const a = j.validation_all ?? (j.r2 != null ? j : null);
      setV({ r2: a?.r2, years: j.series ? `${String(j.series[0]).slice(0, 4)}–${String(j.series[1]).slice(0, 4)}` : undefined });
    }).catch(() => undefined);
  }, []);
  const stats = [
    { l: "Satellite records merged", v: "MODIS + VIIRS" },
    { l: "Period covered", v: v?.years ?? "—" },
    { l: "Validation R² (hidden years)", v: v?.r2 != null ? v.r2.toFixed(3) : "—" },
    { l: "Bangladesh divisions", v: "8" },
  ];
  return (
    <div><SiteNav />
      <section className="relative isolate overflow-hidden"><Embers n={12} />
        <svg viewBox={`0 0 ${MW} ${MH}`} className="pointer-events-none absolute right-12 top-32 hidden w-[420px] lg:block" aria-hidden="true">
          <path d={OUTLINE_D} fill="var(--fire)" fillOpacity={0.12} stroke="var(--fire)" strokeWidth={1.6} />
          {DIV_D.map((d, i) => <path key={i} d={d} fill="none" stroke="var(--fire)" strokeOpacity={0.45} strokeWidth={0.8} />)}
        </svg>
        <div className="relative mx-auto w-full max-w-[1440px] px-6 pb-24 pt-36 md:px-12 md:pt-44">
          <div className="mb-8 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-sat"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sat" />NASA Space Apps Challenge 2026 · Bangladesh</div>
          <h1 className="font-display text-6xl font-bold leading-[0.95] md:text-8xl">Is this fire<br /><span className="text-fire">normal?</span></h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-foreground/75">Fire maps tell us where Earth is burning. FireLens tells us <span className="text-foreground">when Earth is burning differently</span>: one consistent MODIS + VIIRS history for Bangladesh, compared with what is normal for that place and month.</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button asChild size="lg" className="h-12 rounded-sm px-6 text-xs"><Link to="/bangladesh">Try FireLens · Bangladesh <ArrowUpRight /></Link></Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-sm px-6 text-xs"><Link to="/heroes"><Gamepad2 /> Play Hotspot Heroes</Link></Button>
          </div>
          <div className="mt-16 grid max-w-3xl grid-cols-2 gap-8 border-t border-foreground/15 pt-8 md:grid-cols-4">
            {stats.map((s) => <div key={s.l}><div className="font-display text-2xl font-semibold">{s.v}</div><div className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{s.l}</div></div>)}
          </div>
        </div>
      </section>

      <section className="border-t border-border"><div className="mx-auto max-w-[1440px] px-6 py-24 md:px-12">
        <div className="eyebrow">How FireLens works</div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {layers.map((l) => <div key={l.n} className="glass rounded-sm p-6"><div className="font-mono text-xs text-fire">0{l.n}</div><h2 className="mt-3 font-display text-2xl font-semibold">{l.t}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{l.d}</p></div>)}
        </div>
        <p className="mt-10 max-w-3xl font-mono text-[11px] leading-relaxed text-muted-foreground">Honest limits: hotspot counts are not fire size, danger or damage. They include agricultural burning, and satellites pass only a few times a day. FireLens is decision support for monitoring, not a replacement for official fire-management decisions.</p>
      </div></section>

      <section className="border-t border-border"><div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-6 px-6 py-16 md:px-12">
        <div><div className="font-display text-2xl font-semibold">Ready to explore Bangladesh?</div><p className="mt-2 text-sm text-muted-foreground">Open the burning calendar, or learn the science with five quick missions.</p></div>
        <div className="flex gap-3"><Button asChild className="rounded-sm text-xs"><Link to="/bangladesh">Open the calendar</Link></Button><Button asChild variant="outline" className="rounded-sm text-xs"><Link to="/heroes">Hotspot Heroes</Link></Button></div>
      </div></section>
      <Footer />
    </div>
  );
}
