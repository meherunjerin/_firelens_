import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, Pause, Play } from "lucide-react";
import { SiteNav, Footer } from "@/components/fl/SiteNav";
import { SectionHead, Stat } from "@/components/fl/ui";
import { Button } from "@/components/ui/button";
import { PRESETS, MONTH_NAMES, analyse, boxInside, cellId, cellTotals, loadBD, medianOf, monthKeys, toCSV, viridis, type AOI, type Band, type Cell, type Inside, type Validation } from "@/lib/bddata";
import { BDMap } from "@/components/fl/BDMap";
import { DIVISIONS, divisionAt } from "@/lib/bdgeo";

export const Route = createFileRoute("/bangladesh")({
  head: () => ({ meta: [
    { title: "Bangladesh Burning Calendar — FireLens" },
    { name: "description", content: "Harmonized MODIS + VIIRS fire history for Bangladesh: calendar, median comparison, anomaly score and CSV export." },
  ] }),
  component: Page,
});

const M3 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const bandTone: Record<Band, string> = { Normal: "text-ok", Elevated: "text-fire", Extreme: "text-lava", "Low activity": "text-muted-foreground", "No baseline": "text-muted-foreground" };
const inputCls = "w-full rounded-sm border border-input bg-background/60 px-2 py-1.5 font-mono text-xs outline-none focus:border-fire";

function Page() {
  const [data, setData] = useState<{ cells: Cell[]; validation: Validation } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { loadBD().then(setData).catch((e) => setErr(String(e.message ?? e))); }, []);
  return (
    <div><SiteNav /><div className="pt-24">
      {err && <Missing msg={err} />}
      {!err && !data && <p className="px-6 py-24 text-center font-mono text-xs text-muted-foreground md:px-12">Loading harmonized fire data…</p>}
      {data && <Dashboard cells={data.cells} validation={data.validation} />}
    </div><Footer /></div>
  );
}

function Missing({ msg }: { msg: string }) {
  return <section className="mx-auto max-w-3xl px-6 py-24"><div className="eyebrow">Data not found</div>
    <h1 className="mt-3 font-display text-3xl font-bold">Add your harmonized files</h1>
    <p className="mt-4 text-muted-foreground">{msg}. Copy <code className="text-fire">monthly_cells.json</code> (and optionally <code className="text-fire">validation.json</code> and <code className="text-fire">validation.png</code>) from Colab into <code className="text-fire">public/data/</code>, then reload.</p></section>;
}

