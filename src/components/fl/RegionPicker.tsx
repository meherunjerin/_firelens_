import { Button } from "@/components/ui/button";
import { REGIONS } from "@/lib/firedata";

export function RegionPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-x-1 gap-y-2 border-y border-border py-4">
      {REGIONS.map((r) => (
        <Button variant="ghost" size="sm" aria-pressed={value === r.id} key={r.id} onClick={() => onChange(r.id)}
          className={`rounded-sm border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-all ${value === r.id ? "border-fire bg-fire/15 text-fire" : "border-border text-muted-foreground hover:border-sat hover:text-foreground"}`}>
          {r.name}
        </Button>
      ))}
    </div>
  );
}
