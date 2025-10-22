"use client";
import { Info } from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";

export default function InfoTooltip({ content, ariaLabel, label, buttonClassName }: { content: ReactNode; ariaLabel?: string; label?: ReactNode; buttonClassName?: string }) {
  const [open, setOpen] = useState(false);
  const hideTimer = useRef<number | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  const computeAndSetCoords = () => {
    const btn = btnRef.current;
    const tip = tooltipRef.current;
    if (!btn) return;
    const margin = 5;
    const rect = btn.getBoundingClientRect();
    const tipW = tip?.offsetWidth ?? 560; // fallback width
    const tipH = tip?.offsetHeight ?? 0;
    // Horizontal clamping
    let left = Math.min(Math.max(rect.left, 8), Math.max(8, window.innerWidth - tipW - 8));
    // Prefer below; if overflow bottom, place above when possible
    let top = rect.bottom + margin;
    const overflowBottom = top + tipH > window.innerHeight - 8;
    if (overflowBottom) {
      const aboveTop = rect.top - margin - tipH;
      if (aboveTop >= 8) top = aboveTop; // place above
      else top = Math.max(8, window.innerHeight - tipH - 8); // clamp inside
    }
    setCoords({ left, top });
  };

  useEffect(() => {
    if (!open) return;
    // After open, compute with actual tooltip size
    computeAndSetCoords();
    const onScroll = () => computeAndSetCoords();
    const onResize = () => computeAndSetCoords();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const openNow = () => {
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setOpen(true);
    // initial position; refined after mount
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) setCoords({ left: rect.left, top: rect.bottom + 5 });
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
        aria-label={ariaLabel || (typeof label === "string" ? label : "Info")}
        className={[
          label
            ? "ml-[2px] inline-flex items-center justify-center align-middle rounded-full border h-6 px-2 text-[11px] text-blue-600 border-blue-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
            : "ml-[2px] inline-flex items-center justify-center align-middle rounded-full border size-5 text-[11px] text-blue-600 border-blue-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300",
          buttonClassName || ""
        ].join(" ")}
        onFocus={openNow}
        onBlur={closeWithDelay}
        ref={btnRef}
      >
        <Info className="size-3.5" />
        {label ? <span className="ml-1 leading-none">{label}</span> : null}
      </button>
      {open ? (
        <div
          ref={tooltipRef}
          className="fixed z-50 w-[560px] max-w-[95vw] rounded-lg border bg-white p-3 text-xs shadow-lg transition-opacity duration-150"
          style={{ left: coords.left, top: coords.top }}
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

// Recompute position after tooltip mounts and on viewport changes
// Placed outside component body in the same file to avoid re-creation per render


