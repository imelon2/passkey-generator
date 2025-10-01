import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Alert({ variant = "error", title, children, onClose, className }: { variant?: "error" | "info" | "success" | "warning"; title?: string; children?: ReactNode; onClose?: () => void; className?: string }) {
  const styles = {
    error: "border-red-300 bg-red-50 text-red-800",
    info: "border-blue-300 bg-blue-50 text-blue-800",
    success: "border-emerald-300 bg-emerald-50 text-emerald-800",
    warning: "border-amber-300 bg-amber-50 text-amber-900",
  }[variant];
  return (
    <div className={cn("rounded-xl border px-4 py-3", styles, className)} role="alert" aria-live="assertive">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          {title ? <div className="font-semibold text-sm mb-0.5">{title}</div> : null}
          {children ? <div className="text-sm">{children}</div> : null}
        </div>
        {onClose ? (
          <button className="text-sm opacity-70 hover:opacity-100" onClick={onClose} aria-label="닫기">✕</button>
        ) : null}
      </div>
    </div>
  );
}


