import { useEffect, useRef, useState, type ReactNode } from "react";

export function useInView<T extends Element>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [inView, set] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { set(true); io.disconnect(); } }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.15);
  return (
    <div ref={ref} className={`reveal ${inView ? "in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function CountUp({ to, duration = 1600, suffix = "", prefix = "", decimals = 0 }: { to: number; duration?: number; suffix?: string; prefix?: string; decimals?: number }) {
  const [ref, inView] = useInView<HTMLSpanElement>(0.3);
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const f0 = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      const val = f0 + (to - f0) * e;
      setV(val);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, inView, duration]);
  return <span ref={ref}>{prefix}{v.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}{suffix}</span>;
}

export function SectionHead({ index, eyebrow, title, sub }: { index: string; eyebrow: string; title: ReactNode; sub?: ReactNode }) {
  return (
    <Reveal className="mb-12 max-w-3xl">
      <div className="eyebrow mb-4 flex items-center gap-3">
        <span className="text-muted-foreground">{index}</span>
        <span className="h-px w-10 bg-sat/50" />
        {eyebrow}
      </div>
      <h2 className="text-4xl font-extrabold leading-[1.02] md:text-6xl">{title}</h2>
      {sub && <p className="mt-5 text-lg text-muted-foreground">{sub}</p>}
    </Reveal>
  );
}

export function Stat({ label, value, tone = "default" }: { label: string; value: ReactNode; tone?: "default" | "fire" | "sat" }) {
  const c = tone === "fire" ? "text-fire" : tone === "sat" ? "text-sat" : "text-foreground";
  return (
    <div className="border-l border-border pl-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-2xl font-bold ${c}`}>{value}</div>
    </div>
  );
}

export function Embers({ n = 28 }: { n?: number }) {
  // deterministic positions
  const items = Array.from({ length: n }, (_, i) => ({
    left: (i * 37.3) % 100, delay: (i * 0.71) % 9, dur: 9 + ((i * 3.3) % 9), size: 2 + (i % 3),
  }));
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((e, i) => (
        <span key={i} className="anim-ember absolute bottom-0 rounded-full bg-ember" style={{
          left: `${e.left}%`, width: e.size, height: e.size, animationDelay: `${e.delay}s`, animationDuration: `${e.dur}s`,
          boxShadow: "var(--glow-fire)",
        }} />
      ))}
    </div>
  );
}
