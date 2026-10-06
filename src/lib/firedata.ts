// Demo dataset for FireLens. Deterministic (seeded) so SSR and client match.
export type Sensor = "MODIS" | "VIIRS";
export type Hotspot = {
  id: number; lat: number; lon: number; sensor: Sensor; intensity: number;
  confidence: number; region: string; current: boolean; emerging?: boolean; recurring?: boolean;
};

export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export type Region = {
  id: string; name: string; country: string; lat: number; lon: number; spread: number;
  weight: number; peak: string; band: [number, number]; current: number; average: number;
  anomaly: number; percentile: number; confidence: number; monthly: number[]; currentMonthly: number[];
  priority: number; twinYear: number; twinSim: number; recurrence: number; growth: number;
};

const mk = (r: Omit<Region, "currentMonthly">, boost: number[]): Region => ({
  ...r, currentMonthly: r.monthly.map((v, i) => Math.round(v * (boost[i] ?? 1))),
});

export const REGIONS: Region[] = [
  mk({ id: "amazonas", name: "Northern Amazonas", country: "Brazil", lat: -3.5, lon: -63, spread: 5, weight: 1.6,
    peak: "Aug–Oct", band: [520, 780], current: 1840, average: 650, anomaly: 94, percentile: 99, confidence: 94,
    monthly: [60, 40, 35, 40, 70, 180, 420, 650, 720, 480, 190, 90], priority: 94, twinYear: 2010, twinSim: 86, recurrence: 18, growth: 184 },
    [1, 1, 1.1, 1.2, 1.5, 1.9, 2.1, 2.8, 2.4]),
  mk({ id: "para", name: "Pará", country: "Brazil", lat: -5, lon: -52, spread: 4, weight: 1.3,
    peak: "Aug–Nov", band: [480, 700], current: 1420, average: 590, anomaly: 88, percentile: 98, confidence: 92,
    monthly: [50, 35, 30, 35, 60, 150, 360, 590, 680, 560, 260, 110], priority: 88, twinYear: 2015, twinSim: 81, recurrence: 17, growth: 140 },
    [1, 1, 1, 1.2, 1.4, 1.7, 2, 2.4, 2.1]),
  mk({ id: "matogrosso", name: "Mato Grosso", country: "Brazil", lat: -13, lon: -56, spread: 4, weight: 1.1,
    peak: "Jul–Sep", band: [600, 900], current: 1310, average: 760, anomaly: 79, percentile: 95, confidence: 90,
    monthly: [40, 30, 30, 50, 120, 300, 620, 760, 700, 320, 120, 60], priority: 79, twinYear: 2012, twinSim: 83, recurrence: 19, growth: 72 },
    [1, 1, 1, 1.1, 1.2, 1.4, 1.6, 1.7, 1.5]),
  mk({ id: "california", name: "California", country: "United States", lat: 37.5, lon: -120.5, spread: 3, weight: 0.8,
    peak: "Aug–Oct", band: [450, 730], current: 1240, average: 620, anomaly: 87, percentile: 99, confidence: 94,
    monthly: [10, 8, 12, 25, 60, 180, 420, 620, 680, 510, 140, 30], priority: 76, twinYear: 2020, twinSim: 79, recurrence: 14, growth: 81 },
    [1, 1, 1, 1.4, 1.8, 2, 2, 2.1, 1.8]),
  mk({ id: "congo", name: "Congo Basin South", country: "DR Congo / Angola", lat: -9, lon: 21, spread: 7, weight: 1.8,
    peak: "Jun–Aug", band: [2200, 3100], current: 2900, average: 2650, anomaly: 41, percentile: 68, confidence: 91,
    monthly: [80, 70, 90, 200, 900, 2400, 2900, 2650, 1600, 500, 150, 90], priority: 52, twinYear: 2018, twinSim: 88, recurrence: 20, growth: 9 },
    [1, 1, 1, 1, 1, 1.05, 1.1, 1.1]),
  mk({ id: "sahel", name: "Sudanian Savanna", country: "Nigeria / CAR", lat: 9, lon: 15, spread: 8, weight: 1.4,
    peak: "Dec–Feb", band: [1800, 2600], current: 410, average: 380, anomaly: 22, percentile: 54, confidence: 89,
    monthly: [2300, 2100, 1400, 600, 200, 80, 40, 30, 60, 300, 1100, 2200], priority: 31, twinYear: 2009, twinSim: 77, recurrence: 20, growth: 4 },
    [1, 1, 1, 1, 1, 1, 1, 1.08]),
  mk({ id: "siberia", name: "Sakha (Yakutia)", country: "Russia", lat: 63, lon: 125, spread: 8, weight: 0.9,
    peak: "Jun–Aug", band: [300, 600], current: 1680, average: 520, anomaly: 91, percentile: 99, confidence: 88,
    monthly: [0, 0, 5, 30, 160, 480, 600, 520, 140, 20, 0, 0], priority: 84, twinYear: 2021, twinSim: 84, recurrence: 9, growth: 340 },
    [1, 1, 1, 1.5, 2, 2.6, 2.9, 3.2]),
  mk({ id: "canada", name: "Northern Alberta", country: "Canada", lat: 57, lon: -115, spread: 6, weight: 0.7,
    peak: "Jun–Aug", band: [200, 450], current: 760, average: 330, anomaly: 83, percentile: 97, confidence: 90,
    monthly: [0, 0, 5, 40, 160, 380, 450, 330, 120, 20, 0, 0], priority: 71, twinYear: 2023, twinSim: 82, recurrence: 11, growth: 210 },
    [1, 1, 1, 1.6, 2.1, 2, 1.9, 2.3]),
  mk({ id: "australia", name: "Northern Territory", country: "Australia", lat: -15, lon: 133, spread: 7, weight: 1.0,
    peak: "Jun–Oct", band: [900, 1400], current: 980, average: 1100, anomaly: 18, percentile: 41, confidence: 93,
    monthly: [100, 60, 80, 200, 500, 900, 1200, 1100, 1300, 1000, 500, 200], priority: 24, twinYear: 2016, twinSim: 85, recurrence: 20, growth: -6 },
    [1, 1, 1, 1, 1, 0.95, 0.9, 0.89]),
  mk({ id: "borneo", name: "Kalimantan", country: "Indonesia", lat: -1, lon: 113, spread: 4, weight: 0.8,
    peak: "Aug–Oct", band: [400, 800], current: 880, average: 560, anomaly: 66, percentile: 88, confidence: 86,
    monthly: [30, 25, 40, 50, 80, 160, 330, 560, 820, 600, 150, 40], priority: 63, twinYear: 2019, twinSim: 80, recurrence: 16, growth: 57 },
    [1, 1, 1, 1, 1.2, 1.3, 1.4, 1.57]),
  mk({ id: "med", name: "Greece & Balkans", country: "Greece", lat: 40, lon: 22, spread: 3, weight: 0.4,
    peak: "Jul–Aug", band: [80, 180], current: 290, average: 130, anomaly: 81, percentile: 96, confidence: 87,
    monthly: [5, 5, 10, 15, 25, 60, 150, 130, 70, 20, 5, 5], priority: 58, twinYear: 2007, twinSim: 78, recurrence: 13, growth: 123 },
    [1, 1, 1, 1.2, 1.5, 1.9, 2, 2.2]),
];

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function severity(score: number) {
  if (score >= 90) return "Extreme";
  if (score >= 75) return "Severe";
  if (score >= 55) return "High";
  if (score >= 35) return "Elevated";
  return "Normal";
}

