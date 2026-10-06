import { useState } from "react";
import { severity, type Region } from "@/lib/firedata";
import { CountUp, Reveal, SectionHead, Stat } from "./ui";
import { RegionPicker } from "./RegionPicker";
import { ExplainPanel } from "./ExplainPanel";

const LEVELS = ["Normal", "Elevated", "High", "Severe", "Extreme"];

export function Gauge({ score }: { score: number }) {
  const R = 130, C = Math.PI * R;
  return (
    <svg viewBox="0 0 300 180" className="w-full">
      <defs>
        <linearGradient id="gG" x1="0" x2="1"><stop offset="0" stopColor="var(--ok)" /><stop offset="0.45" stopColor="var(--amber)" /><stop offset="0.75" stopColor="var(--fire)" /><stop offset="1" stopColor="var(--lava)" /></linearGradient>
      </defs>
      <path d="M20 160 A130 130 0 0 1 280 160" fill="none" stroke="var(--secondary)" strokeWidth={18} strokeLinecap="round" />
      <path d="M20 160 A130 130 0 0 1 280 160" fill="none" stroke="url(#gG)" strokeWidth={18} strokeLinecap="round"
        strokeDasharray={C} strokeDashoffset={C * (1 - score / 100)} style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(.2,.7,.2,1)", filter: "drop-shadow(0 0 8px var(--fire))" }} />
    </svg>
  );
}

export function Anomaly({ region, setRegion }: { region: Region; setRegion: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const dev = Math.round(((region.current - region.average) / region.average) * 100);
  const sev = severity(region.anomaly);
  // 20-year distribution of the peak month (deterministic)
  const hist = Array.from({ length: 24 }, (_, i) => region.average * (0.7 + 0.6 * Math.abs(Math.sin(i * 1.7 + region.anomaly))));
  const max = Math.max(...hist, region.current);
  return (
    <section id="anomaly" className="mx-auto max-w-[1400px] px-6 py-28">
      <SectionHead index="05" eyebrow="Anomaly detection" title={<>Is this fire activity<br /><span className="text-fire-gradient">normal?</span></>} />
      <RegionPicker value={region.id} onChange={setRegion} />
      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.3fr]">
        <Reveal>
          <div className="corner-frame glass relative rounded-sm p-8 text-center">
            <div className="eyebrow">Anomaly score · {region.name}</div>
            <div className="relative mx-auto mt-4 max-w-sm">
              <Gauge score={region.anomaly} />
              <div className="absolute inset-x-0 bottom-2">
                <div className="font-display text-7xl font-black"><CountUp key={region.id} to={region.anomaly} /><span className="text-2xl text-muted-foreground">/100</span></div>
                <div className={`font-mono text-sm font-bold uppercase tracking-[0.3em] ${region.anomaly >= 75 ? "text-lava" : region.anomaly >= 55 ? "text-fire" : "text-ok"}`}>{sev}</div>
              </div>
            </div>
            <div className="mt-6 flex justify-between font-mono text-[10px] uppercase tracking-widest">
              {LEVELS.map((l) => <span key={l} className={l === sev ? "text-fire" : "text-muted-foreground"}>{l}</span>)}
            </div>
            <button onClick={() => setOpen(true)} className="mt-8 w-full rounded-sm bg-fire-gradient py-3.5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground glow-fire">
              Explain this anomaly →
            </button>
          </div>
        </Reveal>
        <div>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
            <Stat label="Current" value={region.current.toLocaleString()} tone="fire" />
            <Stat label="Hist. average" value={region.average.toLocaleString()} />
            <Stat label="Deviation" value={`${dev > 0 ? "+" : ""}${dev}%`} tone="fire" />
            <Stat label="Percentile" value={`${region.percentile}th`} />
            <Stat label="Confidence" value={`${region.confidence}%`} tone="sat" />
          </div>
          <div className="glass mt-8 rounded-sm p-6">
            <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>Peak-month detections · 2002 → 2025</span><span className="text-fire">■ 2026</span>
            </div>
            <div className="relative mt-6 flex h-56 items-end gap-1">
              <div className="absolute inset-x-0 border-t border-dashed border-sat/60" style={{ bottom: `${(region.band[1] / max) * 100}%` }}>
                <span className="absolute -top-4 right-0 font-mono text-[10px] text-sat">normal ceiling</span>
              </div>
              {hist.map((h, i) => (
                <div key={`${region.id}-${i}`} className="flex-1 rounded-t-sm bg-sat-dim/40 transition-all duration-700" style={{ height: `${(h / max) * 100}%`, transitionDelay: `${i * 20}ms` }} />
              ))}
              <div className="flex-[1.6] rounded-t-sm bg-fire-gradient glow-fire transition-all duration-1000" style={{ height: `${(region.current / max) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
      <ExplainPanel open={open} onClose={() => setOpen(false)} region={region} />
    </section>
  );
}
