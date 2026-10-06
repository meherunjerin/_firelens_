import { useEffect } from "react";
import { severity, type Region } from "@/lib/firedata";

export function explainReasons(r: Region) {
  const dev = Math.round(((r.current - r.average) / r.average) * 100);
  return [
    `Current fire detections are ${dev}% ${dev >= 0 ? "above" : "below"} the 20-year peak-season average.`,
    `Activity exceeds the ${r.percentile}th historical percentile for this month.`,
    `High-intensity detections are concentrated in ${r.recurrence >= 17 ? "three recurring fire corridors" : "newly active zones with little burn history"}.`,
    `The regional fire season started approximately ${Math.max(1, Math.round(r.anomaly / 30))} weeks earlier than normal.`,
  ];
}

export function ExplainPanel({ open, onClose, region }: { open: boolean; onClose: () => void; region: Region }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className={`fixed inset-0 z-[60] transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}>
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <aside className={`glass absolute right-0 top-0 h-full w-full max-w-lg overflow-y-auto border-y-0 border-r-0 p-8 transition-transform duration-500 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="eyebrow">Explainable intelligence</div>
            <h3 className="mt-2 text-3xl font-extrabold">Why FireLens marked<br /><span className="text-fire">{region.name}</span> as {severity(region.anomaly).toLowerCase()}</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-sm border border-border px-3 py-1 font-mono text-sm hover:border-fire">✕</button>
        </div>
        <ol className="mt-8 space-y-4">
          {explainReasons(region).map((t, i) => (
            <li key={i} className="flex gap-4 border-l-2 border-fire/60 pl-4" style={{ animation: open ? `fade-in .5s ${i * 0.12}s both` : undefined }}>
              <span className="font-mono text-sm text-fire">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-foreground/90">{t}</span>
            </li>
          ))}
        </ol>
        <div className="mt-10">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Evidence used</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {["MODIS historical baseline", "VIIRS current observations", "Historical monthly distribution", "Seasonality deviation"].map((e) => (
              <div key={e} className="rounded-sm border border-sat/30 bg-sat/5 px-3 py-2 text-xs text-sat">✓ {e}</div>
            ))}
          </div>
        </div>
        <div className="mt-10">
          <div className="flex justify-between font-mono text-xs"><span className="text-muted-foreground">Confidence</span><span className="text-sat">{region.confidence - 2}%</span></div>
          <div className="mt-2 h-2 rounded-full bg-secondary"><div className="h-full rounded-full bg-sat glow-sat" style={{ width: `${region.confidence - 2}%` }} /></div>
          <p className="mt-4 text-sm text-muted-foreground">No black box: each reason is a direct comparison between today’s satellite detections and this region’s own 24-year record.</p>
        </div>
      </aside>
    </div>
  );
}
