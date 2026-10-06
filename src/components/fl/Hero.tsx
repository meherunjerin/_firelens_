import earth from "@/assets/earth-hero.jpg";
import { Embers, CountUp } from "./ui";

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden">
      <img src={earth} alt="Earth at night with active fire clusters across South America and Africa" width={1920} height={1088}
        className="anim-drift absolute inset-0 h-full w-full object-cover object-right opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
      <div className="tech-grid absolute inset-0 opacity-60" />
      {/* orbits */}
      <div className="pointer-events-none absolute right-[8%] top-1/2 hidden aspect-square w-[62vw] max-w-[900px] -translate-y-1/2 md:block">
        {[0, 1].map((k) => (
          <div key={k} className="anim-orbit absolute inset-0 rounded-full border border-dashed border-sat/25"
            style={{ animationDuration: `${k ? 48 : 30}s`, transform: `rotate(${k * 40}deg)`, inset: `${k * 6}%` }}>
            <div className="absolute -top-1.5 left-1/2 flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-sat glow-sat" />
              <span className="font-mono text-[10px] tracking-widest text-sat">{k ? "SUOMI-NPP · VIIRS" : "TERRA · MODIS"}</span>
            </div>
          </div>
        ))}
      </div>
      <Embers />
      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 pt-24">
        <div className="eyebrow mb-6 flex items-center gap-3">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-fire" />
          Live · Harmonized MODIS + VIIRS · 2002 — 2026
        </div>
        <h1 className="max-w-4xl text-5xl font-black leading-[0.95] md:text-8xl">
          Is this fire<br /><span className="text-fire-gradient">normal?</span>
        </h1>
        <p className="mt-8 max-w-xl text-lg text-muted-foreground md:text-xl">
          We don’t just show you a fire map. We tell you whether what you’re seeing is normal — and if not,
          <span className="text-foreground"> why, and where to act first.</span>
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <a href="#map" className="rounded-sm bg-fire-gradient px-6 py-3.5 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground glow-fire">
            Explore the fire map →
          </a>
          <a href="#mission" className="glass rounded-sm px-6 py-3.5 font-mono text-xs uppercase tracking-[0.18em]">How it works</a>
        </div>
        <div className="mt-20 grid max-w-3xl grid-cols-2 gap-8 md:grid-cols-4">
          {[
            { v: 24, s: " yrs", l: "Harmonized record" },
            { v: 2, s: " sensors", l: "MODIS · VIIRS" },
            { v: 184, s: "%", l: "Amazonas vs normal", p: "+" },
            { v: 94, s: "/100", l: "Top priority score" },
          ].map((x) => (
            <div key={x.l} className="border-l border-fire/40 pl-4">
              <div className="font-display text-3xl font-bold"><CountUp to={x.v} suffix={x.s} prefix={x.p ?? ""} /></div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{x.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="anim-scan pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-transparent via-sat/5 to-transparent" />
    </section>
  );
}
