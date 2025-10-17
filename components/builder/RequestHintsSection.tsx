"use client";
import React from "react";
import SectionCard from "./SectionCard";
import InfoTooltip from "@/components/ui/InfoTooltip";

export default function RequestHintsSection({ hints, onChange }: { hints?: string[]; onChange: (next?: string[]) => void }) {
  const values = ["hybrid", "security-key", "client-device"] as const;
  const isSelected = (h: string) => !!(hints || []).includes(h);
  const toggle = (h: string) => {
    const curr = hints || [];
    const next = isSelected(h) ? curr.filter((x) => x !== h) : [...curr, h];
    onChange(next.length ? next : undefined);
  };

  return (
    <SectionCard
      title={(
        <span className="inline-flex items-center align-middle">
          <span>Hints</span>
          <InfoTooltip
            ariaLabel="request.hints info"
            content={(
              <div>
                <p>UI hints for which authenticator UX to prefer during authentication. <a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialRequestOptions#hints" target="_blank" rel="noreferrer">[link]</a></p>
                <br/>
                <p>Values (order denotes preference):</p>
                <ul className="list-disc pl-4 mt-1">
                  <li><strong>security-key</strong>: Recommend using a separate physical security key.</li>
                  <li><strong>client-device</strong>: Recommend an authenticator available on the same device.</li>
                  <li><strong>hybrid</strong>: Recommend a general-purpose authenticator (e.g., phone) cross-device.</li>
                </ul>
                <br/>
                <p>Hints may override or be ignored depending on platform capabilities.</p>
                <br/>
                <p>
                  Specified hints may contradict hints provided in the <strong>transports</strong> option. When the provided hints contradict this option, the hints take precedence. Hints may also be ignored by the browser under specific circumstances (e.g., if a hinted authenticator type is not usable on the user's device).
                </p>
              </div>
            )}
          />
        </span>
      )}
    >
      <div className="flex flex-wrap gap-2">
        {values.map((h) => (
          <button
            key={h}
            type="button"
            className={`h-8 px-3 rounded-full border text-xs ${isSelected(h) ? "bg-brand-500 text-white border-brand-500" : "hover:bg-muted"}`}
            onClick={() => toggle(h)}
          >{h}</button>
        ))}
      </div>
    </SectionCard>
  );
}


