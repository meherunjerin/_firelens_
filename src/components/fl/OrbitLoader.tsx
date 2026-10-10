import { Satellite } from "lucide-react";

export function OrbitLoader({ label = "Acquiring Earth observation imagery" }: { label?: string }) {
  return <div role="status" className="flex flex-col items-center gap-4 text-sat"><div className="orbit-loader relative h-16 w-16 rounded-full border border-sat/25"><span className="absolute inset-4 rounded-full border border-sat/50" /><span className="loader-satellite absolute inset-0"><Satellite size={18} className="absolute -top-2 left-6" /></span></div><span className="text-center font-mono text-[10px]">{label}</span></div>;
}