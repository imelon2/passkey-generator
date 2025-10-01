import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border shadow-soft bg-white dark:bg-slate-900", className)}>
      {children}
    </div>
  );
}


