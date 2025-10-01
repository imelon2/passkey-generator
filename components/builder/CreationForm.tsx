"use client";
import SectionCard from "./SectionCard";
import JsonPanel from "./JsonPanel";
import PublicKeyCredentialPanel from "./PublicKeyCredentialPanel";
import DecodedAttestationPanel from "./DecodedAttestationPanel";
import KeyInfoPanel from "./KeyInfoPanel";
import ClientDataJSONPanel from "./ClientDataJSONPanel";
import RunBar from "./RunBar";
import { usePasskeyCreate } from "@/hooks/usePasskeyCreate";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePresetBus } from "@/hooks/usePresetBus";
import { useSettings } from "@/hooks/useSettings";
import { asciiToHex0x, filterHexPrefixed, randomHex0x, base64UrlToArrayBuffer, u8ToHex, arrayBufferToBase64Url, hex0xToUint8Array } from "@/lib/utils";
import { Alert } from "@/components/ui/Alert";

export default function CreationForm() {
  const { request, setRequest, result, run, running, error, setError } = usePasskeyCreate();
  const { guardConfirm } = useSettings();
  const { pendingCreationPreset, setCreationPreset } = usePresetBus();

  useEffect(() => {
    if (pendingCreationPreset) {
      setRequest({ ...(pendingCreationPreset as any) });
      setCreationPreset(null);
    }
  }, [pendingCreationPreset]);

  // Local states for input and type
  const [userIdType, setUserIdType] = useState<"hex" | "base64url" | "string">("string");
  const [challengeType, setChallengeType] = useState<"hex" | "base64url" | "string">("string");
  const [userIdRaw, setUserIdRaw] = useState<string>("userid");
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

  const computedUserIdHex: `0x${string}` = (() => {
    if (userIdType === "hex") return filterHexPrefixed(userIdRaw, 64);
    if (userIdType === "base64url") {
      try { return u8ToHex(new Uint8Array(base64UrlToArrayBuffer(userIdRaw))) as `0x${string}`; } catch { return "0x" as `0x${string}`; }
    }
    return asciiToHex0x(userIdRaw) as `0x${string}`;
  })();

  const computedChallengeHex: `0x${string}` = (() => {
    if (challengeType === "hex") return filterHexPrefixed(challengeRaw, 64);
    if (challengeType === "base64url") {
      try { return u8ToHex(new Uint8Array(base64UrlToArrayBuffer(challengeRaw))) as `0x${string}`; } catch { return "0x" as `0x${string}`; }
    }
    return asciiToHex0x(challengeRaw) as `0x${string}`;
  })();

  const userBytes = decodeRawToBytes(userIdRaw, userIdType);
  const challengeBytes = decodeRawToBytes(challengeRaw, challengeType);
  const isIdReady = userBytes.length > 0;
  const isChallengeReady = challengeBytes.length > 0;
  const canRun = Boolean(isIdReady && isChallengeReady);

  const prettyRequest = useMemo(() => {
    const merged = {
      ...request,
      user: { ...(request.user as any), id: isIdReady ? arrayBufferToBase64Url(userBytes.buffer as unknown as ArrayBuffer) : undefined },
      challenge: isChallengeReady ? arrayBufferToBase64Url(challengeBytes.buffer as unknown as ArrayBuffer) : undefined,
    };
    return merged;
  }, [request, userBytes, challengeBytes, isIdReady, isChallengeReady]);

  const startRun = async () => {
    await run(prettyRequest as any);
  };

  useEffect(() => {
    if (error && typeof window !== "undefined") {
      try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch {}
    }
  }, [error]);

  const responseRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (result && !running) {
      try { responseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); } catch {}
    }
  }, [result, running]);

  return (
    <div className="grid gap-6">
      {error ? (
        <Alert variant="error" title={error.name} onClose={() => setError(null)}>
          {error.message}
        </Alert>
      ) : null}

      <div className="grid gap-4">
        <SectionCard title="Relying Party (rp)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="rp-id" className="text-xs text-muted-foreground">id</label>
              <input id="rp-id" className="h-10 px-3 rounded-xl border" placeholder="id (예: example.com)" value={request.rp?.id || ""} onChange={(e) => setRequest({ ...request, rp: { ...(request.rp as any), id: e.target.value || undefined } })} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="rp-name" className="text-xs text-muted-foreground">name</label>
              <input id="rp-name" className="h-10 px-3 rounded-xl border" placeholder="name" value={(request.rp as any)?.name || ""} onChange={(e) => setRequest({ ...request, rp: { ...(request.rp as any), name: e.target.value || undefined } })} />
            </div>
          </div>
        </SectionCard>
        <SectionCard title="User">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="user-id" className="text-xs text-muted-foreground">id</label>
              <div className="flex items-center gap-2">
                <input id="user-id" required className="h-10 px-3 rounded-xl border flex-1 min-w-0" placeholder={userIdType === "hex" ? "0x.. (≤64 bytes)" : userIdType === "base64url" ? "base64url" : "string"} value={userIdRaw} onChange={(e) => setUserIdRaw(userIdType === "hex" ? filterHexPrefixed(e.target.value, 64) : e.target.value)} />
                <select className="h-10 px-2 text-xs rounded-md border shrink-0" value={userIdType} onChange={(e) => {
                  const next = e.target.value as any;
                  if (next === userIdType) return;
                  const bytes = decodeRawToBytes(userIdRaw, userIdType);
                  setUserIdType(next);
                  setUserIdRaw(encodeBytesToType(bytes, next));
                }}>
                  <option value="hex">hex</option>
                  <option value="base64url">base64URL</option>
                  <option value="string">string</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="user-name" className="text-xs text-muted-foreground">name</label>
              <input id="user-name" className="h-10 px-3 rounded-xl border" placeholder="name" value={(request.user as any)?.name || ""} onChange={(e) => setRequest({ ...request, user: { ...(request.user as any), name: e.target.value || undefined } })} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="user-displayName" className="text-xs text-muted-foreground">displayName</label>
              <input id="user-displayName" className="h-10 px-3 rounded-xl border" placeholder="displayName" value={(request.user as any)?.displayName || ""} onChange={(e) => setRequest({ ...request, user: { ...(request.user as any), displayName: e.target.value || undefined } })} />
            </div>
          </div>
        </SectionCard>
        <SectionCard title="PublicKeyCred Params / Challenge">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="pkc-alg" className="text-xs text-muted-foreground">alg(type)</label>
              <select id="pkc-alg" className="h-10 px-3 rounded-xl border" value={(request.pubKeyCredParams?.[0] as any)?.alg ?? -7} onChange={(e) => setRequest({ ...request, pubKeyCredParams: [{ type: "public-key", alg: Number(e.target.value) }] as any })}>
                <option value={-7}>ES256 (-7)</option>
                <option value={-257}>RS256 (-257)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="challenge" className="text-xs text-muted-foreground">challenge</label>
              <div className="flex items-center gap-2">
                <input id="challenge" required className="h-10 px-3 rounded-xl border flex-1 min-w-0" placeholder={challengeType === "hex" ? "0x.. (≤64 bytes)" : challengeType === "base64url" ? "base64url" : "string"} value={challengeRaw} onChange={(e) => setChallengeRaw(challengeType === "hex" ? filterHexPrefixed(e.target.value, 64) : e.target.value)} />
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
              <label htmlFor="timeout" className="text-xs text-muted-foreground">timeout</label>
              <input id="timeout" className="h-10 px-3 rounded-xl border" placeholder="timeout (ms)" type="number" value={(request as any).timeout ?? ""} onChange={(e) => setRequest({ ...request, timeout: e.target.value === "" ? undefined : Number(e.target.value) } as any)} />
            </div>
          </div>
        </SectionCard>
        <SectionCard title="Authenticator Selection">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="auth-attachment" className="text-xs text-muted-foreground">authenticatorAttachment</label>
              <select id="auth-attachment" className="h-10 px-3 rounded-xl border" value={(request.authenticatorSelection as any)?.authenticatorAttachment || ""} onChange={(e) => setRequest({ ...request, authenticatorSelection: { ...(request.authenticatorSelection as any), authenticatorAttachment: (e.target.value || undefined) } as any })}>
                <option value="">undefined</option>
                <option value="platform">platform</option>
                <option value="cross-platform">cross-platform</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="auth-residentKey" className="text-xs text-muted-foreground">residentKey</label>
              <select id="auth-residentKey" className="h-10 px-3 rounded-xl border" value={(request.authenticatorSelection as any)?.residentKey || ""} onChange={(e) => setRequest({ ...request, authenticatorSelection: { ...(request.authenticatorSelection as any), residentKey: (e.target.value || undefined) } as any })}>
                <option value="">undefined</option>
                <option value="discouraged">discouraged</option>
                <option value="preferred">preferred</option>
                <option value="required">required</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="auth-requireRK" className="text-xs text-muted-foreground">requireResidentKey</label>
              <select id="auth-requireRK" className="h-10 px-3 rounded-xl border" value={String((request.authenticatorSelection as any)?.requireResidentKey ?? "")} onChange={(e) => setRequest({ ...request, authenticatorSelection: { ...(request.authenticatorSelection as any), requireResidentKey: e.target.value === "true" ? true : e.target.value === "false" ? false : undefined } as any })}>
                <option value="">undefined</option>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="auth-uv" className="text-xs text-muted-foreground">userVerification</label>
              <select id="auth-uv" className="h-10 px-3 rounded-xl border" value={(request.authenticatorSelection as any)?.userVerification || ""} onChange={(e) => setRequest({ ...request, authenticatorSelection: { ...(request.authenticatorSelection as any), userVerification: (e.target.value || undefined) } as any })}>
                <option value="">undefined</option>
                <option value="required">required</option>
                <option value="preferred">preferred</option>
                <option value="discouraged">discouraged</option>
              </select>
            </div>
          </div>
        </SectionCard>
        <SectionCard title="Attestation">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="attestation" className="text-xs text-muted-foreground">attestation</label>
              <select id="attestation" className="h-10 px-3 rounded-xl border" value={(request as any).attestation ?? "none"} onChange={(e) => setRequest({ ...request, attestation: (e.target.value as any) } as any)}>
                <option value="none">none</option>
                <option value="direct">direct</option>
                <option value="enterprise">enterprise</option>
                <option value="indirect">indirect</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="hints" className="text-xs text-muted-foreground">hints</label>
              <input id="hints" className="h-10 px-3 rounded-xl border" placeholder="hints (comma)" value={((request as any).hints || []).join(",")} onChange={(e) => setRequest({ ...request, hints: e.target.value ? e.target.value.split(",").map((s) => s.trim()) : undefined } as any)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">attestationFormats</label>
              <div className="flex flex-wrap gap-2">
                {(["none","fido-u2f","packed","android-safetynet","android-key","tpm","apple"] as const).map((fmt) => {
                  const selected = !!(((request as any).attestationFormats || []) as string[]).includes(fmt);
                  return (
                    <button
                      key={fmt}
                      type="button"
                      className={`h-8 px-3 rounded-full border text-xs ${selected ? "bg-brand-500 text-white border-brand-500" : "hover:bg-muted"}`}
                      onClick={() => {
                        const curr = ((((request as any).attestationFormats || []) as string[]));
                        const next = selected ? curr.filter((x) => x !== fmt) : [...curr, fmt];
                        setRequest({ ...request, attestationFormats: next.length ? (next as any) : undefined } as any);
                      }}
                    >{fmt}</button>
                  );
                })}
              </div>
            </div>
          </div>
        </SectionCard>
        <SectionCard title="Exclude Credentials">
          <div className="grid gap-3">
            {(request.excludeCredentials as any[] | undefined)?.length ? (
              (request.excludeCredentials as any[]).map((ec, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-start">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground">id (base64URL)</label>
                      <input className="h-10 px-3 rounded-xl border" placeholder="base64url" value={(ec as any)?.id || ""} onChange={(e) => {
                        const arr = [...((request.excludeCredentials as any[]) || [])];
                        (arr[idx] as any) = { ...(arr[idx] as any), id: e.target.value || undefined };
                        setRequest({ ...request, excludeCredentials: arr as any });
                      }} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground">type</label>
                      <select className="h-10 px-3 rounded-xl border" value={(ec as any)?.type || "public-key"} onChange={(e) => {
                        const arr = [...((request.excludeCredentials as any[]) || [])];
                        (arr[idx] as any) = { ...(arr[idx] as any), type: e.target.value };
                        setRequest({ ...request, excludeCredentials: arr as any });
                      }}>
                        <option value="public-key">public-key</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground">transports</label>
                      <div className="flex flex-wrap gap-2">
                        {(["ble","cable","hybrid","internal","nfc","smart-card","usb"] as const).map((t) => {
                          const selected = !!((ec as any)?.transports || []).includes(t);
                          return (
                            <button key={t} type="button" className={`h-8 px-3 rounded-full border text-xs ${selected ? "bg-brand-500 text-white border-brand-500" : "hover:bg-muted"}`} onClick={() => {
                              const arr = [...((request.excludeCredentials as any[]) || [])];
                              const curr = ((arr[idx] as any)?.transports || []) as string[];
                              const next = selected ? curr.filter((x) => x !== t) : [...curr, t];
                              (arr[idx] as any) = { ...(arr[idx] as any), transports: next.length ? next : undefined };
                              setRequest({ ...request, excludeCredentials: arr as any });
                            }}>{t}</button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <button className="h-10 px-3 rounded-xl border" onClick={() => {
                    const arr = [...((request.excludeCredentials as any[]) || [])];
                    arr.splice(idx, 1);
                    setRequest({ ...request, excludeCredentials: arr.length ? (arr as any) : undefined });
                  }}>−</button>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">-</div>
            )}
            <div>
              <button className="h-9 px-3 rounded-xl border" onClick={() => {
                const arr = [...((request.excludeCredentials as any[]) || [])];
                arr.push({ id: "", type: "public-key" });
                setRequest({ ...request, excludeCredentials: arr as any });
              }}>+ Add credential</button>
            </div>
          </div>
        </SectionCard>
        <RunBar label="Create Passkey" onRun={startRun} status={running ? "running" : result ? "done" : "ready"} disabled={!canRun} />
      </div>

      <div className="grid gap-4">
        <div className="text-sm font-semibold text-slate-700">Response JSON</div>
        <div className="min-h-[280px]">
          <JsonPanel title="PublicKeyCredentialCreation" value={prettyRequest} />
        </div>

        <div className="text-sm font-semibold text-slate-700 mt-2">Request JSON</div>
        <div ref={responseRef} className="min-h-[200px]">
          <KeyInfoPanel value={result} />
        </div>
        <div className="min-h-[200px]">
          <PublicKeyCredentialPanel value={result} />
        </div>
        <div className="min-h-[200px]">
          <ClientDataJSONPanel value={result} />
        </div>
        <DecodedAttestationPanel value={result} />
      </div>

      {/* Stepper removed by request */}
    </div>
  );
}


