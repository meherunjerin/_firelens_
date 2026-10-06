import { useMemo, useState } from "react";
import worldMap from "@/assets/world-map.jpg";
import { REGIONS, MONTHS, hotspotsForYear, project, severity, type Hotspot } from "@/lib/firedata";
import { SectionHead } from "./ui";

const LAYERS = ["Harmonized", "MODIS Only", "VIIRS Only", "Historical Density", "Current Activity", "Recurring Zones", "Emerging Zones", "Responder Priority"] as const;
type Layer = (typeof LAYERS)[number];

export function WorldCanvas({ hotspots, scale = 1, layer = "Harmonized", onHover, className = "", dim = false, showPriority = false }: {
  hotspots: Hotspot[]; scale?: number; layer?: Layer; onHover?: (h: Hotspot | null, e?: React.MouseEvent) => void; className?: string; dim?: boolean; showPriority?: boolean;
}) {
  return (
    <div className={`absolute inset-0 ${className}`}>
      <img src={worldMap} alt="" width={1920} height={960} loading="lazy" className={`absolute inset-0 h-full w-full object-cover ${dim ? "opacity-40" : "opacity-70"}`} />
      <div className="tech-grid absolute inset-0" />
      {layer === "Historical Density" && REGIONS.map((r) => {
        const p = project(r.lat, r.lon);
        return <span key={r.id} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-fire/25 blur-xl"
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
            className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-crosshair rounded-full ${tone}`}
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: sz, height: sz, opacity: 0.55 + h.intensity * 0.45,
              boxShadow: h.intensity > 0.7 ? "var(--glow-fire)" : undefined }} />
        );
      })}
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
  const [hover, setHover] = useState<{ h: Hotspot; x: number; y: number } | null>(null);

  const all = useMemo(() => hotspotsForYear(year), [year]);
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
    <section id="map" className="relative py-28">
      <div className="mx-auto max-w-[1400px] px-6">
        <SectionHead index="02" eyebrow="Global fire intelligence" title={<>Every hotspot,<br />in <span className="text-fire-gradient">historical context.</span></>} />
      </div>
      <div className="relative mx-auto max-w-[1600px] px-2 md:px-6">
        <div className="corner-frame relative aspect-[2/1] min-h-[420px] overflow-hidden rounded-sm border border-border bg-background">
          <div className="absolute inset-0 origin-top-left transition-transform duration-[1600ms] ease-[cubic-bezier(.65,0,.35,1)]"
            style={{ transform: `translate(${tx}%, ${ty}%) scale(${scale})` }}>
            <WorldCanvas hotspots={hotspots} scale={scale} layer={layer} showPriority={layer === "Responder Priority"}
              onHover={(h, e) => setHover(h && e ? { h, x: e.clientX, y: e.clientY } : null)} />
          </div>

          {/* Controls */}
          <div className="glass absolute left-3 top-3 w-64 rounded-sm p-3">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search region or country…"
              className="w-full rounded-sm border border-input bg-background/60 px-3 py-2 font-mono text-xs outline-none focus:border-fire" />
            {matches.length > 0 && (
              <div className="mt-2 space-y-1">
                {matches.slice(0, 5).map((m) => (
                  <button key={m.id} onClick={() => { setFocus(m.id); setQ(""); }} className="block w-full rounded-sm px-2 py-1 text-left text-xs hover:bg-secondary">
                    {m.name} <span className="text-muted-foreground">· {m.country}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <select value={month} onChange={(e) => setMonth(+e.target.value)} className="rounded-sm border border-input bg-background/60 px-2 py-1.5 font-mono text-xs">
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <button onClick={() => setFocus(null)} className="rounded-sm border border-input px-2 py-1.5 font-mono text-xs hover:border-sat hover:text-sat">Global ⤢</button>
            </div>
          </div>
          <div className="glass absolute right-3 top-3 hidden w-52 rounded-sm p-2 md:block">
            <div className="px-2 pb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Layers</div>
            {LAYERS.map((l) => (
              <button key={l} onClick={() => setLayer(l)} className={`flex w-full items-center gap-2 rounded-sm px-2 py-1 text-left text-xs transition-colors ${layer === l ? "bg-fire/15 text-fire" : "hover:bg-secondary"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${layer === l ? "bg-fire" : "bg-muted-foreground/40"}`} />{l}
              </button>
            ))}
          </div>
          {region && (
            <div className="glass absolute bottom-20 left-3 rounded-sm p-4">
              <div className="eyebrow">Focused region</div>
              <div className="mt-1 font-display text-xl font-bold">{region.name}</div>
              <div className="font-mono text-xs text-muted-foreground">{region.country} · anomaly {region.anomaly}/100 · <span className="text-fire">{severity(region.anomaly)}</span></div>
            </div>
          )}
          {/* Timeline */}
          <div className="glass absolute inset-x-3 bottom-3 rounded-sm px-4 py-3">
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] text-muted-foreground">2002</span>
              <input type="range" min={2002} max={2026} value={year} onChange={(e) => setYear(+e.target.value)} className="fl-range flex-1" />
              <span className="font-mono text-[10px] text-muted-foreground">2026</span>
              <span className="min-w-[110px] text-right font-display text-lg font-bold text-fire">{MONTHS[month]} {year}</span>
            </div>
            <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>{hotspots.length.toLocaleString()} detections shown</span>
              <span>{year < 2012 ? "MODIS era" : "MODIS + VIIRS harmonized"}</span>
            </div>
          </div>
        </div>
      </div>
      {hover && (
        <div className="glass pointer-events-none fixed z-50 w-56 rounded-sm p-3 text-xs" style={{ left: hover.x + 14, top: hover.y + 14 }}>
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
