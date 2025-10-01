"use client";
import { create } from "zustand";
import { RunResult } from "@/lib/types";

type AnyRun = RunResult<any, any>;

interface HistoryState {
  items: AnyRun[];
  push: (run: AnyRun) => void;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  items: [],
  push: (run) => set((s) => ({ items: [run, ...s.items].slice(0, 50) })),
  clear: () => set({ items: [] }),
}));


