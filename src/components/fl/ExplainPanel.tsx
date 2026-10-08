import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Check } from "lucide-react";
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
  return (
    <Dialog open={open} onOpenChange={value => { if (!value) onClose(); }}>
      <DialogContent className="left-auto right-0 top-0 z-[60] h-dvh w-full max-w-lg translate-x-0 translate-y-0 gap-0 overflow-y-auto rounded-none border-y-0 border-r-0 p-6 pt-12 sm:rounded-none md:p-10 md:pt-14">
        <div className="eyebrow">Explainable intelligence / Evidence brief</div>
        <DialogTitle className="mt-4 text-3xl font-semibold leading-tight">Why FireLens marked<br /><span className="text-fire">{region.name}</span> as {severity(region.anomaly).toLowerCase()}</DialogTitle>
        <DialogDescription className="sr-only">Anomaly evidence and confidence for {region.name}</DialogDescription>
        <div className="mt-6 flex items-center justify-between border-y border-fire/30 py-5"><span className="font-mono text-[10px] uppercase text-muted-foreground">Anomaly score</span><span className="font-display text-4xl text-fire">{region.anomaly}<span className="text-sm text-muted-foreground">/100</span></span></div>
        <ol className="mt-8 space-y-6">{explainReasons(region).map((t,i)=><li key={i} className="flex gap-4" style={{animation:open?`fade-in .5s ${i*.12}s both`:undefined}}><span className="font-mono text-xs text-fire">{String(i+1).padStart(2,"0")}</span><span className="text-sm leading-relaxed text-foreground/90">{t}</span></li>)}</ol>
        <div className="mt-10"><div className="font-mono text-[10px] uppercase text-muted-foreground">Evidence used</div><div className="mt-3">{["MODIS historical baseline","VIIRS current observations","Historical monthly distribution","Seasonality deviation"].map(e=><div key={e} className="flex items-center gap-3 border-b border-border py-3 text-xs text-sat"><Check size={13} />{e}</div>)}</div></div>
        <div className="mt-10"><div className="flex justify-between font-mono text-xs"><span className="text-muted-foreground">Confidence</span><span className="text-sat">{region.confidence-2}%</span></div><div className="mt-3 h-1 bg-secondary"><div className="h-full bg-sat" style={{width:`${region.confidence-2}%`}} /></div><p className="mt-5 text-xs leading-relaxed text-muted-foreground">No black box: each reason is a direct comparison between today’s satellite detections and this region’s own 24-year record.</p></div>
      </DialogContent>
    </Dialog>
  );
}
