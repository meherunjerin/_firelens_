import { createFileRoute } from "@tanstack/react-router";
import { SiteNav, Footer } from "@/components/fl/SiteNav";
import { FireDNA } from "@/components/fl/FireDNA";
import { Anomaly } from "@/components/fl/Anomaly";
import { REGIONS } from "@/lib/firedata";
import { useState } from "react";

export const Route = createFileRoute("/firescope/$regionId")({
  head: () => ({ meta: [
    { title: "FireScope Region Detail — FireLens" },
    { name: "description", content: "Deep-dive fire intelligence for a single region." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { property: "og:title", content: "FireScope Region Detail — FireLens" },
    { property: "og:description", content: "Deep-dive fire intelligence for a single region." },
  ] }),
  component: Page,
});

function Page() {
  const { regionId } = Route.useParams();
  const [id, setId] = useState(regionId);
  const region = REGIONS.find((r) => r.id === id) ?? REGIONS[0];
  if (!region) return null;
  return <div><SiteNav /><div className="pt-16"><FireDNA region={region} setRegion={setId} /><Anomaly region={region} setRegion={setId} /></div><Footer /></div>;
}
