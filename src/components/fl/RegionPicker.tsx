import { REGIONS } from "@/lib/firedata";

export function RegionPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {REGIONS.map((r) => (
        <button key={r.id} onClick={() => onChange(r.id)}
          className={`rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-all ${value === r.id ? "border-fire bg-fire/15 text-fire" : "border-border text-muted-foreground hover:border-sat hover:text-foreground"}`}>
          {r.name}
        </button>
      ))}
    </div>
  );
}