/** Generate hotspots for a given year (2002–2026). Deterministic. */
export function hotspotsForYear(year: number, count = 900): Hotspot[] {
  const r = rng(year * 97 + 13);
  const total = REGIONS.reduce((a, b) => a + b.weight, 0);
  const t = (year - 2002) / 24; // 0..1 progression
  const out: Hotspot[] = [];
  let id = 0;
  for (const reg of REGIONS) {
    const growth = 1 + (reg.growth / 100) * Math.pow(t, 3);
    const n = Math.round((count * reg.weight) / total * Math.max(0.3, growth) * (0.75 + r() * 0.5));
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * reg.spread;
      const sensor: Sensor = year < 2012 ? "MODIS" : r() > 0.45 ? "VIIRS" : "MODIS";
      out.push({
        id: id++, region: reg.name,
        lat: reg.lat + Math.sin(a) * d * 0.7, lon: reg.lon + Math.cos(a) * d,
        sensor, intensity: Math.min(1, 0.25 + r() * 0.75 * (reg.anomaly / 80)),
        confidence: Math.round(70 + r() * 29), current: year === 2026,
        emerging: reg.growth > 150, recurring: reg.recurrence >= 17,
      });
    }
  }
  return out;
}

export const project = (lat: number, lon: number) => ({ x: ((lon + 180) / 360) * 100, y: ((90 - lat) / 180) * 100 });
