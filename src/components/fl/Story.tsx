import { useEffect, useState } from "react";
import { Reveal, SectionHead, useInView } from "./ui";
import { rng } from "@/lib/firedata";

const steps = [
  ["01", "MODIS", "Since 2000 · 1 km pixels", "sat"],
  ["02", "VIIRS", "Since 2012 · 375 m pixels", "sat"],
  ["03", "Harmonization", "One consistent record", "sat"],
  ["04", "FireDNA Baseline", "What normal looks like", "fire"],
  ["05", "Anomaly Detection", "Is today unusual?", "fire"],
  ["06", "Explainable Intelligence", "Why it’s unusual", "fire"],
  ["07", "Responder Priority", "Where to act first", "fire"],
] as const;

export function Story() {
  return (
    <section id="mission" className="relative mx-auto max-w-[1400px] px-6 py-32">
      <SectionHead index="01" eyebrow="The core story" title={<>From satellites<br />to <span className="text-fire-gradient">decisions.</span></>}
        sub="Two NASA instruments watch Earth burn every day. FireLens turns their raw detections into a judgement a responder can act on." />
      <div className="grid gap-16 lg:grid-cols-[1fr_1.2fr]">
        <ol className="relative space-y-1">
          <span className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-sat via-fire to-lava" />
          {steps.map(([n, t, d, tone], i) => (
            <Reveal key={n} delay={i * 90}>
              <li className="group relative flex items-center gap-6 rounded-sm py-3 pl-0 pr-4 transition-colors hover:bg-card">
                <span className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border bg-background font-mono text-xs ${tone === "fire" ? "border-fire text-fire" : "border-sat text-sat"}`}>{n}</span>
                <div>
                  <div className="font-display text-xl font-bold">{t}</div>
                  <div className="font-mono text-xs text-muted-foreground">{d}</div>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
        <Merge />
      </div>
    </section>
  );
}

function Merge() {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const [merged, setMerged] = useState(false);
  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => setMerged((m) => !m), 3200);
    const t = setTimeout(() => setMerged(true), 600);
    return () => { clearInterval(id); clearTimeout(t); };
  }, [inView]);
  const r = rng(7);
  const pts = Array.from({ length: 60 }, (_, i) => ({ x: 20 + r() * 60, y: 15 + r() * 70, m: i % 2 === 0 }));
  return (
    <div ref={ref} className="corner-frame glass relative aspect-[4/3] overflow-hidden rounded-sm">
      <div className="tech-grid absolute inset-0" />
      <div className="absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.2em] text-sat">Sensor fusion · live demo</div>
      <div className="absolute right-4 top-4 font-mono text-[10px] uppercase tracking-[0.2em]">
        <span className={merged ? "text-fire" : "text-muted-foreground"}>{merged ? "● Unified record" : "○ Two streams"}</span>
      </div>
      {pts.map((p, i) => {
        const off = merged ? 0 : p.m ? -22 : 22;
        return (
          <span key={i} className={`absolute rounded-full transition-all duration-[1400ms] ease-[cubic-bezier(.2,.7,.2,1)] ${merged ? "bg-fire glow-fire" : p.m ? "bg-sat/70" : "bg-ember"}`}
            style={{ left: `${p.x + off * (merged ? 0 : 1) * 0.6}%`, top: `${p.y}%`,
              width: merged ? 7 : p.m ? 14 : 5, height: merged ? 7 : p.m ? 14 : 5, opacity: p.m && !merged ? 0.55 : 1,
              transitionDelay: `${(i % 12) * 30}ms` }} />
        );
      })}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
        <div className="font-mono text-[10px] uppercase tracking-widest text-sat/80">MODIS · 1 km</div>
        <p className="max-w-xs text-center font-display text-lg font-bold">Two sensors. Different resolutions. <span className="text-fire">One consistent fire history.</span></p>
        <div className="font-mono text-[10px] uppercase tracking-widest text-ember">VIIRS · 375 m</div>
      </div>
    </div>
  );
}
