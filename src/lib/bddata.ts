// Real FireLens data (NASA FIRMS MODIS + VIIRS, harmonized in Colab).
// Files are read from /public/data/: monthly_cells.json (required), validation.json (optional).
export type Cell = { cell_lat: number; cell_lon: number; month: string; count_harmonized: number; source_flag: "observed" | "calibrated" };
export type AOI = { south: number; north: number; west: number; east: number };
export type Band = "Normal" | "Elevated" | "Extreme" | "Low activity" | "No baseline";
export type Row = {
  key: string; year: number; mon: number; count: number; calibrated: boolean;
  median: number; xMedian: number; score: number; band: Band; confidence: "High" | "Medium" | "Low"; rank: number; of: number; why: string;
};
export type Metrics = { r2: number; corr?: number; bias_pct: number; mae: number };
export type Validation = { all: Metrics | null; peak: Metrics | null; ratioByMonth: Record<string, number> | null; ratioSingle: number | null; cut: string | null };

export const PRESETS: { id: string; name: string; aoi: AOI }[] = [
  { id: "all", name: "Whole Bangladesh", aoi: { south: 20.5, north: 26.75, west: 88, east: 92.75 } },
  { id: "se", name: "South-east hills (Chattogram)", aoi: { south: 21, north: 23.75, west: 91.75, east: 92.75 } },
  { id: "ne", name: "North-east (Sylhet)", aoi: { south: 24, north: 25.25, west: 91, east: 92.5 } },
  { id: "centre", name: "Central (Madhupur)", aoi: { south: 23.5, north: 25, west: 89.75, east: 91 } },
  { id: "sw", name: "South-west (Sundarbans)", aoi: { south: 21.5, north: 22.75, west: 89, east: 90 } },
];

// Score parameters: identical to the Colab notebook.
const MIN_HISTORY = 5, FLOOR = 0.35, MIN_ACTIVE = 50, ELEVATED = 1.5, EXTREME = 3;
export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export async function loadBD(): Promise<{ cells: Cell[]; validation: Validation }> {
  const r = await fetch("/data/monthly_cells.json");
  if (!r.ok) throw new Error(`monthly_cells.json not found (HTTP ${r.status})`);
  const cells = (await r.json()) as Cell[];
  let raw: any = null;
  try { const v = await fetch("/data/validation.json"); if (v.ok) raw = await v.json(); } catch { /* optional */ }
  const old = raw?.r2 != null ? { r2: raw.r2, corr: raw.corr, bias_pct: raw.bias_pct, mae: raw.mae } : null;
  return { cells, validation: { all: raw?.validation_all ?? old, peak: raw?.validation_peak_feb_apr ?? null,
    ratioByMonth: raw?.ratio_by_month ?? null, ratioSingle: raw?.ratio_single ?? raw?.ratio ?? null, cut: raw?.calibration_start ?? null } };
}

const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? (s[m] ?? 0) : ((s[m - 1] ?? 0) + (s[m] ?? 0)) / 2; };

export function monthKeys(cells: Cell[]) {
  let lo = "9999-99", hi = "0000-00";
  for (const c of cells) { if (c.month < lo) lo = c.month; if (c.month > hi) hi = c.month; }
  const out: string[] = []; let [y = 0, m = 1] = lo.split("-").map(Number);
  while (`${y}-${String(m).padStart(2, "0")}` <= hi) { out.push(`${y}-${String(m).padStart(2, "0")}`); if (++m > 12) { m = 1; y++; } }
  return out;
}

export function observedFrom(cells: Cell[]) { // first month with directly observed VIIRS data
  let k = "9999-99"; for (const c of cells) if (c.source_flag === "observed" && c.month < k) k = c.month; return k;
}

