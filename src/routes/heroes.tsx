import { createFileRoute } from "@tanstack/react-router";
import forest from "@/assets/forest-game.jpg";
import { SiteNav, Footer } from "@/components/fl/SiteNav";

export const Route = createFileRoute("/heroes")({
  head: () => ({ meta: [
    { title: "Hotspot Heroes — FireLens" },
    { name: "description", content: "Learn NASA fire science and save the forest." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { property: "og:title", content: "Hotspot Heroes — FireLens" },
    { property: "og:description", content: "Learn NASA fire science and save the forest." },
  ] }),
  component: () => (
    <div><SiteNav />
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <img src={forest} alt="Illustrated rainforest" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="relative px-6 text-center">
          <h1 className="text-5xl font-semibold">Hotspot <span className="text-fire-gradient">Heroes</span></h1>
          <p className="mt-4 text-muted-foreground">Learn NASA fire science. Save the forest. Missions coming soon.</p>
        </div>
      </section><Footer /></div>
  ),
});
