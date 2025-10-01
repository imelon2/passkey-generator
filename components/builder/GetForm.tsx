"use client";
import React from "react";
import SectionCard from "./SectionCard";
import JsonPanel from "./JsonPanel";
import RunBar from "./RunBar";
import { usePasskeyGet } from "@/hooks/usePasskeyGet";
import { useEffect, useMemo, useRef, useState } from "react";
import { arrayBufferToBase64Url, base64UrlToArrayBuffer, hex0xToUint8Array, u8ToHex } from "@/lib/utils";
import { Alert } from "@/components/ui/Alert";
import SignatureInfoPanel from "./SignatureInfoPanel";
import ClientDataJSONPanel from "./ClientDataJSONPanel";

export default function GetForm() {
  const { request, setRequest, result, run, running, error, setError } = usePasskeyGet();
  const responseRef = useRef<HTMLDivElement | null>(null);

  // Challenge 타입 토글 + 값 변환 (hex/base64URL/string)
  const [challengeType, setChallengeType] = useState<"hex" | "base64url" | "string">("string");
  const [challengeRaw, setChallengeRaw] = useState<string>("challenge");

  const decodeRawToBytes = (value: string, type: "hex" | "base64url" | "string"): Uint8Array => {
    try {
      if (type === "hex") return hex0xToUint8Array(value);
      if (type === "base64url") return new Uint8Array(base64UrlToArrayBuffer(value));
      const enc = new TextEncoder();
      return enc.encode(value);
    } catch {
      return new Uint8Array();
    }
  };

  const encodeBytesToType = (bytes: Uint8Array, type: "hex" | "base64url" | "string"): string => {
    try {
      if (type === "hex") return u8ToHex(bytes);
      if (type === "base64url") return arrayBufferToBase64Url(bytes.buffer as unknown as ArrayBuffer);
      const dec = new TextDecoder();
      return dec.decode(bytes);
    } catch {
      return type === "hex" ? "0x" : "";
    }
  };

  const challengeBytes = decodeRawToBytes(challengeRaw, challengeType);
  const prettyRequest = useMemo(() => ({
    ...request,
    challenge: challengeBytes.length ? arrayBufferToBase64Url(challengeBytes.buffer as unknown as ArrayBuffer) : undefined,
  }), [request, challengeBytes]);

  const startRun = async () => {
    const chB64 = challengeBytes.length ? arrayBufferToBase64Url(challengeBytes.buffer as unknown as ArrayBuffer) : undefined;
    const override = { ...request, challenge: chB64 } as any;
    setRequest(override);
    await run(override);
    try { responseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); } catch {}
  };

  useEffect(() => {
    if (error && typeof window !== "undefined") {
      try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch {}
    }
  }, [error]);

  return (
    <div className="grid gap-6">
      {error ? (
        <Alert variant="error" title={error.name} onClose={() => setError(null)}>
          {error.message}
        </Alert>
      ) : null}
      <div className="grid gap-4">
        <SectionCard title="Assertion Options">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="assert-rpid" className="text-xs text-muted-foreground">rpId</label>
              <input id="assert-rpid" className="h-10 px-3 rounded-xl border" placeholder="rpId" value={(request as any).rpId || ""} onChange={(e) => setRequest({ ...request, rpId: e.target.value || undefined } as any)} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="assert-challenge" className="text-xs text-muted-foreground">challenge</label>
              <div className="flex items-center gap-2">
                <input id="assert-challenge" className="h-10 px-3 rounded-xl border flex-1 min-w-0" placeholder={challengeType === "hex" ? "0x.. (≤64 bytes)" : challengeType === "base64url" ? "base64url" : "string"} value={challengeRaw} onChange={(e) => setChallengeRaw(challengeType === "hex" ? (e.target.value.startsWith("0x") ? e.target.value : `0x${e.target.value.replace(/^0x/i, "")}`) : e.target.value)} />
                <select className="h-10 px-2 text-xs rounded-md border shrink-0" value={challengeType} onChange={(e) => {
                  const next = e.target.value as any;
                  if (next === challengeType) return;
                  const bytes = decodeRawToBytes(challengeRaw, challengeType);
                  setChallengeType(next);
                  setChallengeRaw(encodeBytesToType(bytes, next));
                }}>
                  <option value="hex">hex</option>
                  <option value="base64url">base64URL</option>
                  <option value="string">string</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="assert-uv" className="text-xs text-muted-foreground">userVerification</label>
              <select id="assert-uv" className="h-10 px-3 rounded-xl border" value={(request as any).userVerification || ""} onChange={(e) => setRequest({ ...request, userVerification: (e.target.value || undefined) } as any)}>
              <option value="">undefined</option>
              <option value="required">required</option>
              <option value="preferred">preferred</option>
              <option value="discouraged">discouraged</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="assert-timeout" className="text-xs text-muted-foreground">timeout (ms)</label>
              <input id="assert-timeout" className="h-10 px-3 rounded-xl border" type="number" placeholder="timeout" value={(request as any).timeout ?? ""} onChange={(e) => setRequest({ ...request, timeout: e.target.value === "" ? undefined : Number(e.target.value) } as any)} />
            </div>
          </div>
        </SectionCard>
        <SectionCard title="Allow Credentials">
          <div className="grid gap-3">
            {((request as any).allowCredentials as any[] | undefined)?.length ? (
              ((request as any).allowCredentials as any[]).map((ac, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-start">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground">id (base64URL)</label>
                      <input className="h-10 px-3 rounded-xl border" placeholder="base64url" value={(ac as any)?.id || ""} onChange={(e) => {
                        const arr = [...(((request as any).allowCredentials as any[]) || [])];
                        (arr[idx] as any) = { ...(arr[idx] as any), id: e.target.value || undefined };
                        setRequest({ ...request, allowCredentials: arr as any });
                      }} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground">type</label>
                      <select className="h-10 px-3 rounded-xl border" value={(ac as any)?.type || "public-key"} onChange={(e) => {
                        const arr = [...(((request as any).allowCredentials as any[]) || [])];
                        (arr[idx] as any) = { ...(arr[idx] as any), type: e.target.value };
                        setRequest({ ...request, allowCredentials: arr as any });
                      }}>
                        <option value="public-key">public-key</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground">transports</label>
                      <div className="flex flex-wrap gap-2">
                        {(["ble","cable","hybrid","internal","nfc","smart-card","usb"] as const).map((t) => {
                          const selected = !!((ac as any)?.transports || []).includes(t);
                          return (
                            <button key={t} type="button" className={`h-8 px-3 rounded-full border text-xs ${selected ? "bg-brand-500 text-white border-brand-500" : "hover:bg-muted"}`} onClick={() => {
                              const arr = [...(((request as any).allowCredentials as any[]) || [])];
                              const curr = ((arr[idx] as any)?.transports || []) as string[];
                              const next = selected ? curr.filter((x) => x !== t) : [...curr, t];
                              (arr[idx] as any) = { ...(arr[idx] as any), transports: next.length ? next : undefined };
                              setRequest({ ...request, allowCredentials: arr as any });
                            }}>{t}</button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <button className="h-10 px-3 rounded-xl border" onClick={() => {
                    const arr = [...(((request as any).allowCredentials as any[]) || [])];
                    arr.splice(idx, 1);
                    setRequest({ ...request, allowCredentials: arr.length ? (arr as any) : undefined } as any);
                  }}>−</button>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">-</div>
            )}
            <div>
              <button className="h-9 px-3 rounded-xl border" onClick={() => {
                const arr = [...((((request as any).allowCredentials as any[]) || []))];
                arr.push({ id: "", type: "public-key" });
                setRequest({ ...request, allowCredentials: arr as any });
              }}>+ Add credential</button>
            </div>
          </div>
        </SectionCard>

        {/* <SectionCard title="Extensions / Hints">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">extensions (JSON)</label>
              <textarea className="min-h-[120px] px-3 py-2 rounded-xl border" placeholder="" value={(request as any).extensions ? JSON.stringify((request as any).extensions, null, 2) : ""} onChange={(e) => {
                const txt = e.target.value;
                if (!txt) return setRequest({ ...request, extensions: undefined } as any);
                try { setRequest({ ...request, extensions: JSON.parse(txt) } as any); } catch {}
              }} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="assert-hints" className="text-xs text-muted-foreground">hints</label>
              <input id="assert-hints" className="h-10 px-3 rounded-xl border" placeholder="hints (comma)" value={((request as any).hints || []).join(",")} onChange={(e) => setRequest({ ...request, hints: e.target.value ? e.target.value.split(",").map((s) => s.trim()) : undefined } as any)} />
            </div>
          </div>
        </SectionCard> */}
        <RunBar label="Get Assertion" onRun={startRun} status={running ? "running" : result ? "done" : "ready"} />
      </div>

      <div className="grid gap-4">
        <div className="text-sm font-semibold text-slate-700">Request JSON</div>
        <div className="min-h-[280px]">
          <JsonPanel title="PublicKeyCredentialRequest" value={prettyRequest} />
        </div>

        <div className="text-sm font-semibold text-slate-700 mt-2">Response JSON</div>
        <div ref={responseRef} className="grid gap-4">
          <div className="min-h-[200px]">
            <JsonPanel title="PublicKeyCredential" value={(result as any)?.auth ?? result} />
          </div>
          <div className="min-h-[160px]">
            <SignatureInfoPanel value={result} />
          </div>
          <div className="min-h-[160px]">
            <JsonPanel title="AuthData" value={result?.decodedAuthData ?? result} />
          </div>
          <div className="min-h-[160px]">
            <ClientDataJSONPanel value={result?.decodedClientDataJSON ?? result} />
          </div>
        </div>
      </div>

      {/* Stepper removed */}
    </div>
  );
}


