import { createFileRoute } from "@tanstack/react-router";
import { SiteNav, Footer } from "@/components/fl/SiteNav";
import { Harmonization } from "@/components/fl/Harmonization";

export const Route = createFileRoute("/data")({
  head: () => ({ meta: [
    { title: "About the Data — FireLens" },
    { name: "description", content: "How FireLens harmonizes MODIS and VIIRS fire observations." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { property: "og:title", content: "About the Data — FireLens" },
    { property: "og:description", content: "How FireLens harmonizes MODIS and VIIRS fire observations." },
  ] }),
  component: () => (
    <div><SiteNav /><div className="pt-24"><Harmonization />
      <p className="mx-auto max-w-3xl px-6 pb-24 text-muted-foreground">FireLens does not claim to predict every wildfire. It identifies when observed fire activity differs significantly from historical behavior. Values shown are demo data.</p>
    </div><Footer /></div>
  ),
});