/** Sum cells inside the AOI per month, then score each month against the same calendar month in earlier years. */
export function analyse(cells: Cell[], months: string[], a: AOI) {
  const sums = new Map<string, number>(), inCells = new Set<string>(), allCells = new Set<string>();
  for (const c of cells) {
    const id = `${c.cell_lat},${c.cell_lon}`; allCells.add(id);
    const la = c.cell_lat + 0.125, lo = c.cell_lon + 0.125;
    if (la < a.south || la > a.north || lo < a.west || lo > a.east) continue;
    inCells.add(id); sums.set(c.month, (sums.get(c.month) ?? 0) + c.count_harmonized);
  }
  const cut = observedFrom(cells);
  const minActive = Math.max(10, Math.round(MIN_ACTIVE * inCells.size / Math.max(1, allCells.size)));
  const counts = months.map((k) => sums.get(k) ?? 0);
  const rows: Row[] = months.map((key, i) => {
    const [year = 0, mon = 1] = key.split("-").map(Number), count = counts[i] ?? 0, calibrated = key < cut;
    const prev = months.map((k, j) => ({ k, j })).filter(({ k, j }) => j < i && +k.slice(5) === mon).map(({ j }) => counts[j] ?? 0);
    const base = { key, year, mon, count, calibrated, median: 0, xMedian: 0, score: 0, rank: 0, of: 0, why: "" };
    if (prev.length < MIN_HISTORY) return { ...base, band: "No baseline" as Band, confidence: "Low" as const, why: `Not enough history for ${MONTH_NAMES[mon - 1]} (needs ${MIN_HISTORY} earlier years).` };
    const lp = prev.map((v) => Math.log1p(v)), ml = median(lp), mad = median(lp.map((v) => Math.abs(v - ml)));
    const score = (Math.log1p(count) - ml) / Math.max(1.4826 * mad, FLOOR), med = Math.expm1(ml);
    const band: Band = Math.max(med, count) < minActive ? "Low activity" : score < ELEVATED ? "Normal" : score < EXTREME ? "Elevated" : "Extreme";
    const confidence = calibrated ? (prev.length >= 8 ? "Medium" : "Low") : prev.length >= 10 ? "High" : "Medium";
    const rank = prev.filter((v) => v > count).length + 1, x = count / Math.max(med, 1), name = MONTH_NAMES[mon - 1];
    const why = band === "Low activity" ? `Only ${Math.round(count)} detections in ${name}; too few to judge. Typical is about ${Math.round(med)}.`
      : band === "Normal" ? `${x.toFixed(1)}x the median for ${name}; within the normal range.`
      : `${x.toFixed(1)}x the median for ${name}; rank ${rank} of ${prev.length + 1} years.`;
    return { ...base, median: med, xMedian: x, score, band, confidence, rank, of: prev.length + 1, why };
  });
  return { rows, nCells: inCells.size, cut, minActive };
}

export function toCSV(rows: Row[]) {
  const head = "month,count_harmonized,source,median_same_month,x_median,score,band,confidence";
  return [head, ...rows.map((r) => [r.key, r.count.toFixed(1), r.calibrated ? "calibrated_from_MODIS" : "observed_VIIRS",
    r.median.toFixed(1), r.xMedian.toFixed(2), r.score.toFixed(2), r.band, r.confidence].join(","))].join("\n");
}

export function cellTotals(cells: Cell[], y0: number, y1: number) {
  const t = new Map<string, { lat: number; lon: number; n: number }>();
  for (const c of cells) { const y = +c.month.slice(0, 4); if (y < y0 || y > y1) continue;
    const id = `${c.cell_lat},${c.cell_lon}`, e = t.get(id) ?? { lat: c.cell_lat, lon: c.cell_lon, n: 0 }; e.n += c.count_harmonized; t.set(id, e); }
  return [...t.values()];
}

export const viridis = (t: number) => { // colorblind-safe ramp, t in 0..1
  const s = [[68, 1, 84], [59, 82, 139], [33, 145, 140], [94, 201, 98], [253, 231, 37]], x = Math.min(1, Math.max(0, t)) * 4, i = Math.min(3, Math.floor(x)), f = x - i, a = s[i] ?? [0, 0, 0], b = s[i + 1] ?? a;
  return `rgb(${a.map((v, k) => Math.round(v + ((b[k] ?? v) - v) * f)).join(",")})`;
};
export { median as medianOf };
