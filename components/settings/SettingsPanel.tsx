"use client";
import { useSettings } from "@/hooks/useSettings";

export default function SettingsPanel() {
  const { timeFormat, jsonIndent, guardConfirm, set } = useSettings();
  return (
    <div className="grid gap-4 max-w-2xl">
      <div className="rounded-2xl border p-4">
        <div className="text-sm font-semibold mb-3">표시</div>
        <div className="grid sm:grid-cols-3 gap-3">
          <select className="h-10 px-3 rounded-xl border" value={timeFormat} onChange={(e) => set({ timeFormat: e.target.value as any })}>
            <option value="relative">상대 시간</option>
            <option value="absolute">절대 시간</option>
          </select>
          <input className="h-10 px-3 rounded-xl border" type="number" min={0} max={8} value={jsonIndent} onChange={(e) => set({ jsonIndent: Number(e.target.value) })} />
          <select className="h-10 px-3 rounded-xl border" value={String(guardConfirm)} onChange={(e) => set({ guardConfirm: e.target.value === "true" })}>
            <option value="true">실행 전 확인: 켜기</option>
            <option value="false">실행 전 확인: 끄기</option>
          </select>
        </div>
      </div>
      <div className="rounded-2xl border p-4">
        <div className="text-sm font-semibold mb-3">스토리지</div>
        <div className="flex gap-3">
          <button className="h-10 px-4 rounded-xl border">로컬 스토리지 초기화</button>
          <button className="h-10 px-4 rounded-xl border">내보내기 (JSON)</button>
        </div>
      </div>
    </div>
  );
}


