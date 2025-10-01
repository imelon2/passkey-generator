"use client";
import { create } from "zustand";

interface PresetBusState {
  pendingCreationPreset: Partial<PublicKeyCredentialCreationOptions> | null;
  setCreationPreset: (p: Partial<PublicKeyCredentialCreationOptions> | null) => void;
}

export const usePresetBus = create<PresetBusState>((set) => ({
  pendingCreationPreset: null,
  setCreationPreset: (p) => set({ pendingCreationPreset: p }),
}));


