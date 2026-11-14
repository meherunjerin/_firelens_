import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { analyse, analyseZones, boxInside, sensorAgreement, monthKeys, PRESETS, toCSV, type Cell } from "@/lib/bddata";

const cells = JSON.parse(readFileSync("src/test/fixture-cells.json", "utf8")) as Cell[];
const months = monthKeys(cells);
const { rows } = analyse(cells, months, boxInside(PRESETS[0]!.aoi));
const at = (k: string) => rows.find((r) => r.key === k)!;

describe("bddata", () => {
  it("has no baseline before 5 earlier years exist", () => expect(at("2015-03").band).toBe("No baseline"));
  it("flags a spike and marks the pre-VIIRS period as calibrated", () => {
    expect(["Elevated", "Extreme"]).toContain(at("2023-04").band);
    expect(at("2014-03").calibrated).toBe(true);
    expect(at("2020-03").calibrated).toBe(false);
  });
  it("labels off-season months as Low activity and exports CSV", () => {
    expect(at("2022-07").band).toBe("Low activity");
    expect(toCSV(rows).split("\n")).toHaveLength(rows.length + 1);
  });
});

describe("zones", () => {
  it("finds the busiest season and classifies cells", () => {
    const z = analyseZones(cells, months, 2012, 2025);
    expect(z.season).toHaveLength(3);
    expect(z.years).toBeGreaterThanOrEqual(8);
    expect(z.zones.some((c) => c.kind === "recurring" || c.kind === "both")).toBe(true);
    expect(z.zones.every((c) => c.ratio >= 0)).toBe(true);
  });
});

describe("report helpers", () => {
  it("adds source notes to the CSV", () => {
    const lines = toCSV(rows, ["# a", "# b"]).split("\n");
    expect(lines.slice(0, 2)).toEqual(["# a", "# b"]);
    expect(lines).toHaveLength(rows.length + 3);
  });
  it("sensor agreement needs raw columns and is high for correlated sensors", () => {
    expect(sensorAgreement(cells, () => true, "2012-01")).toBeNull();
    const raw = cells.map((c) => ({ ...c, modis: c.count_harmonized / 4, viirs: c.count_harmonized }));
    expect(sensorAgreement(raw, () => true, "2012-01")!).toBeGreaterThan(0.99);
  });
});