function Dashboard({ cells, validation }: { cells: Cell[]; validation: Validation }) {
  const months = useMemo(() => monthKeys(cells), [cells]);
  const years = useMemo(() => [...new Set(months.map((k) => +k.slice(0, 4)))], [months]);
  const [area, setArea] = useState("all"); // "all" | "div:Name" | "cell:lat,lon" | "box"
  const [box, setBox] = useState<AOI>(PRESETS[0]!.aoi);
  const [y0, setY0] = useState(years[0] ?? 2012), [y1, setY1] = useState(years[years.length - 1] ?? 2025);
  const [sel, setSel] = useState<string | null>(null);
  const [tm, setTm] = useState<string | null>(null); // Time Machine month (null = range total)
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const divOf = useMemo(() => { const m = new Map<string, string | null>(); for (const c of cells) { const id = cellId(c); if (!m.has(id)) m.set(id, divisionAt(c.cell_lat + 0.125, c.cell_lon + 0.125)); } return m; }, [cells]);
  const inside: Inside = useMemo(() => area === "all" ? () => true : area.startsWith("div:") ? (c) => divOf.get(cellId(c)) === area.slice(4)
    : area.startsWith("cell:") ? (c) => cellId(c) === area.slice(5) : boxInside(box), [area, box, divOf]);
  const areaName = area === "all" ? "Whole Bangladesh" : area.startsWith("div:") ? `${area.slice(4)} division` : area.startsWith("cell:") ? `Grid cell ${area.slice(5)}` : "Custom area";
  const { rows, nCells, cut, minActive } = useMemo(() => analyse(cells, months, inside), [cells, months, inside]);
  const mapCells = useMemo(() => cellTotals(cells, y0, y1).map((t) => ({ id: `${t.lat},${t.lon}`, lat: t.lat, lon: t.lon, value: t.n, division: divOf.get(`${t.lat},${t.lon}`) ?? null })), [cells, y0, y1, divOf]);
  const mapMax = Math.max(1, ...mapCells.map((c) => c.value));
  const shown = rows.filter((r) => r.year >= y0 && r.year <= y1);
  const byKey = new Map(shown.map((r) => [r.key, r]));
  const yrs = years.filter((y) => y >= y0 && y <= y1);
  const max = Math.max(1, ...shown.map((r) => r.count));
  const meds = M3.map((_, i) => medianOf(shown.filter((r) => r.mon === i + 1).map((r) => r.count)));
  const focus = tm ?? sel;
  const cur = (focus && byKey.get(focus)) || [...shown].sort((a, b) => b.count - a.count).find((r) => r.year === y1) || shown[shown.length - 1];

  // ---- Time Machine: per-month values for every grid cell, one fixed colour scale for the whole animation ----
  const tmKeys = shown.map((r) => r.key), tmSig = tmKeys.join(",");
  const grid = useMemo(() => cellTotals(cells, 0, 9999).map((t) => ({ id: `${t.lat},${t.lon}`, lat: t.lat, lon: t.lon, division: divOf.get(`${t.lat},${t.lon}`) ?? null })), [cells, divOf]);
  const byMonth = useMemo(() => { const m = new Map<string, Map<string, number>>(); for (const c of cells) { let e = m.get(c.month); if (!e) m.set(c.month, (e = new Map())); const id = cellId(c); e.set(id, (e.get(id) ?? 0) + c.count_harmonized); } return m; }, [cells]);
  const tmMax = useMemo(() => { let mx = 1; for (const [k, e] of byMonth) { const y = +k.slice(0, 4); if (y >= y0 && y <= y1) for (const v of e.values()) mx = Math.max(mx, v); } return mx; }, [byMonth, y0, y1]);
  const tmCells = tm ? grid.map((g) => ({ ...g, value: byMonth.get(tm)?.get(g.id) ?? 0 })) : null;
  const tmIdx = tm ? Math.max(0, tmKeys.indexOf(tm)) : 0;
  useEffect(() => {
    if (!playing || tmKeys.length === 0) return;
    const id = setInterval(() => setTm((c) => { const i = c ? tmKeys.indexOf(c) : -1; return tmKeys[(i + 1) % tmKeys.length] ?? null; }), 600 / speed);
    return () => clearInterval(id);
  }, [playing, speed, tmSig]);
  useEffect(() => { if (tm && !tmKeys.includes(tm)) { setTm(null); setPlaying(false); } }, [tmSig]);
  const togglePlay = () => { if (playing) { setPlaying(false); return; } if (!tm) setTm(tmKeys[0] ?? null); setPlaying(true); };
  const tmMax2 = Math.max(1, ...shown.map((r) => r.count));
  const spark = shown.map((r, i) => `${((i / Math.max(1, shown.length - 1)) * 600).toFixed(1)},${(38 - Math.sqrt(r.count / tmMax2) * 34).toFixed(1)}`).join(" ");

  const setNum = (k: keyof AOI, v: string) => { setArea("box"); setBox({ ...box, [k]: parseFloat(v) }); };
  const download = () => {
    const url = URL.createObjectURL(new Blob([toCSV(shown)], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `firelens_${area.replace(/[^a-z0-9]+/gi, "_")}_${y0}-${y1}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <section className="mx-auto max-w-[1440px] px-6 pb-24 md:px-12">
      <SectionHead index="BD" eyebrow="Real data · NASA FIRMS" title={<>Bangladesh<br /><span className="text-fire-gradient">burning calendar.</span></>}
        sub="MODIS and VIIRS merged into one VIIRS-equivalent history, compared with the median of the same month in earlier years." />

      {/* AOI + date range + map */}
      <div className="glass grid gap-8 rounded-sm p-5 lg:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <div>
            <div className="eyebrow mb-3">Area of interest</div>
            <select aria-label="Area" value={area.startsWith("div:") || area.startsWith("cell:") || area === "all" ? area : "box"} onChange={(e) => setArea(e.target.value)} className={inputCls}>
              <option value="all">Whole Bangladesh</option>
              {DIVISIONS.map((d) => <option key={d.name} value={`div:${d.name}`}>{d.name} division</option>)}
              {area.startsWith("cell:") && <option value={area}>{areaName}</option>}
              <option value="box">Custom bounds…</option>
            </select>
            {area === "box" && <div className="mt-3 grid grid-cols-2 gap-2">
              {(["north", "south", "west", "east"] as const).map((k) => (
                <label key={k} className="font-mono text-[9px] uppercase text-muted-foreground">{k} {k === "north" || k === "south" ? "lat" : "lon"}
                  <input type="number" step="0.25" value={Number.isFinite(box[k]) ? box[k] : ""} onChange={(e) => setNum(k, e.target.value)} className={`${inputCls} mt-1`} /></label>))}
            </div>}
            <p className="mt-3 font-mono text-[10px] leading-relaxed text-muted-foreground">{nCells} grid cells (0.25°). Each cell belongs to the division containing its centre point, so cells on a border are assigned to one side.</p>
          </div>
          <div>
            <div className="eyebrow mb-3">Date range</div>
            <div className="grid grid-cols-2 gap-2">
              <select aria-label="From year" value={y0} onChange={(e) => setY0(Math.min(+e.target.value, y1))} className={inputCls}>{years.map((y) => <option key={y}>{y}</option>)}</select>
              <select aria-label="To year" value={y1} onChange={(e) => setY1(Math.max(+e.target.value, y0))} className={inputCls}>{years.map((y) => <option key={y}>{y}</option>)}</select>
            </div>
            <Button onClick={download} variant="outline" className="mt-4 w-full rounded-sm text-xs"><Download size={14} /> Download CSV ({shown.length} months)</Button>
            <p className="mt-3 font-mono text-[10px] text-muted-foreground">Includes source flag, median, score and band.</p>
          </div>
        </div>
        <div>
          <div className="eyebrow mb-3">Where it burns · {tm ? `${MONTH_NAMES[+tm.slice(5) - 1]} ${tm.slice(0, 4)}` : `${y0}–${y1}`} · {areaName}</div>
          <BDMap cells={tmCells ?? mapCells} max={tm ? tmMax : mapMax} unit={tm ? "detections this month" : "detections in range"}
            division={area.startsWith("div:") ? area.slice(4) : null} cellId={area.startsWith("cell:") ? area.slice(5) : null}
            onDivision={(n) => setArea(n ? `div:${n}` : "all")} onCell={(id) => setArea(`cell:${id}`)} />
          <div className="mt-4 rounded-sm border border-border p-3">
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" onClick={togglePlay} className="rounded-sm text-xs">{playing ? <Pause size={14} /> : <Play size={14} />}{playing ? "Pause" : "Time Machine"}</Button>
              <select aria-label="Playback speed" value={speed} onChange={(e) => setSpeed(+e.target.value)} className="rounded-sm border border-input bg-background/60 px-2 py-1.5 font-mono text-xs">
                <option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option>
              </select>
              <span className="font-display text-lg font-bold text-fire">{tm ? `${MONTH_NAMES[+tm.slice(5) - 1]} ${tm.slice(0, 4)}` : "Range total"}</span>
              {tm && <Button variant="ghost" size="sm" onClick={() => { setTm(null); setPlaying(false); }} className="rounded-sm text-xs">Show range total</Button>}
            </div>
            <input type="range" aria-label="Time Machine month" min={0} max={Math.max(0, tmKeys.length - 1)} value={tmIdx}
              onChange={(e) => { const k = tmKeys[+e.target.value]; if (k) { setTm(k); setSel(k); } }} className="fl-range mt-3 w-full" />
            <svg viewBox="0 0 600 40" preserveAspectRatio="none" className="mt-1 h-10 w-full" role="img" aria-label={`Monthly detections for ${areaName}`}>
              <polyline points={spark} fill="none" stroke="var(--sat)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
              {tm && <line x1={(tmIdx / Math.max(1, tmKeys.length - 1)) * 600} x2={(tmIdx / Math.max(1, tmKeys.length - 1)) * 600} y1={0} y2={40} stroke="var(--fire)" strokeWidth={2} vectorEffect="non-scaling-stroke" />}
            </svg>
            <p className="font-mono text-[10px] text-muted-foreground">Colors use one fixed scale across all months, so quiet months look dark. The line shows {areaName}.</p>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="mt-12">
        <div className="eyebrow mb-4">Burning calendar · harmonized detections per month</div>
        <div className="overflow-x-auto"><div className="min-w-[640px]">
          <div className="grid gap-1" style={{ gridTemplateColumns: "48px repeat(12, minmax(0, 1fr))" }}>
            <span />{M3.map((m) => <span key={m} className="text-center font-mono text-[10px] text-muted-foreground">{m}</span>)}
            {yrs.map((y) => (<>
              <span key={`y${y}`} className="font-mono text-[10px] leading-7 text-muted-foreground">{y}</span>
              {M3.map((_, i) => {
                const r = byKey.get(`${y}-${String(i + 1).padStart(2, "0")}`);
                if (!r) return <span key={`${y}-${i}`} className="h-7 rounded-[2px] bg-secondary/40" />;
                return <button key={r.key} onClick={() => { setSel(r.key); if (tm) setTm(r.key); }} aria-label={`${MONTH_NAMES[i]} ${y}: ${Math.round(r.count)} detections, ${r.band}`}
                  title={`${MONTH_NAMES[i]} ${y}: ${Math.round(r.count)} · ${r.band}${r.calibrated ? " · calibrated from MODIS" : ""}`}
                  className={`h-7 rounded-[2px] ${r.calibrated ? "outline-dashed outline-1 outline-white/40 -outline-offset-2" : ""} ${cur?.key === r.key ? "ring-2 ring-fire ring-offset-1 ring-offset-background" : ""}`}
                  style={{ background: viridis(Math.log1p(r.count) / Math.log1p(max)) }} />;
              })}
            </>))}
            <span className="font-mono text-[10px] leading-7 text-sat">Median</span>
            {meds.map((v, i) => <span key={i} className="text-center font-mono text-[10px] leading-7 text-sat">{Math.round(v)}</span>)}
          </div>
        </div></div>
        <div className="mt-4 flex flex-wrap items-center gap-4 font-mono text-[10px] text-muted-foreground">
          <span className="flex items-center gap-2">few<span className="h-2 w-32 rounded-sm" style={{ background: `linear-gradient(90deg, ${[0, .25, .5, .75, 1].map(viridis).join(",")})` }} />many (log scale)</span>
          <span className="flex items-center gap-2"><span className="h-3 w-3 outline-dashed outline-1 outline-white/60" />calibrated from MODIS (lower confidence)</span>
          <span>Click a month to inspect it.</span>
        </div>
      </div>

      {/* Insight */}
      {cur && <div className="mt-14 grid gap-10 border-t border-border pt-10 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <div className="eyebrow">{areaName} · is {MONTH_NAMES[cur.mon - 1]} {cur.year} normal?</div>
          <div className={`mt-3 font-display text-5xl font-semibold ${bandTone[cur.band]}`}>{cur.band}</div>
          <Meter score={cur.score} active={cur.band === "Normal" || cur.band === "Elevated" || cur.band === "Extreme"} />
          <p className="mt-6 text-base leading-relaxed text-foreground/90"><span className="eyebrow mr-2">Why flagged?</span>{cur.why}</p>
          <p className="mt-4 font-mono text-[10px] leading-relaxed text-muted-foreground">Counts are satellite hotspots, not fire size or damage; they include agricultural burning. Months with fewer than {minActive} detections are labelled “Low activity”.</p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <Stat label="Detections" value={Math.round(cur.count).toLocaleString()} tone="fire" />
          <Stat label={`Median ${M3[cur.mon - 1]}`} value={Math.round(cur.median).toLocaleString()} />
          <Stat label="× median" value={cur.band === "No baseline" ? "—" : cur.xMedian.toFixed(2)} tone="fire" />
          <Stat label="Score" value={cur.band === "No baseline" ? "—" : cur.score.toFixed(2)} />
          <Stat label="Rank in history" value={cur.of ? `${cur.rank} of ${cur.of}` : "—"} />
          <Stat label="Confidence" value={cur.confidence} tone="sat" />
          <div className="col-span-full font-mono text-[10px] text-muted-foreground">{cur.calibrated ? `Calibrated from MODIS (before ${cut}).` : "Directly observed by VIIRS."}</div>
        </div>
      </div>}

      <Method validation={validation} cut={cut} />
    </section>
  );
}

function Meter({ score, active }: { score: number; active: boolean }) {
  const lo = -0.5, hi = 4, pos = (v: number) => `${((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * 100}%`;
  return <div className="mt-5" role="img" aria-label={active ? `Anomaly score ${score.toFixed(2)}` : "No score for this month"}>
    <div className="relative flex h-2 overflow-hidden rounded-full">
      <span className="bg-ok/70" style={{ width: pos(1.5) }} /><span className="bg-fire/80" style={{ width: `calc(${pos(3)} - ${pos(1.5)})` }} /><span className="flex-1 bg-lava" />
    </div>
    {active && <div className="relative h-3"><span className="absolute top-0 h-3 w-0.5 bg-foreground" style={{ left: pos(score) }} /></div>}
    <div className="mt-1 flex justify-between font-mono text-[9px] uppercase text-muted-foreground"><span>Normal &lt; 1.5</span><span>Elevated 1.5–3</span><span>Extreme ≥ 3</span></div>
  </div>;
}

function Method({ validation: v, cut }: { validation: Validation; cut: string }) {
  const [img, setImg] = useState(true);
  return <div className="mt-16 border-t border-border pt-10">
    <div className="eyebrow">Method · how MODIS and VIIRS were harmonized</div>
    <ol className="mt-4 max-w-3xl list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
      <li>Keep vegetation fires only (<code>type = 0</code>) with nominal/high confidence; count per 0.25° cell per month.</li>
      <li>On the overlap period, learn how many VIIRS detections correspond to one MODIS detection, separately for each calendar month.</li>
      <li>Before {cut}, use MODIS × that ratio (flagged “calibrated”); afterwards use VIIRS directly.</li>
      <li>Score = (log(1+count) − median of the same month in earlier years) ÷ max(1.4826 × MAD, 0.35). Elevated ≥ 1.5, Extreme ≥ 3, at least 5 earlier years.</li>
    </ol>
    {v.all ? <>
      <div className="mt-8 grid grid-cols-2 gap-8 sm:grid-cols-4">
        <Stat label="R² (held-out years)" value={v.all.r2.toFixed(3)} tone="sat" />
        <Stat label="Mean abs. error / mo" value={Math.round(v.all.mae).toLocaleString()} />
        <Stat label="Bias" value={`${v.all.bias_pct.toFixed(1)}%`} />
        {v.peak && <Stat label="R² Feb–Apr only" value={v.peak.r2.toFixed(3)} />}
      </div>
      <p className="mt-4 max-w-3xl font-mono text-[10px] text-muted-foreground">Validation: calibrate on later years, predict VIIRS from MODIS alone for hidden earlier years. Seasonal peaks are the least accurate part.</p>
    </> : <p className="mt-6 font-mono text-xs text-muted-foreground">Add validation.json to public/data/ to show validation numbers.</p>}
    {v.ratioByMonth && <div className="mt-6 grid max-w-3xl grid-cols-6 gap-2 sm:grid-cols-12">{M3.map((m, i) => <div key={m} className="text-center font-mono text-[10px]"><div className="text-muted-foreground">{m}</div><div className="text-sat">{(v.ratioByMonth![String(i + 1)] ?? NaN).toFixed(2)}</div></div>)}</div>}
    {img && <img src="/data/validation.png" alt="Before and after harmonization plot" onError={() => setImg(false)} className="mt-8 w-full max-w-4xl rounded-sm border border-border bg-white" />}
  </div>;
}
