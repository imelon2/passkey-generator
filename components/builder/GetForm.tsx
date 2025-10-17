"use client";
import React from "react";
import InfoTooltip from "@/components/ui/InfoTooltip";
import SectionCard from "./SectionCard";
import RequestHintsSection from "./RequestHintsSection";
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

  // Challenge 타입 토글 + 값 변환 (hex/base64URL/utf8)
  const [challengeType, setChallengeType] = useState<"hex" | "base64url" | "utf8">("utf8");
  const [challengeRaw, setChallengeRaw] = useState<string>("challenge");

  const decodeRawToBytes = (value: string, type: "hex" | "base64url" | "string" | "utf8"): Uint8Array => {
    try {
      if (type === "hex") return hex0xToUint8Array(value);
      if (type === "base64url") return new Uint8Array(base64UrlToArrayBuffer(value));
      const enc = new TextEncoder();
      return enc.encode(value);
    } catch {
      return new Uint8Array();
    }
  };

  const encodeBytesToType = (bytes: Uint8Array, type: "hex" | "base64url" | "string" | "utf8"): string => {
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
  };

  useEffect(() => {
    if (error && typeof window !== "undefined") {
      try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch {}
    }
  }, [error]);

  useEffect(() => {
    if (!running && result && !error) {
      try { responseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); } catch {}
    }
  }, [result, running, error]);

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
              <div className="flex items-center">
                <label htmlFor="assert-rpid" className="text-xs text-muted-foreground">rpId</label>
                <InfoTooltip
                  ariaLabel="rpId info"
                  content={(
                    <div>
                      <p>A string that specifies the relying party's identifier (e.g., "login.example.org"). Must match the RP's origin and the credential's rpId. Defaults to the current origin's domain. <a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialRequestOptions#rpid" target="_blank" rel="noreferrer">[link]</a></p>
                    </div>
                  )}
                />
              </div>
              <input id="assert-rpid" className="h-10 px-3 rounded-xl border" placeholder="rpId" value={(request as any).rpId || ""} onChange={(e) => setRequest({ ...request, rpId: e.target.value || undefined } as any)} />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center">
                <label htmlFor="assert-challenge" className="text-xs text-muted-foreground">challenge</label>
                <InfoTooltip
                  ariaLabel="challenge info"
                  content={(
                    <div>
                      <p>An ArrayBuffer, TypedArray, or DataView from the RP server used as a cryptographic challenge. It will be signed by the authenticator and returned in <code>AuthenticatorAssertionResponse.signature</code>. <a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialRequestOptions#challenge" target="_blank" rel="noreferrer">[link]</a></p>
                      <br/>
                      <p>It can be written in <em>UTF8</em>, <em>hex</em>, or <em>base64URL</em> format, but it is ultimately passed as a <em>base64URL</em> parameter.</p>
                    </div>
                  )}
                />
              </div>
              <div className="flex items-center gap-2">
                <input id="assert-challenge" className="h-10 px-3 rounded-xl border flex-1 min-w-0" placeholder={challengeType === "hex" ? "0x.. (≤64 bytes)" : challengeType === "base64url" ? "base64url" : "utf8"} value={challengeRaw} onChange={(e) => setChallengeRaw(challengeType === "hex" ? (e.target.value.startsWith("0x") ? e.target.value : `0x${e.target.value.replace(/^0x/i, "")}`) : e.target.value)} />
                <select className="h-10 px-2 text-xs rounded-md border shrink-0" value={challengeType} onChange={(e) => {
                  const next = e.target.value as any;
                  if (next === challengeType) return;
                  const bytes = decodeRawToBytes(challengeRaw, challengeType);
                  setChallengeType(next);
                  setChallengeRaw(encodeBytesToType(bytes, next));
                }}>
                  <option value="hex">hex</option>
                  <option value="base64url">base64URL</option>
                  <option value="utf8">utf8</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center">
                <label htmlFor="assert-uv" className="text-xs text-muted-foreground">userVerification</label>
                <InfoTooltip
                  ariaLabel="userVerification info"
                  content={(
                    <div>
                      <p>A string specifying the RP's requirements for user verification during authentication. <a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialRequestOptions#userverification" target="_blank" rel="noreferrer">[link]</a></p>
                      <br/>
                      <p>The value can be one of the following:</p>
                      <ul className="list-disc pl-4 mt-1">
                        <li><strong>required</strong>: The relying party requires user verification, and the operation will fail if it does not occur.</li>
                        <li><strong>preferred</strong>: The relying party prefers user verification if possible, but the operation will not fail if it does not occur.</li>
                        <li><strong>discouraged</strong>: The relying party does not want user verification, in the interests of making user interaction as smooth as possible.</li>
                      </ul>
                      <br/>
                      <p>Default: <em>"preferred"</em>.</p>
                    </div>
                  )}
                />
              </div>
              <select id="assert-uv" className="h-10 px-3 rounded-xl border" value={(request as any).userVerification || ""} onChange={(e) => setRequest({ ...request, userVerification: (e.target.value || undefined) } as any)}>
              <option value="">undefined</option>
              <option value="required">required</option>
              <option value="preferred">preferred</option>
              <option value="discouraged">discouraged</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center">
                <label htmlFor="assert-timeout" className="text-xs text-muted-foreground">timeout (ms)</label>
                <InfoTooltip
                  ariaLabel="timeout info"
                  content={(
                    <div>
                      <p>A numerical hint, in milliseconds, indicating how long the RP is willing to wait for the retrieval operation. This hint may be overridden by the browser. <a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialRequestOptions#timeout" target="_blank" rel="noreferrer">[link]</a></p>
                    </div>
                  )}
                />
              </div>
              <input id="assert-timeout" className="h-10 px-3 rounded-xl border" type="number" placeholder="timeout" value={(request as any).timeout ?? ""} onChange={(e) => setRequest({ ...request, timeout: e.target.value === "" ? undefined : Number(e.target.value) } as any)} />
            </div>
          </div>
        </SectionCard>
        <RequestHintsSection hints={(request as any).hints} onChange={(next) => setRequest({ ...request, hints: next } as any)} />
        <SectionCard
          title={(
            <span className="inline-flex items-center align-middle">
              <span>Allow Credentials</span>
              <InfoTooltip
                ariaLabel="allowCredentials info"
                content={(
                  <div>
                    <p>An array of objects used to restrict the list of acceptable credentials. <a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialRequestOptions#allowcredentials" target="_blank" rel="noreferrer">[link]</a></p>
                    <br/><p>An empty array indicates that any credential is acceptable.</p>
                  </div>
                )}
              />
            </span>
          )}
        >
          <div className="grid gap-3">
            {((request as any).allowCredentials as any[] | undefined)?.length ? (
              ((request as any).allowCredentials as any[]).map((ac, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-start">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center">
                        <label className="text-xs text-muted-foreground">id (base64URL)</label>
                        <InfoTooltip
                          ariaLabel="allowCredentials.id info"
                          content={(
                            <div>
                              <p>An ArrayBuffer, TypedArray, or DataView representing the ID of the public key credential to retrieve. Mirrored by <code>rawId</code> in the credential returned by a successful get(). <a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialRequestOptions#id" target="_blank" rel="noreferrer">[link]</a></p>
                            </div>
                          )}
                        />
                      </div>
                      <input className="h-10 px-3 rounded-xl border" placeholder="base64url" value={(ac as any)?.id || ""} onChange={(e) => {
                        const arr = [...(((request as any).allowCredentials as any[]) || [])];
                        (arr[idx] as any) = { ...(arr[idx] as any), id: e.target.value || undefined };
                        setRequest({ ...request, allowCredentials: arr as any });
                      }} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center">
                        <label className="text-xs text-muted-foreground">type</label>
                        <InfoTooltip
                          ariaLabel="allowCredentials.type info"
                          content={(
                            <div>
                              <p>A string defining the type of the public key credential to retrieve. Currently only <code>"public-key"</code>. <a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialRequestOptions#type" target="_blank" rel="noreferrer">[link]</a></p>
                            </div>
                          )}
                        />
                      </div>
                      <select className="h-10 px-3 rounded-xl border" value={(ac as any)?.type || "public-key"} onChange={(e) => {
                        const arr = [...(((request as any).allowCredentials as any[]) || [])];
                        (arr[idx] as any) = { ...(arr[idx] as any), type: e.target.value };
                        setRequest({ ...request, allowCredentials: arr as any });
                      }}>
                        <option value="public-key">public-key</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center">
                        <label className="text-xs text-muted-foreground">transports</label>
                        <InfoTooltip
                          ariaLabel="allowCredentials.transports info"
                          content={(
                            <div>
                              <p>An array of strings providing hints as to the methods the client could use to communicate with the relevant authenticator of the public key credential to retrieve.</p>
                              <br/>
                              <ul className="list-disc pl-4 mt-1">
                                <li><strong>ble</strong>: The authenticator may be used over BLE (Bluetooth Low Energy).</li>
                                <li><strong>cable</strong>: Cloud-assisted Bluetooth Low Energy (caBLE) style transport for cross-device usage.</li>
                                <li><strong>hybrid</strong>: The authenticator can be used over a combination of (often separate) data transport and proximity mechanisms. This supports, for example, authentication on a desktop computer using a smartphone.</li>
                                <li><strong>internal</strong>: The authenticator is specifically bound to the client device (cannot be removed).</li>
                                <li><strong>nfc</strong>: The authenticator may be used over NFC (Near Field Communication).</li>
                                <li><strong>usb</strong>: The authenticator can be contacted over USB.</li>
                                <li><strong>smart-card</strong>: The authenticator is accessible via a smart card interface.</li>
                              </ul>
                              <br/>
                              <p><strong>Note:</strong> This value is mirrored by the return value of <code>PublicKeyCredential.response.getTransports()</code> from the credential created during <code>create()</code>. Store it then and reuse here to hint which authenticator transports to try.</p>
                              <br/>
                              <p className="text-[11px] text-muted-foreground">Sources: 
                                <a className="text-blue-600 underline ml-1" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialRequestOptions#transports" target="_blank" rel="noreferrer">MDN</a>, 
                                <a className="text-blue-600 underline ml-1" href="https://www.w3.org/TR/webauthn/#enum-transport" target="_blank" rel="noreferrer">W3C WebAuthn (transport enumeration)</a>
                              </p>
                            </div>
                          )}
                        />
                      </div>
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
            <JsonPanel title="PublicKeyCredential" value={(result as any)?.auth ?? {}} />
          </div>
          <div className="min-h-[160px]">
            <JsonPanel title="Signature Info" value={result?.signatureInfo ?? {}} />
            {/* <SignatureInfoPanel value={result} /> */}
          </div>
          <div className="min-h-[160px]">
            <JsonPanel title="AuthData" value={result?.decodedAuthData ?? {}} />
          </div>
          <div className="min-h-[160px]">
            <ClientDataJSONPanel value={result?.decodedClientDataJSON ?? {}} />
          </div>
        </div>
      </div>

      {/* Stepper removed */}
    </div>
  );
}


