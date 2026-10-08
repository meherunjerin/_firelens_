import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNav, Footer } from "@/components/fl/SiteNav";
import { Hero } from "@/components/fl/Hero";
import { Story } from "@/components/fl/Story";
import { FireMap } from "@/components/fl/FireMap";
import { Harmonization } from "@/components/fl/Harmonization";
import { FireDNA } from "@/components/fl/FireDNA";
import { Anomaly } from "@/components/fl/Anomaly";
import { Response } from "@/components/fl/Response";
import { REGIONS } from "@/lib/firedata";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "FireLens — Is this fire normal?" },
    { name: "description", content: "Harmonized MODIS + VIIRS fire intelligence: anomalies, explanations and responder priorities." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { property: "og:title", content: "FireLens — Is this fire normal?" },
    { property: "og:description", content: "Harmonized MODIS + VIIRS fire intelligence for NASA Space Apps 2026." },
  ] }),
  component: Index,
});

function Index() {
  const [focus, setFocus] = useState<string | null>(null);
  const [rid, setRid] = useState("amazonas");
  const region = REGIONS.find((r) => r.id === rid) ?? REGIONS[0];
  if (!region) return null;
  return (
    <div>
      <SiteNav /><Hero /><Story /><FireMap focus={focus} setFocus={setFocus} /><Harmonization />
      <FireDNA region={region} setRegion={setRid} /><Anomaly region={region} setRegion={setRid} /><Response /><Footer />
    </div>
  );
}
