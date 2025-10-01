"use client";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { ReactNode } from "react";

export default function AppShell({ children, active }: { children: ReactNode; active: "create" | "get" | "presets" | "history" | "settings" }) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:block border-r bg-gradient-to-b from-brand-50/40 to-transparent dark:from-slate-800/30">
        <Sidebar active={active} />
      </aside>
      <main className="flex flex-col min-h-screen">
        <Topbar />
        <div className="w-full max-w-[1200px] mx-auto px-4 py-6 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}


