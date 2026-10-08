import { useState } from "react";
import observation from "@/assets/amazon-observation.jpg";
import { rng } from "@/lib/firedata";
import { Reveal, SectionHead } from "./ui";

export function Harmonization() {
  const [split, setSplit] = useState(50);
  const r = rng(42);
  const fires = Array.from({ length: 40 }, () => ({ x: 10 + r() * 80, y: 10 + r() * 80 }));
  return (
    <section className="section-divider mx-auto max-w-[1440px] px-6 py-24 md:px-12">
      <SectionHead index="03" eyebrow="Sensor harmonization" title={<>Different eyes.<br /><span className="text-fire-gradient">One fire history.</span></>} />
      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <Reveal>
          <div className="observation-surface relative aspect-[16/10] select-none overflow-hidden border-y border-border bg-card">
            <img src={observation} alt="Illustrative Amazon observation used for sensor resolution comparison" width={1536} height={1024} loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-45" />
            {/* MODIS: coarse cells */}
            <div className="tech-grid absolute inset-0" />
            <div className="absolute inset-0">
              {fires.map((f, i) => (
                <span key={i} className="absolute bg-sat/30 outline outline-1 outline-sat/60"
                  style={{ left: `${Math.floor(f.x / 6) * 6}%`, top: `${Math.floor(f.y / 9.6) * 9.6}%`, width: "6%", height: "9.6%" }} />
              ))}
            </div>
            {/* VIIRS harmonized overlay clipped */}
            <div className="absolute inset-0 bg-card" style={{ clipPath: `inset(0 0 0 ${split}%)` }}>
              <img src={observation} alt="" width={1536} height={1024} loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-65" /><div className="tech-grid absolute inset-0" />
              {fires.map((f, i) => (
                <span key={i} className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fire glow-fire" style={{ left: `${f.x}%`, top: `${f.y}%` }} />
              ))}
            </div>
            <div className="absolute inset-y-0 w-px bg-ember" style={{ left: `${split}%` }}>
              <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-ember px-2 py-1 font-mono text-[10px] font-bold text-primary-foreground">⟷</span>
            </div>
            <input type="range" min={0} max={100} value={split} onChange={(e) => setSplit(+e.target.value)} aria-label="Compare MODIS and harmonized"
              className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
            <span className="absolute left-3 top-3 glass rounded-sm px-2 py-1 font-mono text-[8px] uppercase tracking-widest text-sat">MODIS · 1 km cells</span>
            <span className="absolute right-3 top-3 glass rounded-sm px-2 py-1 font-mono text-[8px] uppercase tracking-widest text-fire">Harmonized · 375 m</span>
          </div>
        </Reveal>
        <div className="space-y-8">
          {[
            ["MODIS", "Long-term continuity", "Terra & Aqua have observed fire since 2000. Coarser pixels, but the backbone of any 20-year baseline.", "text-sat"],
            ["VIIRS", "Finer spatial detail", "Suomi-NPP & NOAA-20 resolve smaller, cooler fires at 375 m — catching what MODIS misses.", "text-ember"],
            ["FireLens", "One analytical baseline", "We normalize detection rates across sensors so 2005 and 2026 can be compared fairly.", "text-fire"],
          ].map(([k, t, d, c], i) => (
            <Reveal key={k} delay={i * 120}>
              <div className={`font-mono text-xs uppercase tracking-[0.2em] ${c}`}>{k}</div>
              <div className="mt-1 font-display text-2xl font-bold">{t}</div>
              <p className="mt-2 text-muted-foreground">{d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
