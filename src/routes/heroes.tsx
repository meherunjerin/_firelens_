import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowUpRight, Maximize2 } from "lucide-react";
import { SiteNav, Footer } from "@/components/fl/SiteNav";
import { Button } from "@/components/ui/button";

// Change this one line if your game lives at another address.
const GAME_URL = "https://hotspot-hero-orbit.lovable.app/hotspot-heroes";

export const Route = createFileRoute("/heroes")({
  head: () => ({ meta: [
    { title: "Hotspot Heroes — FireLens" },
    { name: "description", content: "Five quick missions about satellites, fire hotspots and fire patterns." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { property: "og:title", content: "Hotspot Heroes — FireLens" },
    { property: "og:description", content: "Learn how satellites find fires with five mini missions." },
  ] }),
  component: Heroes,
});

function Heroes() {
  const box = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const full = () => { void box.current?.requestFullscreen?.(); };
  return (
    <div><SiteNav />
      <div className="mx-auto max-w-[1400px] px-4 pb-20 pt-24 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow">Learn · NASA fire science</div>
            <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">Hotspot <span className="text-fire-gradient">Heroes</span></h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-sm text-xs" onClick={full}><Maximize2 /> Full screen</Button>
            <Button asChild size="sm" className="rounded-sm text-xs"><a href={GAME_URL} target="_blank" rel="noreferrer">Open in new tab <ArrowUpRight /></a></Button>
          </div>
        </div>
        <div ref={box} className="relative mt-5 overflow-hidden rounded-sm border border-border bg-background" style={{ height: "calc(100vh - 11rem)", minHeight: 620 }}>
          {!loaded && <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-muted-foreground">Loading game…</div>}
          <iframe title="Hotspot Heroes game" src={GAME_URL} onLoad={() => setLoaded(true)} allow="fullscreen; autoplay; clipboard-write" allowFullScreen
            className="absolute inset-0 block h-full w-full border-0" />
        </div>
        <p className="mt-3 font-mono text-[11px] text-muted-foreground">Blank or cut-off? Press “Full screen” or “Open in new tab”. Game data is simplified for learning.</p>
      </div>
      <Footer />
    </div>
  );
}
