"use client";
import { ReactNode } from "react";

export default function StepperModal({ open, step, onClose }: { open: boolean; step: 1 | 2 | 3; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-[520px] max-w-[92vw] rounded-2xl border bg-white dark:bg-slate-900 p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">진행 단계</h3>
          <button className="text-sm text-muted-foreground" onClick={onClose}>닫기</button>
        </div>
        <ol className="grid grid-cols-3 gap-2 text-xs mb-4">
          {[
            { id: 1, label: "요청 준비" },
            { id: 2, label: "OS/WebAuthn Prompt" },
            { id: 3, label: "결과 수신" },
          ].map((s) => (
            <li key={s.id} className={`p-2 rounded-lg border text-center ${step >= (s.id as number) ? "bg-brand-50 border-brand-200" : "bg-muted"}`}>{s.label}</li>
          ))}
        </ol>
        <div className="text-sm text-muted-foreground">
          {step === 1 && <p>요청을 검증하고 준비 중…</p>}
          {step === 2 && <p>브라우저/OS 프롬프트에서 지시에 따라 인증을 진행하세요.</p>}
          {step === 3 && <p>결과를 수신했습니다. 패널에서 JSON을 확인하세요.</p>}
        </div>
      </div>
    </div>
  );
}


