import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Download, Pause, Play } from "lucide-react";
import { SiteNav, Footer } from "@/components/fl/SiteNav";
import { SectionHead, Stat } from "@/components/fl/ui";
import { Button } from "@/components/ui/button";
import { BDMap, type MapCell } from "@/components/fl/BDMap";
import { DIVISIONS, divisionAt } from "@/lib/bdgeo";
import { PRESETS, ZONE, analyse, analyseZones, boxInside, cellId, cellTotals, loadBD, medianOf, monthKeys, observedFrom, downgrade, sensorAgreement, toCSV, viridis, type AOI, type Band, type Cell, type Inside, type Row, type Validation, type ZoneKind } from "@/lib/bddata";
import { LangCtx, MONTHS, SHORT, useT, type Lang } from "@/lib/bdi18n";

export const Route = createFileRoute("/bangladesh")({
  head: () => ({ meta: [
    { title: "Bangladesh Burning Calendar — FireLens" },
    { name: "description", content: "Harmonized MODIS + VIIRS fire history for Bangladesh: calendar, zones, anomaly score and CSV export." },
  ] }),
  component: Page,
});

const bandTone: Record<Band, string> = { Normal: "text-ok", Elevated: "text-fire", Extreme: "text-lava", "Low activity": "text-muted-foreground", "No baseline": "text-muted-foreground" };
const ZONE_COLOR: Record<ZoneKind, string> = { recurring: "#3b82f6", emerging: "#f97316", both: "#fde047", none: "#475569", unknown: "#1e293b" };
const M12 = Array.from({ length: 12 }, (_, i) => i);
const inputCls = "w-full rounded-sm border border-input bg-background/60 px-2 py-1.5 font-mono text-xs outline-none focus:border-fire";

function Page() {
  const [lang, setLang] = useState<Lang>("en");
  return <LangCtx.Provider value={lang}><Shell lang={lang} setLang={setLang} /></LangCtx.Provider>;
}

function Shell({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const { t } = useT();
  const [data, setData] = useState<{ cells: Cell[]; validation: Validation } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (new URLSearchParams(window.location.hash.slice(1)).get("l") === "bn") setLang("bn"); }, []);
  useEffect(() => { loadBD().then(setData).catch((e) => setErr(String(e.message ?? e))); }, []);
  return (
    <div><SiteNav /><div className="pt-24">
      <div className="mx-auto flex max-w-[1440px] justify-end px-6 md:px-12">
        <button onClick={() => setLang(lang === "en" ? "bn" : "en")} aria-label="Switch language / ভাষা বদলান" className="rounded-sm border border-border px-3 py-1.5 font-mono text-xs hover:border-fire">{lang === "en" ? "বাংলা" : "English"}</button>
      </div>
      {err && <Missing msg={err} />}
      {!err && !data && <p className="px-6 py-24 text-center font-mono text-xs text-muted-foreground md:px-12">{t("loading")}</p>}
      {data && <Dashboard cells={data.cells} validation={data.validation} />}
    </div><Footer /></div>
  );
}

function Missing({ msg }: { msg: string }) {
  return <section className="mx-auto max-w-3xl px-6 py-24"><div className="eyebrow">Data not found</div>
    <h1 className="mt-3 font-display text-3xl font-bold">Add your harmonized files</h1>
    <p className="mt-4 text-muted-foreground">{msg}. Copy <code className="text-fire">monthly_cells.json</code> (and optionally <code className="text-fire">validation.json</code> and <code className="text-fire">validation.png</code>) from Colab into <code className="text-fire">public/data/</code>, then reload.</p></section>;
}

