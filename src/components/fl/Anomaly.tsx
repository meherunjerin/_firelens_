import { Button } from "@/components/ui/button";
import { ArrowUpRight, Activity } from "lucide-react";
import { useState } from "react";
import { severity, type Region } from "@/lib/firedata";
import { CountUp, Reveal, SectionHead, Stat } from "./ui";
import { RegionPicker } from "./RegionPicker";
import { ExplainPanel } from "./ExplainPanel";

const LEVELS = ["Normal", "Elevated", "High", "Severe", "Extreme"];

export function Gauge({ score }: { score: number }) {
  const R = 130, C = Math.PI * R;
  return (
    <svg viewBox="0 0 300 180" className="w-full" role="img" aria-label={`Anomaly score ${score} out of 100`}>
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
    <section id="anomaly" className="anomaly-surface section-divider py-24"><div className="mx-auto max-w-[1440px] px-6 md:px-12">
      <SectionHead index="05" eyebrow="Anomaly detection" title={<>Is this fire activity<br /><span className="text-fire-gradient">normal?</span></>} />
      <RegionPicker value={region.id} onChange={setRegion} />
      <div className="mt-12 grid gap-12 lg:grid-cols-[.85fr_1.4fr]">
        <Reveal>
          <div className="relative border-y border-fire/30 py-8 text-center">
            <div className="eyebrow flex items-center justify-center gap-2"><Activity size={14} />Anomaly score · {region.name}</div>
            <div className="relative mx-auto mt-4 max-w-sm">
              <Gauge score={region.anomaly} />
              <div className="absolute inset-x-0 bottom-2">
                <div className="font-display text-8xl font-semibold"><CountUp key={region.id} to={region.anomaly} /><span className="text-2xl text-muted-foreground">/100</span></div>
                <div className={`font-mono text-sm font-bold uppercase tracking-[0.3em] ${region.anomaly >= 75 ? "text-lava" : region.anomaly >= 55 ? "text-fire" : "text-ok"}`}>{sev}</div>
              </div>
            </div>
            <div className="mt-6 flex justify-between gap-1 font-mono text-[8px] uppercase">
              {LEVELS.map((l) => <span key={l} className={l === sev ? "text-fire" : "text-muted-foreground"}>{l}</span>)}
            </div>
            <Button size="lg" onClick={() => setOpen(true)} className="mt-8 h-12 w-full rounded-sm text-xs">
              Explain this anomaly <ArrowUpRight />
            </Button>
          </div>
        </Reveal>
        <div>
          <div className="grid grid-cols-2 gap-6 xl:grid-cols-5">
            <Stat label="Current" value={region.current.toLocaleString()} tone="fire" />
            <Stat label="Hist. average" value={region.average.toLocaleString()} />
            <Stat label="Deviation" value={`${dev > 0 ? "+" : ""}${dev}%`} tone="fire" />
            <Stat label="Percentile" value={`${region.percentile}th`} />
            <Stat label="Confidence" value={`${region.confidence}%`} tone="sat" />
          </div>
          <div className="mt-10 border-y border-border py-6">
            <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>Peak-month detections · 2002 → 2025</span><span className="text-fire">■ 2026</span>
            </div>
            <div className="mt-5 flex items-baseline gap-3"><span className="font-display text-5xl font-semibold text-fire">{dev > 0 ? "+" : ""}{dev}%</span><span className="max-w-40 text-xs text-muted-foreground">vs. the historical peak-season average</span></div>
            <div className="relative mt-10 flex h-64 items-end gap-1">
              <div className="absolute inset-x-0 border-t border-dashed border-sat/60" style={{ bottom: `${(region.band[1] / max) * 100}%` }}>
                <span className="absolute -top-4 right-0 font-mono text-[10px] text-sat">normal ceiling</span>
              </div>
              {hist.map((h, i) => (
                <div key={`${region.id}-${i}`} className="flex-1 rounded-t-sm bg-sat-dim/50 hover:bg-sat/70 transition-all duration-700" style={{ height: `${(h / max) * 100}%`, transitionDelay: `${i * 20}ms` }} />
              ))}
              <div className="relative flex-[1.6] rounded-t-sm bg-fire-gradient glow-fire transition-all duration-1000" style={{ height: `${(region.current / max) * 100}%` }}><span className="absolute -top-6 left-1/2 -translate-x-1/2 font-mono text-[10px] text-fire">{region.current.toLocaleString()}</span></div>
            </div><div className="chart-caption mt-4"><span>2002</span><span>24-year historical record</span><span className="text-fire">2026</span></div>
          </div>
        </div>
      </div>
      </div><ExplainPanel open={open} onClose={() => setOpen(false)} region={region} />
    </section>
  );
}
