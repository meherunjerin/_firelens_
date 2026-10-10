import { useMemo, useState } from "react";
import worldMap from "@/assets/world-map.jpg";
import { REGIONS, MONTHS, hotspotsForYear, project, severity, type Hotspot } from "@/lib/firedata";
import { SectionHead } from "./ui";
import { OrbitLoader } from "./OrbitLoader";
import { Button } from "@/components/ui/button";
import { Crosshair, Search, Layers, Globe } from "lucide-react";

const LAYERS = ["Harmonized", "MODIS Only", "VIIRS Only", "Historical Density", "Current Activity", "Recurring Zones", "Emerging Zones", "Responder Priority"] as const;
type Layer = (typeof LAYERS)[number];

export function WorldCanvas({ hotspots, scale = 1, layer = "Harmonized", onHover, className = "", dim = false, showPriority = false }: {
  hotspots: Hotspot[]; scale?: number; layer?: Layer; onHover?: (h: Hotspot | null, e?: React.MouseEvent) => void; className?: string; dim?: boolean; showPriority?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`absolute inset-0 ${className}`}>
      {!loaded && <div className="absolute inset-0 grid place-items-center bg-background"><OrbitLoader /></div>}
      <img onLoad={() => setLoaded(true)} src={worldMap} alt="Global Earth observation basemap" width={1920} height={960} loading="lazy" className={`absolute inset-0 h-full w-full object-fill ${dim ? "opacity-40" : "opacity-70"}`} />
      <div className="tech-grid absolute inset-0" />
      {layer === "Historical Density" && REGIONS.map((r) => {
        const p = project(r.lat, r.lon);
        return <span key={r.id} className="heat-intensity absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-fire/25 blur-xl"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${r.spread * 1.2 * (r.weight + 0.4)}%`, aspectRatio: "1" }} />;
      })}
      {hotspots.map((h) => {
        const p = project(h.lat, h.lon);
        const base = h.sensor === "MODIS" ? 5 : 3;
        const sz = (base + h.intensity * 3) / Math.sqrt(scale);
        const tone = layer === "Recurring Zones" ? (h.recurring ? "bg-amber" : "bg-muted-foreground/30")
          : layer === "Emerging Zones" ? (h.emerging ? "bg-lava" : "bg-muted-foreground/30")
          : h.sensor === "MODIS" && layer === "MODIS Only" ? "bg-sat" : h.intensity > 0.75 ? "bg-lava" : h.intensity > 0.5 ? "bg-fire" : "bg-ember";
        return (
          <span key={h.id} onMouseEnter={(e) => onHover?.(h, e)} onMouseLeave={() => onHover?.(null)}
            className={`hotspot-marker absolute -translate-x-1/2 -translate-y-1/2 cursor-crosshair rounded-full hover:ring-2 hover:ring-sat ${tone}`}
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: sz, height: sz, opacity: 0.55 + h.intensity * 0.45,
              boxShadow: h.intensity > 0.7 ? "var(--glow-fire)" : undefined }} />
        );
      })}
      {!showPriority && REGIONS.filter(r => r.anomaly >= 79).map(r => { const p = project(r.lat,r.lon); return <div key={r.id} className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={{left:`${p.x}%`,top:`${p.y}%`}}><span className="anim-pulse-hot absolute -left-4 -top-4 h-8 w-8 rounded-full border border-fire/65" style={{animationDelay:`${r.anomaly % 4}s`}} /></div>; })}
      {showPriority && [...REGIONS].sort((a, b) => b.priority - a.priority).slice(0, 5).map((r, i) => {
        const p = project(r.lat, r.lon);
        return (
          <div key={r.id} className="pointer-events-none absolute" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
            <span className="anim-pulse-hot absolute -left-6 -top-6 h-12 w-12 rounded-full border-2 border-lava" />
            <span className="absolute -left-3 -top-3 grid h-6 w-6 place-items-center rounded-full bg-lava font-mono text-[10px] font-bold text-destructive-foreground">{i + 1}</span>
          </div>
        );
      })}
    </div>
  );
}

export function FireMap({ focus, setFocus }: { focus: string | null; setFocus: (id: string | null) => void }) {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(7);
  const [layer, setLayer] = useState<Layer>("Harmonized");
  const [q, setQ] = useState("");
  const [period, setPeriod] = useState<"selected" | "historical">("selected");
  const [hover, setHover] = useState<{ h: Hotspot; x: number; y: number } | null>(null);

  const observationYear = period === "historical" ? 2010 : year;
  const all = useMemo(() => hotspotsForYear(observationYear), [observationYear]);
  const hotspots = useMemo(() => {
    const mScale = 0.35 + 0.65 * Math.sin(((month + 1) / 12) * Math.PI);
    let hs = all.filter((_, i) => i % 100 < mScale * 100);
    if (layer === "MODIS Only") hs = hs.filter((h) => h.sensor === "MODIS");
    if (layer === "VIIRS Only") hs = hs.filter((h) => h.sensor === "VIIRS");
    if (layer === "Current Activity") hs = hs.filter((h) => h.intensity > 0.5);
    return hs;
  }, [all, layer, month]);

  const region = REGIONS.find((r) => r.id === focus);
  const scale = region ? 4 : 1;
  const p = region ? project(region.lat, region.lon) : { x: 50, y: 50 };
  const tx = 50 - p.x * scale, ty = 50 - p.y * scale;
  const matches = q ? REGIONS.filter((r) => (r.name + r.country).toLowerCase().includes(q.toLowerCase())) : [];

  return (
    <section id="map" className="section-divider relative pt-24 pb-12">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12">
        <SectionHead index="02" eyebrow="Global fire intelligence" title={<>Every hotspot,<br />in <span className="text-fire-gradient">historical context.</span></>} />
      </div>
      <div className="relative w-full">
        <div className="map-workspace relative overflow-hidden border-y border-border bg-background">
          <div className="absolute inset-0 origin-top-left transition-transform duration-[1600ms] ease-[cubic-bezier(.65,0,.35,1)]"
            style={{ transform: `translate(${tx}%, ${ty}%) scale(${scale})` }}>
            <WorldCanvas hotspots={hotspots} scale={scale} layer={layer} showPriority={layer === "Responder Priority"}
              onHover={(h, e) => setHover(h && e ? { h, x: e.clientX, y: e.clientY } : null)} />
          </div>

          {/* Controls */}
          <div className="map-toolbar glass absolute left-4 top-4 z-10 w-[260px] rounded-sm p-4 md:left-10 md:top-7">
            <div className="mb-3 flex items-center justify-between font-mono text-[9px] uppercase text-sat"><span className="flex items-center gap-2"><Crosshair size={13} />Observation console</span><span>DEMO</span></div>
            <label className="relative block"><Search size={13} className="absolute left-2.5 top-3 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search region or country" placeholder="Search region or country…"
              className="w-full rounded-sm border border-input bg-background/60 pl-8 pr-3 py-2 font-mono text-xs outline-none focus:border-fire" /></label>
            {q && matches.length === 0 && <div className="mt-3 border-l border-sat pl-3 text-xs text-muted-foreground">No matching region. <span className="block mt-1 text-foreground">Try Brazil, California or Amazonas.</span></div>}
            {matches.length > 0 && (
              <div className="mt-2 space-y-1">
                {matches.slice(0, 5).map((m) => (
                  <Button variant="ghost" size="sm" key={m.id} onClick={() => { setFocus(m.id); setQ(""); }} className="block w-full rounded-sm px-2 py-1 text-left text-xs hover:bg-secondary">
                    {m.name} <span className="text-muted-foreground">· {m.country}</span>
                  </Button>
                ))}
              </div>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <select value={month} onChange={(e) => setMonth(+e.target.value)} aria-label="Observation month" className="rounded-sm border border-input bg-background/60 px-2 py-1.5 font-mono text-xs">
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <Button variant="outline" size="sm" onClick={() => setFocus(null)} className="rounded-sm border border-input px-2 py-1.5 font-mono text-xs hover:border-sat hover:text-sat"><Globe size={12} /> Global</Button>
            </div>
            <div className="mt-3 grid grid-cols-2 border border-input rounded-sm" role="group" aria-label="Observation period">
              <Button size="sm" variant="ghost" aria-pressed={period === "historical"} onClick={() => setPeriod("historical")} className={`rounded-none px-1 font-mono text-[9px] ${period === "historical" ? "bg-sat/15 text-sat" : "text-muted-foreground"}`}>History · 2010</Button>
              <Button size="sm" variant="ghost" aria-pressed={period === "selected"} onClick={() => setPeriod("selected")} className={`rounded-none px-1 font-mono text-[9px] ${period === "selected" ? "bg-fire/15 text-fire" : "text-muted-foreground"}`}>Selected · {year}</Button>
            </div>
            <label className="mt-3 block md:hidden"><span className="mb-1 block font-mono text-[9px] text-muted-foreground">LAYERS</span><select aria-label="Map layer" value={layer} onChange={e=>setLayer(e.target.value as Layer)} className="w-full rounded-sm border border-input bg-background px-2 py-2 text-xs">{LAYERS.map(l=><option key={l}>{l}</option>)}</select></label>
          </div>
          <div className="glass absolute right-10 top-7 hidden w-52 rounded-sm p-3 md:block">
            <div className="px-2 pb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"><Layers size={12} className="mr-2 inline" />Layers</div>
            {LAYERS.map((l) => (
              <Button variant="ghost" size="sm" aria-pressed={layer === l} key={l} onClick={() => setLayer(l)} className={`flex h-8 w-full justify-start items-center gap-2 rounded-sm px-2 py-1 text-left text-[11px] transition-colors ${layer === l ? "bg-fire/15 text-fire" : "hover:bg-secondary"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${layer === l ? "bg-fire" : "bg-muted-foreground/40"}`} />{l}
              </Button>
            ))}
          </div>
          {region && (
            <div className="glass absolute bottom-28 left-4 rounded-sm border-l-2 border-l-fire p-4 md:left-10">
              <div className="eyebrow">Focused region</div>
              <div className="mt-1 font-display text-xl font-bold">{region.name}</div>
              <div className="font-mono text-xs text-muted-foreground">{region.country} · anomaly {region.anomaly}/100 · <span className="text-fire">{severity(region.anomaly)}</span></div>
            </div>
          )}
          {/* Timeline */}
          <div className="glass absolute inset-x-4 bottom-4 rounded-sm px-4 py-4 md:inset-x-10">
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] text-muted-foreground">2002</span>
              <input type="range" aria-label="Observation year" min={2002} max={2026} value={year} onChange={(e) => { setYear(+e.target.value); setPeriod("selected"); }} className="fl-range min-w-0 flex-1" />
              <span className="font-mono text-[10px] text-muted-foreground">2026</span>
              <span className="min-w-[80px] text-right font-display text-base font-bold text-fire">{MONTHS[month]} {observationYear}</span>
            </div>
            <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>{hotspots.length.toLocaleString()} detections shown</span>
              <span>{observationYear < 2012 ? "MODIS era" : "MODIS + VIIRS harmonized"}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-6 py-5 font-mono text-[9px] uppercase text-muted-foreground md:px-12"><span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-fire" />Active detection <span className="ml-4 h-1.5 w-1.5 rounded-full bg-sat" />MODIS / VIIRS</span><span>Historical record 2002 — 2026 · Harmonized observations</span></div>
      {hover && (
        <div className="glass pointer-events-none fixed z-50 w-56 rounded-sm p-3 text-xs" style={{ left: Math.min(hover.x + 14, window.innerWidth - 240), top: Math.min(hover.y + 14, window.innerHeight - 190) }}>
          <div className="font-display text-sm font-bold">{hover.h.region}</div>
          {[
            ["Satellite", hover.h.sensor],
            ["Intensity", hover.h.intensity > 0.75 ? "High" : hover.h.intensity > 0.5 ? "Moderate" : "Low"],
            ["Detection confidence", `${hover.h.confidence}%`],
            ["Historical percentile", `${Math.round(60 + hover.h.intensity * 39)}th`],
            ["Anomaly", severity(REGIONS.find((r) => r.name === hover.h.region)?.anomaly ?? 0)],
          ].map(([k, v]) => (
            <div key={k} className="mt-1 flex justify-between font-mono"><span className="text-muted-foreground">{k}</span><span>{v}</span></div>
          ))}
        </div>
      )}
    </section>
  );
}
