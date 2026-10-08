import { MONTHS, type Region } from "@/lib/firedata";
import { Reveal, SectionHead, Stat, CountUp } from "./ui";
import { RegionPicker } from "./RegionPicker";

export function DNAWheel({ region, size = 420 }: { region: Region; size?: number }) {
  const c = size / 2, inner = size * 0.16, outer = size * 0.40;
  const max = Math.max(...region.monthly, ...region.currentMonthly) * 1.05;
  const pt = (i: number, v: number) => {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const rr = inner + (v / max) * (outer - inner);
    return [c + Math.cos(a) * rr, c + Math.sin(a) * rr];
  };
  const path = (vals: number[], close = true) => vals.map((v, i) => `${i ? "L" : "M"}${pt(i, v).join(",")}`).join(" ") + (close ? "Z" : "");
  const hi = region.monthly.map((v) => v * 1.25), lo = region.monthly.map((v) => v * 0.7);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="dna-wheel w-full" role="img" aria-label={`Seasonal fire fingerprint for ${region.name}: historical mean and 2026 activity`}>
      <defs>
        <radialGradient id="dnaG"><stop offset="0%" stopColor="var(--lava)" stopOpacity="0.5" /><stop offset="100%" stopColor="var(--fire)" stopOpacity="0" /></radialGradient>
      </defs>
      <circle className="dna-orbit" cx={c} cy={c} r={size*.48} fill="none" stroke="var(--sat)" strokeOpacity={.35} strokeDasharray="2 7" />
      {Array.from({length:72},(_,i)=>{const a=i/72*Math.PI*2;return <line key={i} x1={c+Math.cos(a)*size*.445} y1={c+Math.sin(a)*size*.445} x2={c+Math.cos(a)*size*(i%6===0?.465:.452)} y2={c+Math.sin(a)*size*(i%6===0?.465:.452)} stroke="var(--sat)" strokeOpacity={i%6===0?.7:.25} />;})}
      {[0.25, 0.5, 0.75, 1].map((k) => <circle key={k} cx={c} cy={c} r={inner + k * (outer - inner)} fill="none" stroke="var(--grid)" strokeWidth={1.5} />)}
      {MONTHS.map((m, i) => {
        const [x, y] = pt(i, max * 1.12);
        const [x0, y0] = pt(i, 0);
        return <g key={m}><line x1={x0} y1={y0} x2={pt(i, max)[0]} y2={pt(i, max)[1]} stroke="var(--grid)" />
          <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="var(--muted-foreground)" fontFamily="JetBrains Mono">{m}</text></g>;
      })}
      <path d={path(hi)} fill="var(--sat)" fillOpacity={0.1} stroke="var(--sat)" strokeOpacity={0.4} strokeDasharray="3 3" />
      <path d={path(lo)} fill="var(--background)" stroke="var(--sat)" strokeOpacity={0.4} strokeDasharray="3 3" />
      <path d={path(region.monthly)} fill="none" stroke="var(--sat)" strokeWidth={1.5} />
      <path key={region.id} d={path(region.currentMonthly, false)} fill="url(#dnaG)" stroke="var(--fire)" strokeWidth={2.5}
        style={{ filter: "drop-shadow(0 0 6px var(--fire))", strokeDasharray: 3000, strokeDashoffset: 3000, animation: "dash 2.2s ease forwards" }} />
      {region.currentMonthly.map((v,i)=>{const [x,y]=pt(i,v);return <circle key={i} cx={x} cy={y} r={3} fill="var(--fire)" stroke="var(--background)" strokeWidth={1.5} />;})}
      <circle cx={c} cy={c} r={inner - 6} fill="var(--card)" stroke="var(--border)" />
      <text x={c} y={c - 6} textAnchor="middle" fontSize={11} fill="var(--muted-foreground)" fontFamily="JetBrains Mono">FireDNA</text>
      <text x={c} y={c + 14} textAnchor="middle" fontSize={16} fontWeight={800} fill="var(--foreground)" fontFamily="Space Grotesk">{region.peak}</text>
    </svg>
  );
}

export function FireDNA({ region, setRegion }: { region: Region; setRegion: (id: string) => void }) {
  const dev = Math.round(((region.current - region.average) / region.average) * 100);
  return (
    <section id="firedna" className="section-divider relative overflow-hidden py-24">

      <div className="relative mx-auto max-w-[1440px] px-6 md:px-12">
        <SectionHead index="04" eyebrow="FireDNA™ · Normal fire behavior" title={<>Every region has a<br /><span className="text-fire-gradient">fire fingerprint.</span></>}
          sub="FireDNA learns what ‘normal’ looks like before deciding what is abnormal." />
        <RegionPicker value={region.id} onChange={setRegion} />
        <div className="mt-12 grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          <Reveal><div className="mx-auto max-w-[580px]"><DNAWheel region={region} /><div className="chart-caption"><span>Seasonal signature / 12 months</span><span className="text-sat">Historical baseline × Current activity</span></div></div></Reveal>
          <div>
            <div className="eyebrow">Region</div>
            <div className="mt-1 font-display text-4xl font-extrabold">{region.name}</div>
            <div className="font-mono text-sm text-muted-foreground">{region.country}</div>
            <div className="mt-10 grid grid-cols-2 gap-8">
              <Stat label="Typical peak" value={region.peak} />
              <Stat label="Normal band / mo" value={`${region.band[0]}–${region.band[1]}`} tone="sat" />
              <Stat label="Current activity" value={<CountUp key={region.id} to={region.current} />} tone="fire" />
              <Stat label="Deviation" value={`${dev > 0 ? "+" : ""}${dev}%`} tone="fire" />
              <Stat label="Historical range" value="2002–2025" />
              <Stat label="Confidence" value={`${region.confidence}%`} tone="sat" />
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 font-mono text-[11px] text-muted-foreground">
              <span className="flex items-center gap-2"><span className="h-0.5 w-6 bg-sat" />20-yr mean</span>
              <span className="flex items-center gap-2"><span className="h-2 w-6 border border-dashed border-sat/50 bg-sat/10" />normal band</span>
              <span className="flex items-center gap-2"><span className="h-0.5 w-6 bg-fire" />2026</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
