"use client";
import { Info } from "lucide-react";
import { ReactNode, useRef, useState } from "react";

export default function InfoTooltip({ content, ariaLabel }: { content: ReactNode; ariaLabel?: string }) {
  const [open, setOpen] = useState(false);
  const hideTimer = useRef<number | null>(null);

  const openNow = () => {
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setOpen(true);
  };

  const closeWithDelay = () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setOpen(false), 150);
  };
  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={openNow}
      onMouseLeave={closeWithDelay}
    >
      <button
        type="button"
        aria-label={ariaLabel || "Info"}
        className="ml-[2px] inline-flex items-center justify-center align-middle rounded-full border size-5 text-[11px] text-blue-600 border-blue-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
        onFocus={openNow}
        onBlur={closeWithDelay}
      >
        <Info className="size-3.5" />
      </button>
      {open ? (
        <div
          className="absolute z-50 left-0 top-full translate-y-[5px] w-[560px] max-w-[95vw] rounded-lg border bg-white p-3 text-xs shadow-lg transition-opacity duration-150"
          onMouseEnter={openNow}
          onMouseLeave={closeWithDelay}
        >
          <div className="prose prose-sm max-w-none font-normal">
            {content}
          </div>
        </div>
      ) : null}
    </span>
  );
}


