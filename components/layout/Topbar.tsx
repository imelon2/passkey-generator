"use client";

export default function Topbar() {
  return (
    <div className="sticky top-0 z-20 border-b bg-white/70 dark:bg-slate-950/50 backdrop-blur">
      <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">WebAuthn Passkey Generator</div>
      </div>
    </div>
  );
}


