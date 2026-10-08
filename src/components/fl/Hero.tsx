import earth from "@/assets/earth-finals.jpg";
import { ArrowDown, ArrowUpRight, Satellite, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountUp } from "./ui";

export function Hero() {
  return (
    <section className="earth-opening relative isolate overflow-hidden">
      <img src={earth} alt="Orbital view of Earth with fire clusters across the Amazon basin" width={1920} height={1080} fetchPriority="high" className="earth-image absolute inset-0 h-full w-full object-cover" />
      <div className="earth-shade absolute inset-0" />
      <div className="orbital-track pointer-events-none absolute"><span className="satellite-flight"><Satellite size={26} /><span>TERRA · MODIS</span></span></div>
      <div className="hero-target pointer-events-none absolute hidden md:block"><span className="hotspot-ring" /><Crosshair size={32} /><div className="mt-3 font-mono text-[10px] text-sat">03.50° S / 63.00° W</div><div className="mt-1 font-mono text-[10px] text-foreground">AMAZONAS · +184% VS NORMAL</div></div>
      <div className="relative mx-auto w-full max-w-[1440px] px-6 pt-32 md:px-12 md:pt-40">
        <div className="mb-8 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-sat"><span className="h-1.5 w-1.5 rounded-full bg-sat animate-pulse" />Earth observation / Decision intelligence</div>
        <div className="mb-4 font-display text-sm font-semibold text-foreground/70">FireLens <span className="mx-2 text-muted-foreground">/</span> NASA Space Apps 2026</div>
        <h1 className="hero-question font-display font-bold">Is this fire<br /><span className="text-fire">normal?</span></h1>
        <p className="mt-7 max-w-[430px] text-base leading-relaxed text-foreground/70">We don’t just show you a fire map. We tell you whether what you’re seeing is normal — and if not, <span className="text-foreground">why, and where to act first.</span></p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Button asChild size="lg" className="h-12 rounded-sm px-6 text-xs"><a href="#map">Explore the fire map <ArrowUpRight /></a></Button>
          <Button asChild variant="ghost" size="lg" className="h-12 rounded-sm text-xs text-foreground"><a href="#mission">How it works <ArrowDown /></a></Button>
        </div>
        <div className="hero-metrics mt-14 grid max-w-[650px] grid-cols-2 gap-6 border-t border-foreground/15 pt-6 md:mt-16 md:grid-cols-4">
          {[{v:24,s:" yrs",l:"Harmonized record"},{v:2,s:" sensors",l:"MODIS · VIIRS"},{v:184,s:"%",l:"Amazonas vs normal",p:"+"},{v:94,s:"/100",l:"Top priority score"}].map(x => <div key={x.l}><div className="font-display text-2xl font-semibold"><CountUp to={x.v} suffix={x.s} prefix={x.p ?? ""} /></div><div className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{x.l}</div></div>)}
        </div>
      </div>
      <div className="relative mx-auto mt-10 flex w-full max-w-[1440px] items-center justify-between gap-4 px-6 pb-7 font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground md:px-12"><a href="#mission" className="flex items-center gap-3 hover:text-sat"><ArrowDown size={14} />From orbit to action</a><span>MODIS + VIIRS / 2002 — 2026 / Demo values</span></div>
    </section>
  );
}
