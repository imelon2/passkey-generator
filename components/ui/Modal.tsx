"use client";
import { ReactNode, useEffect, useState } from "react";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, actions }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; actions?: ReactNode }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      window.addEventListener("keydown", onKey);
      // animate in
      setVisible(false);
      const id = requestAnimationFrame(() => setVisible(true));
      return () => {
        window.removeEventListener("keydown", onKey);
        cancelAnimationFrame(id);
      };
    }
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center p-4">
        <div
          className={`w-full max-w-3xl rounded-2xl bg-white shadow-lg border overflow-hidden transform transition-all duration-200 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="text-sm font-semibold">{title}</div>
            <button aria-label="Close" className="inline-flex items-center justify-center rounded-md p-1 text-slate-600 hover:bg-muted" onClick={onClose}>
              <X className="size-4" />
            </button>
          </div>
          <div className="p-4 max-h-[70vh] overflow-auto text-sm">
            {children}
          </div>
          {actions ? <div className="px-4 py-3 border-t bg-muted/30">{actions}</div> : null}
        </div>
      </div>
    </div>
  );
}


