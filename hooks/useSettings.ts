"use client";
import { create } from "zustand";

export interface SettingsState {
  timeFormat: "relative" | "absolute";
  jsonIndent: number;
  guardConfirm: boolean;
  set: (p: Partial<SettingsState>) => void;
}

const defaultState: SettingsState = {
  timeFormat: "relative",
  jsonIndent: 2,
  guardConfirm: true,
  set: () => {},
};

export const useSettings = create<SettingsState>((set) => ({
  ...defaultState,
  set: (p) => set(p),
}));


