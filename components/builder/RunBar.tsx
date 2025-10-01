"use client";
import { Button } from "@/components/ui/button";

export default function RunBar({ label, onRun, status, disabled }: { label: string; onRun: () => void; status: "ready" | "validating" | "running" | "done"; disabled?: boolean }) {
  const badge = {
    ready: "bg-emerald-100 text-emerald-700",
    validating: "bg-amber-100 text-amber-800",
    running: "bg-blue-100 text-blue-800",
    done: "bg-slate-100 text-slate-800",
  }[status];
  return (
    <div className="flex items-center justify-between">
      <div className={`text-xs px-2 py-1 rounded-md border ${badge}`}>{status}</div>
      <Button onClick={onRun} disabled={disabled}>{label}</Button>
    </div>
  );
}


