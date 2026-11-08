import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { analyse, boxInside, monthKeys, PRESETS, toCSV, type Cell } from "@/lib/bddata";

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