function Dashboard({ cells: rawCells, validation }: { cells: Cell[]; validation: Validation }) {
  const { t, lang, dn } = useT();
  const mn = MONTHS[lang], sh = SHORT[lang];
  const hp = useMemo(() => new URLSearchParams(window.location.hash.slice(1)), []);
  const hasRaw = rawCells[0]?.modis !== undefined && rawCells[0]?.viirs !== undefined;
  const [series, setSeries] = useState<"harmonized" | "modis" | "viirs">(hasRaw && (hp.get("s") === "modis" || hp.get("s") === "viirs") ? (hp.get("s") as "modis" | "viirs") : "harmonized");
  const cells = useMemo(() => series === "harmonized" ? rawCells : rawCells.map((c) => ({ ...c, count_harmonized: (series === "modis" ? c.modis : c.viirs) ?? 0, source_flag: "observed" as const })), [rawCells, series]);
  const months = useMemo(() => monthKeys(cells), [cells]);
  const years = useMemo(() => [...new Set(months.map((k) => +k.slice(0, 4)))], [months]);
  const [area, setArea] = useState(hp.get("a") ?? "all"); // "all" | "div:Name" | "cell:lat,lon" | "box"
  const [box, setBox] = useState<AOI>(() => { const b = (hp.get("b") ?? "").split(",").map(Number); return b.length === 4 && b.every(Number.isFinite) ? { north: b[0]!, south: b[1]!, west: b[2]!, east: b[3]! } : PRESETS[0]!.aoi; });
  const pickYear = (k: string, d: number) => { const v = Number(hp.get(k)); return years.includes(v) ? v : d; };
  const [y0, setY0] = useState(pickYear("y0", years[0] ?? 2012)), [y1, setY1] = useState(pickYear("y1", years[years.length - 1] ?? 2025));
  const [sel, setSel] = useState<string | null>(hp.get("m"));
  const [tm, setTm] = useState<string | null>(null); // Time Machine month (null = range total)
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [layer, setLayer] = useState<"count" | "zones">("count");
  const [cmp, setCmp] = useState("none"); // Fingerprint comparison area
  const [copied, setCopied] = useState(false);
  useEffect(() => { // keep the address bar a shareable link
    const q = new URLSearchParams({ a: area, y0: String(y0), y1: String(y1), s: series, l: lang });
    if (sel) q.set("m", sel); if (area === "box") q.set("b", [box.north, box.south, box.west, box.east].join(","));
    window.history.replaceState(null, "", `#${q}`);
  }, [area, y0, y1, sel, series, lang, box]);

  const divOf = useMemo(() => { const m = new Map<string, string | null>(); for (const c of cells) { const id = cellId(c); if (!m.has(id)) m.set(id, divisionAt(c.cell_lat + 0.125, c.cell_lon + 0.125)); } return m; }, [cells]);
  const makeInside = (a: string): Inside => a === "all" ? () => true : a.startsWith("div:") ? (c) => divOf.get(cellId(c)) === a.slice(4)
    : a.startsWith("cell:") ? (c) => cellId(c) === a.slice(5) : boxInside(box);
  const nameOf = (a: string) => a === "all" ? t("whole") : a.startsWith("div:") ? t("divName", dn(a.slice(4))) : a.startsWith("cell:") ? t("cellLabel", a.slice(5)) : t("customArea");
  const areaName = nameOf(area);
  const inside = useMemo(() => makeInside(area), [area, box, divOf]);
  const { rows, nCells, cut, minActive } = useMemo(() => analyse(cells, months, inside), [cells, months, inside]);

  const grid = useMemo(() => cellTotals(cells, 0, 9999).map((g) => ({ id: `${g.lat},${g.lon}`, lat: g.lat, lon: g.lon, division: divOf.get(`${g.lat},${g.lon}`) ?? null })), [cells, divOf]);
  const mapCells = useMemo(() => cellTotals(cells, y0, y1).map((g) => ({ id: `${g.lat},${g.lon}`, lat: g.lat, lon: g.lon, value: g.n, division: divOf.get(`${g.lat},${g.lon}`) ?? null })), [cells, y0, y1, divOf]);
  const mapMax = Math.max(1, ...mapCells.map((c) => c.value));

  const shown = rows.filter((r) => r.year >= y0 && r.year <= y1);
  const byKey = new Map(shown.map((r) => [r.key, r]));
  const yrs = years.filter((y) => y >= y0 && y <= y1);
  const max = Math.max(1, ...shown.map((r) => r.count));
  const meds = M12.map((i) => medianOf(shown.filter((r) => r.mon === i + 1).map((r) => r.count)));
  const focus = tm ?? sel;
  const cur: Row | undefined = (focus && byKey.get(focus)) || [...shown].sort((a, b) => b.count - a.count).find((r) => r.year === y1) || shown[shown.length - 1];

  // ---- Time Machine ----
  const tmKeys = shown.map((r) => r.key), tmSig = tmKeys.join(",");
  const byMonth = useMemo(() => { const m = new Map<string, Map<string, number>>(); for (const c of cells) { let e = m.get(c.month); if (!e) m.set(c.month, (e = new Map())); const id = cellId(c); e.set(id, (e.get(id) ?? 0) + c.count_harmonized); } return m; }, [cells]);
  const tmMax = useMemo(() => { let mx = 1; for (const [k, e] of byMonth) { const y = +k.slice(0, 4); if (y >= y0 && y <= y1) for (const v of e.values()) mx = Math.max(mx, v); } return mx; }, [byMonth, y0, y1]);
  const tmCells: MapCell[] | null = tm ? grid.map((g) => ({ ...g, value: byMonth.get(tm)?.get(g.id) ?? 0 })) : null;
  const tmIdx = tm ? Math.max(0, tmKeys.indexOf(tm)) : 0;
  useEffect(() => {
    if (!playing || tmKeys.length === 0) return;
    const id = setInterval(() => setTm((c) => { const i = c ? tmKeys.indexOf(c) : -1; return tmKeys[(i + 1) % tmKeys.length] ?? null; }), 600 / speed);
    return () => clearInterval(id);
  }, [playing, speed, tmSig]);
  useEffect(() => { if (tm && !tmKeys.includes(tm)) { setTm(null); setPlaying(false); } }, [tmSig]);
  const togglePlay = () => { if (playing) { setPlaying(false); return; } if (!tm) setTm(tmKeys[0] ?? null); setPlaying(true); };
  const spark = shown.map((r, i) => `${((i / Math.max(1, shown.length - 1)) * 600).toFixed(1)},${(38 - Math.sqrt(r.count / max) * 34).toFixed(1)}`).join(" ");

  // ---- Zones ----
  const zoneRes = useMemo(() => analyseZones(cells, months, y0, y1), [cells, months, y0, y1]);
  const zoneById = useMemo(() => new Map(zoneRes.zones.map((z) => [z.id, z])), [zoneRes]);
  const zoneCells: MapCell[] = grid.map((g) => { const z = zoneById.get(g.id); return { ...g, value: 0, note: z ? `${t("zk_" + z.kind)}${z.ratio >= 1 && (z.kind === "emerging" || z.kind === "both") ? ` · ${z.ratio.toFixed(1)}×` : ""}` : undefined }; });
  const recur = zoneRes.zones.filter((z) => z.kind === "recurring" || z.kind === "both"), emerg = zoneRes.zones.filter((z) => z.kind === "emerging" || z.kind === "both");
  const topEmg = [...emerg].sort((a, b) => b.ratio - a.ratio).slice(0, 5);
  const topRec = [...recur].sort((a, b) => b.active / b.years - a.active / a.years || b.recent - a.recent).slice(0, 5);
  const seasonName = `${sh[(zoneRes.season[0] ?? 1) - 1]}–${sh[(zoneRes.season[2] ?? 3) - 1]}`;
  const showZones = layer === "zones";
  const cellText = (id: string) => `${divOf.get(id) ? dn(divOf.get(id)!) : t("mapBorder")} (${id})`;

  // ---- Confidence (years of history, calibrated vs observed, area size, sensor agreement), trend, top contributor, watchlist ----
  const agree = useMemo(() => hasRaw ? sensorAgreement(rawCells, inside, observedFrom(rawCells)) : null, [rawCells, inside, hasRaw]);
  let conf: Row["confidence"] = cur?.confidence ?? "Low"; const confNotes: string[] = [];
  if (cur) {
    confNotes.push(t("cnYears", Math.max(0, cur.of - 1))); if (cur.calibrated) confNotes.push(t("cnCal"));
    if (nCells < 3) { confNotes.push(t("cnSmall", nCells)); conf = downgrade(conf); }
    if (agree !== null) { if (agree < 0.7) { confNotes.push(t("cnDisagree", agree.toFixed(2))); conf = downgrade(conf); } else confNotes.push(t("cnAgree", agree.toFixed(2))); }
  }
  const trendRows = cur ? rows.filter((r) => r.mon === cur.mon && r.year <= cur.year && r.band !== "No baseline").slice(-3) : [];
  const trendText = trendRows.length === 3 ? t("whyTrend", ...trendRows.map((r) => r.xMedian.toFixed(1))) : "";
  const gridById = useMemo(() => new Map(grid.map((g) => [g.id, g])), [grid]);
  const topText = (() => {
    if (!cur || area.startsWith("cell:") || cur.band === "Low activity" || cur.band === "No baseline") return "";
    const e = byMonth.get(cur.key); if (!e) return "";
    const g = new Map<string, number>(); let tot = 0; const byCell = area.startsWith("div:");
    for (const [id, v] of e) { const gc = gridById.get(id); if (!gc || !inside({ cell_lat: gc.lat, cell_lon: gc.lon, month: cur.key, count_harmonized: 0, source_flag: "observed" })) continue; const k = byCell ? id : (gc.division ?? ""); tot += v; g.set(k, (g.get(k) ?? 0) + v); }
    const top = [...g.entries()].sort((a, b) => b[1] - a[1])[0];
    return top && top[0] && tot > 0 ? t("whyTop", byCell ? cellText(top[0]) : dn(top[0]), Math.round((top[1] / tot) * 100)) : "";
  })();
  const scored = (b: Band) => b === "Normal" || b === "Elevated" || b === "Extreme";
  const watch = useMemo(() => cur ? DIVISIONS.map((d) => ({ name: d.name, r: analyse(cells, months, makeInside(`div:${d.name}`)).rows.find((x) => x.key === cur.key) }))
    .flatMap((x) => x.r ? [{ name: x.name, r: x.r }] : []).sort((a, b) => (scored(b.r.band) ? 1 : 0) - (scored(a.r.band) ? 1 : 0) || (scored(a.r.band) ? b.r.score - a.r.score : b.r.count - a.r.count)) : [],
    [cells, months, cur?.key, divOf]);

  // ---- Fire Fingerprint ----
  const profile = (rs: Row[]) => M12.map((i) => medianOf(rs.filter((r) => r.mon === i + 1).map((r) => r.count)));
  const typical = profile(shown), yearProf = M12.map((i) => shown.find((r) => r.year === cur?.year && r.mon === i + 1)?.count ?? 0);
  const cmpProf = useMemo(() => cmp === "none" ? null : profile(analyse(cells, months, makeInside(cmp)).rows.filter((r) => r.year >= y0 && r.year <= y1)), [cmp, cells, months, box, divOf, y0, y1]);
  const total = typical.reduce((a, b) => a + b, 0), peakI = typical.indexOf(Math.max(...typical));
  let ws = 0, wb = -1; for (const i of M12) { const v = (typical[i] ?? 0) + (typical[(i + 1) % 12] ?? 0) + (typical[(i + 2) % 12] ?? 0); if (v > wb) { wb = v; ws = i; } }
  const peakText = total > 0 ? t("fpPeak", mn[peakI] ?? "", Math.round((wb / total) * 100), `${sh[ws]}–${sh[(ws + 2) % 12]}`) : "";

  const whyText = (r: Row) => { const m = mn[r.mon - 1] ?? "";
    if (r.band === "No baseline") return t("whyNoBase", m, 5);
    if (r.band === "Low activity") return t("whyLow", Math.round(r.count), m, Math.round(r.median));
    if (r.band === "Normal") return t("whyNormal", r.xMedian.toFixed(1), m);
    return t("whyFlag", r.xMedian.toFixed(1), m, r.rank, r.of); };
  const setNum = (k: keyof AOI, v: string) => { setArea("box"); setBox({ ...box, [k]: parseFloat(v) }); };
  const download = () => {
    const note = [`# FireLens export | ${areaName} | ${y0}-${y1} | layer: ${series}`, "# Source: NASA FIRMS (MODIS C6.1, VIIRS 375 m), harmonized by FireLens",
      "# Method: monthly counts per 0.25 deg cell; MODIS converted to VIIRS-equivalent with monthly ratios learned on the overlap; score = robust log-scale anomaly vs same month in earlier years",
      "# Independent project, not an official NASA product. Counts are hotspots, not fire size or damage."];
    const url = URL.createObjectURL(new Blob([toCSV(shown, note)], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `firelens_${area.replace(/[^a-z0-9]+/gi, "_")}_${y0}-${y1}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  const copyLink = () => { navigator.clipboard?.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const openReport = () => {
    const esc = (x: string) => x.replace(/[&<>]/g, (c) => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;"));
    const heat = yrs.map((y) => `<tr><th>${y}</th>${M12.map((i) => { const r = byKey.get(`${y}-${String(i + 1).padStart(2, "0")}`);
      return r ? `<td style="background:${viridis(Math.log1p(r.count) / Math.log1p(max))}${r.calibrated ? ";outline:1px dashed #fff;outline-offset:-2px" : ""}"></td>` : "<td></td>"; }).join("")}</tr>`).join("");
    const wl = watch.slice(0, 5).map((w) => `<li>${esc(dn(w.name))}: ${esc(t("band_" + w.r.band))}${scored(w.r.band) ? ` (${w.r.xMedian.toFixed(1)}×)` : ""}</li>`).join("");
    const body = cur ? `<h2>${esc(t("isNormal", areaName, mn[cur.mon - 1] ?? "", cur.year))}</h2><p class="band">${esc(t("band_" + cur.band))}</p>
      <table class="kv"><tr><td>${esc(t("detections"))}</td><td>${Math.round(cur.count).toLocaleString()}</td><td>${esc(t("medianOf", sh[cur.mon - 1] ?? ""))}</td><td>${Math.round(cur.median).toLocaleString()}</td></tr>
      <tr><td>${esc(t("xMedian"))}</td><td>${scored(cur.band) ? cur.xMedian.toFixed(2) : "—"}</td><td>${esc(t("score"))}</td><td>${scored(cur.band) ? cur.score.toFixed(2) : "—"}</td></tr>
      <tr><td>${esc(t("confidence"))}</td><td>${esc(t("conf_" + conf))}</td><td colspan="2" class="s">${esc(confNotes.join("; "))}</td></tr></table>
      <p><b>${esc(t("whyLabel"))}</b> ${esc(whyText(cur))} ${esc(trendText)} ${esc(topText)}</p>` : "";
    const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${esc(t("repTitle"))} — ${esc(areaName)}</title><style>
      body{font:14px/1.5 system-ui,sans-serif;max-width:780px;margin:24px auto;padding:0 16px;color:#111;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      h1{font-size:22px;margin:0}h2{font-size:16px;margin:20px 0 4px}.s{color:#555;font-size:12px}.band{font-size:30px;font-weight:700;margin:4px 0}
      table.kv td{padding:3px 12px 3px 0}table.heat{border-collapse:separate;border-spacing:2px;margin:6px 0}table.heat td{width:30px;height:14px;background:#eee}table.heat th{font-size:10px;font-weight:400;padding-right:6px;text-align:right}
      footer{margin-top:24px;border-top:1px solid #ccc;padding-top:8px;font-size:12px;color:#444}</style></head><body>
      <h1>${esc(t("repTitle"))}: ${esc(areaName)}</h1><div class="s">${y0}–${y1} · ${esc(new Date().toLocaleDateString())} · ${esc(t(series === "harmonized" ? "serHarm" : series === "modis" ? "serModis" : "serViirs"))}</div>
      ${body}<h2>${esc(t("calTitle"))}</h2><table class="heat"><tr><th></th>${sh.map((m) => `<th>${esc(m)}</th>`).join("")}</tr>${heat}</table>
      <p class="s">${esc(t("calCal"))}</p>
      <h2>${esc(t("zonesTitle"))}</h2><p>${esc(t("zStatRec"))}: ${recur.length} · ${esc(t("zStatEmg"))}: ${emerg.length} · ${esc(t("zSeason"))}: ${esc(seasonName)}</p>
      ${cur ? `<h2>${esc(t("wlTitle"))}</h2><ol>${wl}</ol><p class="s">${esc(t("wlSub", mn[cur.mon - 1] ?? "", cur.year))}</p>` : ""}
      <footer><p>${esc(t("repSource"))}</p><p>${esc(t("repLimits"))}</p><p><b>${esc(t("indep"))}</b></p></footer></body></html>`;
    const w = window.open("", "_blank"); if (!w) return; w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 400);
  };
  const swatch = (c: string) => <span className="inline-block h-3 w-3 rounded-[2px]" style={{ background: c }} />;

  return (
    <section className="mx-auto max-w-[1440px] px-6 pb-24 md:px-12">
      <SectionHead index="BD" eyebrow={t("eyebrow")} title={<>{t("title1")}<br /><span className="text-fire-gradient">{t("title2")}</span></>} sub={t("sub")} />

      <div className="glass grid gap-8 rounded-sm p-5 lg:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <div>
            <div className="eyebrow mb-3">{t("series")}</div>
            <div className="flex overflow-hidden rounded-sm border border-border font-mono text-[11px]" role="group">
              {(["harmonized", "modis", "viirs"] as const).map((k) => <button key={k} aria-pressed={series === k} disabled={k !== "harmonized" && !hasRaw} onClick={() => setSeries(k)}
                className={`flex-1 px-2 py-1.5 disabled:opacity-40 ${series === k ? "bg-fire text-background" : "text-muted-foreground hover:text-foreground"}`}>{t(k === "harmonized" ? "serHarm" : k === "modis" ? "serModis" : "serViirs")}</button>)}
            </div>
            {!hasRaw && <p className="mt-2 font-mono text-[10px] text-muted-foreground">{t("serHint")}</p>}
          </div>
          <div>
            <div className="eyebrow mb-3">{t("area")}</div>
            <select aria-label={t("area")} value={area.startsWith("div:") || area.startsWith("cell:") || area === "all" ? area : "box"} onChange={(e) => setArea(e.target.value)} className={inputCls}>
              <option value="all">{t("whole")}</option>
              {DIVISIONS.map((d) => <option key={d.name} value={`div:${d.name}`}>{t("divName", dn(d.name))}</option>)}
              {area.startsWith("cell:") && <option value={area}>{areaName}</option>}
              <option value="box">{t("custom")}</option>
            </select>
            {area === "box" && <div className="mt-3 grid grid-cols-2 gap-2">
              {(["north", "south", "west", "east"] as const).map((k) => (
                <label key={k} className="font-mono text-[9px] uppercase text-muted-foreground">{t(k)}
                  <input type="number" step="0.25" value={Number.isFinite(box[k]) ? box[k] : ""} onChange={(e) => setNum(k, e.target.value)} className={`${inputCls} mt-1`} /></label>))}
            </div>}
            <p className="mt-3 font-mono text-[10px] leading-relaxed text-muted-foreground">{t("cellsNote", nCells)}</p>
          </div>
          <div>
            <div className="eyebrow mb-3">{t("dateRange")}</div>
            <div className="grid grid-cols-2 gap-2">
              <select aria-label={t("from")} value={y0} onChange={(e) => setY0(Math.min(+e.target.value, y1))} className={inputCls}>{years.map((y) => <option key={y}>{y}</option>)}</select>
              <select aria-label={t("to")} value={y1} onChange={(e) => setY1(Math.max(+e.target.value, y0))} className={inputCls}>{years.map((y) => <option key={y}>{y}</option>)}</select>
            </div>
            <Button onClick={download} variant="outline" className="mt-4 w-full rounded-sm text-xs"><Download size={14} /> {t("csv", shown.length)}</Button>
            <p className="mt-3 font-mono text-[10px] text-muted-foreground">{t("csvNote")}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button onClick={openReport} variant="outline" className="rounded-sm text-xs">{t("repBtn")}</Button>
              <Button onClick={copyLink} variant="outline" className="rounded-sm text-xs">{copied ? t("linkCopied") : t("linkBtn")}</Button>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="eyebrow">{t("whereBurns")} · {showZones ? `${y0}–${y1}` : tm ? `${mn[+tm.slice(5) - 1]} ${tm.slice(0, 4)}` : `${y0}–${y1}`} · {areaName}</div>
            <div className="flex overflow-hidden rounded-sm border border-border font-mono text-[11px]" role="group">
              {(["count", "zones"] as const).map((l) => <button key={l} aria-pressed={layer === l} onClick={() => { setLayer(l); if (l === "zones") setPlaying(false); }}
                className={`px-3 py-1.5 ${layer === l ? "bg-fire text-background" : "text-muted-foreground hover:text-foreground"}`}>{t(l === "count" ? "layerCount" : "layerZones")}</button>)}
            </div>
          </div>
          <BDMap cells={showZones ? zoneCells : (tmCells ?? mapCells)} max={tm ? tmMax : mapMax} unit={tm ? t("unitMonth") : t("unitRange")}
            division={area.startsWith("div:") ? area.slice(4) : null} cellId={area.startsWith("cell:") ? area.slice(5) : null}
            onDivision={(n) => setArea(n ? `div:${n}` : "all")} onCell={(id) => setArea(`cell:${id}`)}
            colorOf={showZones ? (c) => ZONE_COLOR[zoneById.get(c.id)?.kind ?? "unknown"] : undefined}
            legend={showZones ? <span className="flex flex-wrap items-center gap-3">{(["recurring", "emerging", "both", "none"] as const).map((k) => <span key={k} className="flex items-center gap-1.5">{swatch(ZONE_COLOR[k])}{t("zk_" + k)}</span>)}</span> : undefined} />

          {!showZones && <div className="mt-4 rounded-sm border border-border p-3">
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" onClick={togglePlay} className="rounded-sm text-xs">{playing ? <Pause size={14} /> : <Play size={14} />}{playing ? t("pause") : t("tmBtn")}</Button>
              <select aria-label={t("speed")} value={speed} onChange={(e) => setSpeed(+e.target.value)} className="rounded-sm border border-input bg-background/60 px-2 py-1.5 font-mono text-xs">
                <option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option>
              </select>
              <span className="font-display text-lg font-bold text-fire">{tm ? `${mn[+tm.slice(5) - 1]} ${tm.slice(0, 4)}` : t("rangeTotal")}</span>
              {tm && <Button variant="ghost" size="sm" onClick={() => { setTm(null); setPlaying(false); }} className="rounded-sm text-xs">{t("showTotal")}</Button>}
            </div>
            <input type="range" aria-label={t("tmSlider")} min={0} max={Math.max(0, tmKeys.length - 1)} value={tmIdx}
              onChange={(e) => { const k = tmKeys[+e.target.value]; if (k) { setTm(k); setSel(k); } }} className="fl-range mt-3 w-full" />
            <svg viewBox="0 0 600 40" preserveAspectRatio="none" className="mt-1 h-10 w-full" role="img" aria-label={areaName}>
              <polyline points={spark} fill="none" stroke="var(--sat)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
              {tm && <line x1={(tmIdx / Math.max(1, tmKeys.length - 1)) * 600} x2={(tmIdx / Math.max(1, tmKeys.length - 1)) * 600} y1={0} y2={40} stroke="var(--fire)" strokeWidth={2} vectorEffect="non-scaling-stroke" />}
            </svg>
            <p className="font-mono text-[10px] text-muted-foreground">{t("tmNote", areaName)}</p>
          </div>}

          {showZones && <div className="mt-4 rounded-sm border border-border p-4">
            <div className="eyebrow mb-4">{t("zonesTitle")}</div>
            <div className="grid grid-cols-3 gap-6">
              <Stat label={t("zStatRec")} value={String(recur.length)} tone="sat" />
              <Stat label={t("zStatEmg")} value={String(emerg.length)} tone="fire" />
              <Stat label={t("zSeason")} value={seasonName} />
            </div>
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              {([["zTopEmg", topEmg, true], ["zTopRec", topRec, false]] as const).map(([title, list, isEmg]) => (
                <div key={title}><div className="mb-2 font-mono text-[10px] uppercase text-muted-foreground">{t(title)}</div>
                  {list.length === 0 ? <p className="font-mono text-[11px] text-muted-foreground">{t("zNoneFound")}</p> :
                    <ul className="space-y-1.5">{list.map((z) => <li key={z.id}><button onClick={() => setArea(`cell:${z.id}`)} className="text-left font-mono text-[11px] text-foreground/90 underline-offset-2 hover:text-fire hover:underline">
                      {isEmg ? t("zEmgItem", cellText(z.id), z.ratio.toFixed(1)) : t("zRecItem", cellText(z.id), z.active, z.years)}</button></li>)}</ul>}
                </div>))}
            </div>
            <p className="mt-4 font-mono text-[10px] leading-relaxed text-muted-foreground">{t("zNote", seasonName, zoneRes.years)}</p>
            <p className="mt-2 font-mono text-[10px] leading-relaxed text-muted-foreground">{t("zDisclaimer")}</p>
          </div>}
        </div>
      </div>

      {/* Calendar */}
      <div className="mt-12">
        <div className="eyebrow mb-4">{t("calTitle")}</div>
        <div className="overflow-x-auto"><div className="min-w-[640px]">
          <div className="grid gap-1" style={{ gridTemplateColumns: "48px repeat(12, minmax(0, 1fr))" }}>
            <span />{sh.map((m) => <span key={m} className="text-center font-mono text-[10px] text-muted-foreground">{m}</span>)}
            {yrs.map((y) => (<Fragment key={y}>
              <span className="font-mono text-[10px] leading-7 text-muted-foreground">{y}</span>
              {M12.map((i) => {
                const r = byKey.get(`${y}-${String(i + 1).padStart(2, "0")}`);
                if (!r) return <span key={`${y}-${i}`} className="h-7 rounded-[2px] bg-secondary/40" />;
                const tip = `${mn[i]} ${y}: ${Math.round(r.count)} · ${t("band_" + r.band)}${r.calibrated ? ` · ${t("calTip")}` : ""}`;
                return <button key={r.key} onClick={() => { setSel(r.key); if (tm) setTm(r.key); }} aria-label={tip} title={tip}
                  className={`h-7 rounded-[2px] ${r.calibrated ? "outline-dashed outline-1 outline-white/40 -outline-offset-2" : ""} ${cur?.key === r.key ? "ring-2 ring-fire ring-offset-1 ring-offset-background" : ""}`}
                  style={{ background: viridis(Math.log1p(r.count) / Math.log1p(max)) }} />;
              })}
            </Fragment>))}
            <span className="font-mono text-[10px] leading-7 text-sat">{t("median")}</span>
            {meds.map((v, i) => <span key={i} className="text-center font-mono text-[10px] leading-7 text-sat">{Math.round(v)}</span>)}
          </div>
        </div></div>
        <div className="mt-4 flex flex-wrap items-center gap-4 font-mono text-[10px] text-muted-foreground">
          <span className="flex items-center gap-2">{t("calFew")}<span className="h-2 w-32 rounded-sm" style={{ background: `linear-gradient(90deg, ${[0, .25, .5, .75, 1].map(viridis).join(",")})` }} />{t("calMany")}</span>
          <span className="flex items-center gap-2"><span className="h-3 w-3 outline-dashed outline-1 outline-white/60" />{t("calCal")}</span>
          <span>{t("calHint")}</span>
        </div>
      </div>

      {/* Insight */}
      {cur && <div className="mt-14 grid gap-10 border-t border-border pt-10 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <div className="eyebrow">{t("isNormal", areaName, mn[cur.mon - 1] ?? "", cur.year)}</div>
          <div className={`mt-3 font-display text-5xl font-semibold ${bandTone[cur.band]}`}>{t("band_" + cur.band)}</div>
          <Meter score={cur.score} active={cur.band === "Normal" || cur.band === "Elevated" || cur.band === "Extreme"} />
          <p className="mt-6 text-base leading-relaxed text-foreground/90"><span className="eyebrow mr-2">{t("whyLabel")}</span>{whyText(cur)}</p>
          {(trendText || topText) && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{trendText} {topText}</p>}
          <p className="mt-4 font-mono text-[10px] leading-relaxed text-muted-foreground">{t("caveat", minActive)}</p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <Stat label={t("detections")} value={Math.round(cur.count).toLocaleString()} tone="fire" />
          <Stat label={t("medianOf", sh[cur.mon - 1] ?? "")} value={Math.round(cur.median).toLocaleString()} />
          <Stat label={t("xMedian")} value={cur.band === "No baseline" ? "—" : cur.xMedian.toFixed(2)} tone="fire" />
          <Stat label={t("score")} value={cur.band === "No baseline" ? "—" : cur.score.toFixed(2)} />
          <Stat label={t("rank")} value={cur.of ? t("rankVal", cur.rank, cur.of) : "—"} />
          <Stat label={t("confidence")} value={t("conf_" + conf)} tone="sat" />
          <div className="col-span-full font-mono text-[10px] text-muted-foreground">{cur.calibrated ? t("calNote", cut) : t("obsNote")}</div>
          <div className="col-span-full font-mono text-[10px] text-muted-foreground">{t("confBasis")}: {confNotes.join(" · ")}</div>
        </div>
      </div>}

      {/* Priority watchlist */}
      {cur && watch.length > 0 && <div className="mt-16 border-t border-border pt-10">
        <div className="eyebrow">{t("wlTitle")}</div>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{t("wlSub", mn[cur.mon - 1] ?? "", cur.year)}</p>
        <ol className="mt-5 grid max-w-3xl gap-2">
          {watch.map((w, i) => <li key={w.name}><button onClick={() => setArea(`div:${w.name}`)} className="flex w-full items-center gap-4 rounded-sm border border-border px-4 py-2.5 text-left hover:border-fire">
            <span className="w-6 font-mono text-xs text-muted-foreground">{i + 1}</span><span className="flex-1 font-display text-base">{dn(w.name)}</span>
            <span className={`font-mono text-xs ${bandTone[w.r.band]}`}>{t("band_" + w.r.band)}</span>
            <span className="w-16 text-right font-mono text-xs text-muted-foreground">{scored(w.r.band) ? `${w.r.xMedian.toFixed(1)}×` : Math.round(w.r.count)}</span></button></li>)}
        </ol>
      </div>}

      {/* Fire Fingerprint */}
      <div className="mt-16 border-t border-border pt-10">
        <div className="eyebrow">{t("fpTitle")}</div>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{t("fpSub")}</p>
        <div className="mt-6 grid items-center gap-8 lg:grid-cols-[380px_1fr]">
          <Fingerprint series={[
            { label: `${t("fpTypical", y0, y1)} · ${areaName}`, v: typical, color: "var(--fire)", fill: true },
            ...(cur ? [{ label: `${t("fpYear", cur.year)} · ${areaName}`, v: yearProf, color: "var(--sat)" }] : []),
            ...(cmpProf ? [{ label: `${t("fpTypical", y0, y1)} · ${nameOf(cmp)}`, v: cmpProf, color: "#fde047", dash: true }] : []),
          ]} />
          <div>
            <p className="text-base text-foreground/90">{peakText}</p>
            <label className="mt-5 block font-mono text-[10px] uppercase text-muted-foreground">{t("fpCompare")}
              <select value={cmp} onChange={(e) => setCmp(e.target.value)} className={`${inputCls} mt-1 max-w-xs`}>
                <option value="none">{t("fpNone")}</option>
                {area !== "all" && <option value="all">{t("whole")}</option>}
                {DIVISIONS.filter((d) => area !== `div:${d.name}`).map((d) => <option key={d.name} value={`div:${d.name}`}>{t("divName", dn(d.name))}</option>)}
              </select>
            </label>
          </div>
        </div>
      </div>

      <Method validation={validation} cut={cut} />
      <p className="mt-12 font-mono text-[10px] text-muted-foreground">{t("indep")}</p>
    </section>
  );
}

function Fingerprint({ series }: { series: { label: string; v: number[]; color: string; dash?: boolean; fill?: boolean }[] }) {
  const { lang } = useT();
  const C = 150, R = 112;
  const pt = (i: number, f: number) => { const a = (i / 12) * 2 * Math.PI - Math.PI / 2; return [C + Math.cos(a) * R * f, C + Math.sin(a) * R * f] as const; };
  const poly = (v: number[]) => { const mx = Math.max(1, ...v); return v.map((x, i) => pt(i, Math.sqrt(Math.max(0, x) / mx)).map((n) => n.toFixed(1)).join(",")).join(" "); };
  return <div>
    <svg viewBox="0 0 300 300" className="mx-auto w-full max-w-[380px]" role="img" aria-label="Fire Fingerprint">
      {[0.25, 0.5, 0.75, 1].map((f) => <circle key={f} cx={C} cy={C} r={R * f} fill="none" stroke="var(--border)" strokeWidth={0.7} />)}
      {M12.map((i) => { const [x, y] = pt(i, 1), [lx, ly] = pt(i, 1.14); return <g key={i}>
        <line x1={C} y1={C} x2={x} y2={y} stroke="var(--border)" strokeWidth={0.5} />
        <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize={9} className="fill-muted-foreground" fontFamily="JetBrains Mono, ui-monospace, monospace">{SHORT[lang][i]}</text></g>; })}
      {series.map((s) => <polygon key={s.label} points={poly(s.v)} fill={s.fill ? s.color : "none"} fillOpacity={0.25} stroke={s.color} strokeWidth={2} strokeDasharray={s.dash ? "5 3" : undefined} strokeLinejoin="round" />)}
    </svg>
    <ul className="mt-3 space-y-1 font-mono text-[10px] text-muted-foreground">{series.map((s) => <li key={s.label} className="flex items-center gap-2"><span className="inline-block h-0.5 w-5" style={{ background: s.color }} />{s.label}</li>)}</ul>
  </div>;
}

function Meter({ score, active }: { score: number; active: boolean }) {
  const { t } = useT();
  const lo = -0.5, hi = 4, pos = (v: number) => `${((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * 100}%`;
  return <div className="mt-5" role="img" aria-label={active ? `${t("score")} ${score.toFixed(2)}` : t("band_No baseline")}>
    <div className="relative flex h-2 overflow-hidden rounded-full">
      <span className="bg-ok/70" style={{ width: pos(1.5) }} /><span className="bg-fire/80" style={{ width: `calc(${pos(3)} - ${pos(1.5)})` }} /><span className="flex-1 bg-lava" />
    </div>
    {active && <div className="relative h-3"><span className="absolute top-0 h-3 w-0.5 bg-foreground" style={{ left: pos(score) }} /></div>}
    <div className="mt-1 flex justify-between font-mono text-[9px] uppercase text-muted-foreground"><span>{t("meterNormal")}</span><span>{t("meterElev")}</span><span>{t("meterExt")}</span></div>
  </div>;
}

function Method({ validation: v, cut }: { validation: Validation; cut: string }) {
  const { t, lang } = useT();
  const [img, setImg] = useState(true);
  return <div className="mt-16 border-t border-border pt-10">
    <div className="eyebrow">{t("methodTitle")}</div>
    <ol className="mt-4 max-w-3xl list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
      <li>{t("m1")}</li><li>{t("m2")}</li><li>{t("m3", cut)}</li><li>{t("m4")}</li>
    </ol>
    <div className="mt-6 flex max-w-4xl flex-wrap items-stretch gap-3 font-mono text-[11px]" aria-label={t("methodTitle")}>
      <div className="flex flex-col gap-2"><span className="rounded-sm border border-border px-3 py-2 text-muted-foreground">{t("dgModis")}</span><span className="rounded-sm border border-border px-3 py-2 text-muted-foreground">{t("dgViirs")}</span></div>
      <span className="self-center text-fire">→</span><span className="flex max-w-[200px] items-center rounded-sm border border-border px-3 py-2 text-muted-foreground">{t("dgRatio")}</span>
      <span className="self-center text-fire">→</span><span className="flex max-w-[220px] items-center rounded-sm border border-border px-3 py-2 text-muted-foreground">{t("dgConvert", cut)}</span>
      <span className="self-center text-fire">→</span><span className="flex max-w-[180px] items-center rounded-sm border border-fire px-3 py-2 text-fire">{t("dgOne")}</span>
    </div>
    {v.all ? <>
      <div className="mt-8 grid grid-cols-2 gap-8 sm:grid-cols-4">
        <Stat label={t("vR2")} value={v.all.r2.toFixed(3)} tone="sat" />
        <Stat label={t("vMae")} value={Math.round(v.all.mae).toLocaleString()} />
        <Stat label={t("vBias")} value={`${v.all.bias_pct.toFixed(1)}%`} />
        {v.peak && <Stat label={t("vR2Peak")} value={v.peak.r2.toFixed(3)} />}
      </div>
      <p className="mt-4 max-w-3xl font-mono text-[10px] text-muted-foreground">{t("vNote")}</p>
    </> : <p className="mt-6 font-mono text-xs text-muted-foreground">{t("vMissing")}</p>}
    {v.ratioByMonth && <div className="mt-6 grid max-w-3xl grid-cols-6 gap-2 sm:grid-cols-12">{M12.map((i) => <div key={i} className="text-center font-mono text-[10px]"><div className="text-muted-foreground">{SHORT[lang][i]}</div><div className="text-sat">{(v.ratioByMonth![String(i + 1)] ?? NaN).toFixed(2)}</div></div>)}</div>}
    {img && <img src="/data/validation.png" alt="Before and after harmonization plot" onError={() => setImg(false)} className="mt-8 w-full max-w-4xl rounded-sm border border-border bg-white" />}
  </div>;
}
