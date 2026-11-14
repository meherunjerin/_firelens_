import { useMemo, useState, type ReactNode } from "react";
import { DIVISIONS, OUTLINE } from "@/lib/bdgeo";
import { viridis } from "@/lib/bddata";
import { useT } from "@/lib/bdi18n";

export type MapCell = { id: string; lat: number; lon: number; value: number; division: string | null; note?: string | undefined };
const LON0 = 88, LON1 = 92.8, LAT0 = 20.5, LAT1 = 26.75, W = 560, K = Math.cos((23.5 * Math.PI) / 180);
const H = Math.round(((LAT1 - LAT0) / ((LON1 - LON0) * K)) * W);
const X = (lon: number) => ((lon - LON0) / (LON1 - LON0)) * W, Y = (lat: number) => ((LAT1 - lat) / (LAT1 - LAT0)) * H;
const path = (rings: number[][]) => rings.map((r) => r.reduce((d, v, i) => d + (i % 2 ? `${Y(v).toFixed(1)}` : `${i ? "L" : "M"}${X(v).toFixed(1)},`), "") + "Z").join("");

/** Fire map of Bangladesh: country outline, 8 divisions and 0.25° cells coloured by `value`. */
export function BDMap({ cells, max, unit, division, cellId, onDivision, onCell, colorOf, legend, overlay }: {
  cells: MapCell[]; max: number; unit: string; division: string | null; cellId: string | null; colorOf?: ((c: MapCell) => string) | undefined; legend?: ReactNode | undefined; overlay?: { id: string; lat: number; lon: number; n: number }[] | undefined;
  onDivision: (name: string | null) => void; onCell: (id: string) => void;
}) {
  const { t, dn } = useT();
  const [hover, setHover] = useState<MapCell | null>(null);
  const outline = useMemo(() => path(OUTLINE), []);
  const divs = useMemo(() => DIVISIONS.map((d) => ({ ...d, d: path(d.rings) })), []);
  const w = X(LON0 + 0.25) - X(LON0), h = Y(LAT1 - 0.25) - Y(LAT1);
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-sm bg-background/60" role="img" aria-label="Map of Bangladesh with fire detections per grid cell, divisions outlined">
        <defs><clipPath id="bd-clip"><path d={outline} /></clipPath></defs>
        <path d={outline} className="fill-secondary/60" />
        <g clipPath="url(#bd-clip)">
          {cells.map((c) => (
            <rect key={c.id} x={X(c.lon)} y={Y(c.lat + 0.25)} width={w} height={h} fill={colorOf ? colorOf(c) : viridis(Math.log1p(c.value) / Math.log1p(Math.max(1, max)))}
              opacity={colorOf || c.value > 0 ? 0.95 : 0.15} stroke={cellId === c.id ? "var(--fire)" : "none"} strokeWidth={2} className="cursor-pointer"
              onMouseEnter={() => setHover(c)} onMouseLeave={() => setHover(null)} onClick={() => onCell(c.id)} />
          ))}
        </g>
        {overlay?.map((o) => { const cx = X(o.lon + 0.125), cy = Y(o.lat + 0.125);
          return <polygon key={`s${o.id}`} points={`${cx},${cy - 7} ${cx + 7},${cy} ${cx},${cy + 7} ${cx - 7},${cy}`} fill="#ef4444" stroke="white" strokeWidth={1.5}><title>{`${o.n} static-source detections (excluded)`}</title></polygon>; })}
        <g className="pointer-events-none" fill="none">
          {divs.map((d) => <path key={d.name} d={d.d} stroke={division === d.name ? "var(--fire)" : "var(--foreground)"} strokeOpacity={division === d.name ? 1 : 0.35} strokeWidth={division === d.name ? 2.2 : 0.8} />)}
          <path d={outline} stroke="var(--foreground)" strokeOpacity={0.7} strokeWidth={1.2} />
        </g>
        {divs.map((d) => (
          <text key={`l${d.name}`} x={X(d.label[0])} y={Y(d.label[1])} textAnchor="middle" fontSize={10} fontFamily="JetBrains Mono, ui-monospace, monospace" role="button" tabIndex={0}
            aria-label={dn(d.name)} onClick={() => onDivision(division === d.name ? null : d.name)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onDivision(division === d.name ? null : d.name); }}
            className="cursor-pointer select-none" fill="white" stroke="black" strokeWidth={2.5} paintOrder="stroke" opacity={division && division !== d.name ? 0.5 : 1}>{dn(d.name)}</text>
        ))}
      </svg>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] text-muted-foreground">
        {legend ?? <span className="flex items-center gap-2">{t("mapFew")}<span className="h-2 w-28 rounded-sm" style={{ background: `linear-gradient(90deg, ${[0, .25, .5, .75, 1].map(viridis).join(",")})` }} />{t("mapMany")} · {unit}</span>}
        <span>{t("mapHint")} Boundaries: geoBoundaries, CC BY 4.0.</span>
      </div>
      {hover && <div className="glass pointer-events-none absolute right-2 top-2 rounded-sm p-3 font-mono text-[11px]">
        <div className="text-fire">{hover.note ?? t("mapDet", Math.round(hover.value).toLocaleString())}</div>
        <div className="text-muted-foreground">{hover.division ? dn(hover.division) : t("mapBorder")} · {hover.lat.toFixed(2)}–{(hover.lat + 0.25).toFixed(2)}°N</div>
      </div>}
    </div>
  );
}
