"use client";
import { usePresets } from "@/hooks/usePresets";
import { Card } from "@/components/ui/Card";
import { usePresetBus } from "@/hooks/usePresetBus";
import { useRouter } from "next/navigation";

export default function PresetsGrid() {
  const { creationPresets } = usePresets();
  const setPreset = usePresetBus((s) => s.setCreationPreset);
  const router = useRouter();
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {creationPresets.map((p) => (
        <Card key={p.id} className="p-4">
          <div className="font-medium mb-1">{p.name}</div>
          <div className="text-xs text-muted-foreground mb-3">{p.desc}</div>
          <pre className="text-xs rounded-lg border bg-muted/30 p-3 h-40 overflow-auto">{JSON.stringify(p.data, null, 2)}</pre>
          <button className="mt-3 h-9 px-3 rounded-xl border w-full" onClick={() => { setPreset(p.data); router.push("/create"); }}>Apply</button>
        </Card>
      ))}
    </div>
  );
}


