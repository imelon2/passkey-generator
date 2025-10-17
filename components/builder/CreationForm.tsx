"use client";
import SectionCard from "./SectionCard";
import InfoTooltip from "@/components/ui/InfoTooltip";
import Modal from "@/components/ui/Modal";
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
  const [userIdType, setUserIdType] = useState<"hex" | "base64url" | "utf8">("utf8");
  const [challengeType, setChallengeType] = useState<"hex" | "base64url" | "utf8">("utf8");
  const [userIdRaw, setUserIdRaw] = useState<string>("userid");
  const [challengeRaw, setChallengeRaw] = useState<string>("challenge");
  const [showParamsInfo, setShowParamsInfo] = useState(false);

  const decodeRawToBytes = (value: string, type: "hex" | "base64url" | "utf8"): Uint8Array => {
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
        <SectionCard
          title="Relying Party (rp)"
          titleExtra={
            <InfoTooltip
              ariaLabel="Relying Party info"
              content={(
                <div>
                  <p>An object describing the relying party that requested the credential creation. <a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions#rp" target="_blank" rel="noreferrer">[link]</a></p>
                  <p className="mt-2"><em>*relying party:</em> The Relying Party (RP) is the entity whose web application is using WebAuthn to register and authenticate users. The RP controls WebAuthn API options during registration and authentication ceremonies. They can use these options to enhance security, increase trust in the authenticator, and improve the user experience. The Relying Party must also validate WebAuthn API responses from the authenticator and make a trust decision before registering a passkey. <a className="text-blue-600 underline" href="https://webauthn.wtf/how-it-works/relying-party" target="_blank" rel="noreferrer">[link]</a></p>
                </div>
              )}
            />
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center">
                <label htmlFor="rp-id" className="text-xs text-muted-foreground">id</label>
                <InfoTooltip
                  ariaLabel="Relying Party id info"
                  content={(
                    <div>
                      <p>A string representing the ID of the relying party. A public key credential can only be used for authentication with the same relying party it was registered with — the IDs need to match.</p>
                      <p className="mt-2">The <code>id</code> cannot include a port or scheme like a standard origin, but the domain scheme must be <code>https</code> scheme. The <code>id</code> needs to equal the origin's effective domain, or a domain suffix thereof. <a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions#id_2" target="_blank" rel="noreferrer">[link]</a>
                      <br /><br />So for example if the relying party's origin is <code>https://login.example.com:1337</code>, the following <code>id</code>s are valid:</p>
                      <ul className="list-disc pl-4 mt-1">
                        <li><code>login.example.com</code></li>
                        <li><code>example.com</code></li>
                      </ul>
                      <p className="mt-2">But not:</p>
                      <ul className="list-disc pl-4 mt-1">
                        <li><code>m.login.example.com</code></li>
                        <li><code>com</code></li>
                      </ul>
                      <p className="mt-2">default: <em>current host name</em></p>
                    </div>
                  )}
                />
              </div>
              <input id="rp-id" className="h-10 px-3 rounded-xl border" placeholder="id (예: example.com)" value={request.rp?.id || ""} onChange={(e) => setRequest({ ...request, rp: { ...(request.rp as any), id: e.target.value || undefined } })} />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center">
                <label htmlFor="rp-name" className="text-xs text-muted-foreground">name</label>
                <InfoTooltip
                  ariaLabel="Relying Party name info"
                  content={(
                    <div>
                      <p>A string representing the name of the relying party (e.g., "Facebook"). This is the name the user will be presented with when creating or validating a WebAuthn operation.<a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions#name" target="_blank" rel="noreferrer">[link]</a></p>
                    </div>
                  )}
                />
              </div>
              <input id="rp-name" className="h-10 px-3 rounded-xl border" placeholder="name" value={(request.rp as any)?.name || ""} onChange={(e) => setRequest({ ...request, rp: { ...(request.rp as any), name: e.target.value || undefined } })} />
            </div>
          </div>
        </SectionCard>
        <SectionCard
          title="User"
          titleExtra={
            <InfoTooltip
              ariaLabel="User info"
              content={(
                <div>
                  <p>
                    An object describing the user account for which the credential is generated. <a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions#user" target="_blank" rel="noreferrer">[link]</a>
                  </p>
                </div>
              )}
            />
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center">
                <label htmlFor="user-id" className="text-xs text-muted-foreground">id</label>
                <InfoTooltip
                  ariaLabel="User id info"
                  content={(
                    <div>
                      <p>An Buffer (ArrayBuffer, TypedArray, or DataView) representing a unique ID for the user account. This value has a maximum length of 64 bytes, and is not intended to be displayed to the user. <a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions#id_3" target="_blank" rel="noreferrer">[link]</a></p><br/>
                      <p>It can be written in <em>UTF8</em>, <em>hex</em>, or <em>base64URL</em> format, but it is ultimately passed as a <em>base64URL</em> parameter.</p>
                    </div>
                  )}
                />
              </div>
              <div className="flex items-center gap-2">
                <input id="user-id" required className="h-10 px-3 rounded-xl border flex-1 min-w-0" placeholder={userIdType === "hex" ? "0x.. (≤64 bytes)" : userIdType === "base64url" ? "base64url" : "utf8"} value={userIdRaw} onChange={(e) => setUserIdRaw(userIdType === "hex" ? filterHexPrefixed(e.target.value, 64) : e.target.value)} />
                <select className="h-10 px-2 text-xs rounded-md border shrink-0" value={userIdType} onChange={(e) => {
                  const next = e.target.value as any;
                  if (next === userIdType) return;
                  const bytes = decodeRawToBytes(userIdRaw, userIdType);
                  setUserIdType(next);
                  setUserIdRaw(encodeBytesToType(bytes, next));
                }}>
                  <option value="hex">hex</option>
                  <option value="base64url">base64URL</option>
                  <option value="utf8">utf8</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center">
                <label htmlFor="user-name" className="text-xs text-muted-foreground">name</label>
                <InfoTooltip
                  ariaLabel="User name info"
                  content={(
                    <div>
                      <p>
                        A string providing a human-friendly identifier for the user's account, to help distinguish between different accounts with similar displayNames. <br/><br/>This could be an email address (such as "elaina.sanchez@example.com"), phone number (for example "+12345678901"), or some other kind of user account identifier (for example "ElainaSanchez667"). <a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions#name_2" target="_blank" rel="noreferrer">[link]</a>
                      </p>
                    </div>
                  )}
                />
              </div>
              <input id="user-name" className="h-10 px-3 rounded-xl border" placeholder="name" value={(request.user as any)?.name || ""} onChange={(e) => setRequest({ ...request, user: { ...(request.user as any), name: e.target.value || undefined } })} />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center">
                <label htmlFor="user-displayName" className="text-xs text-muted-foreground">displayName</label>
                <InfoTooltip
                  ariaLabel="User displayName info"
                  content={(
                    <div>
                      <p>A string providing a human-friendly user display name (example: "Maria Sanchez"), which will have been set by user during initial registration with the relying party.<a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions#displayname" target="_blank" rel="noreferrer">[link]</a></p>
                    </div>
                  )}
                />
              </div>
              <input id="user-displayName" className="h-10 px-3 rounded-xl border" placeholder="displayName" value={(request.user as any)?.displayName || ""} onChange={(e) => setRequest({ ...request, user: { ...(request.user as any), displayName: e.target.value || undefined } })} />
            </div>
          </div>
        </SectionCard>
        <SectionCard
          title={(
            <span className="inline-flex items-center align-middle">
              <span>PublicKeyCred Params</span>
              <InfoTooltip
                ariaLabel="pubKeyCredParams info"
                content={(
                  <div>
                    <p>An Array of objects which specify the key types and signature algorithms the Relying Party supports, ordered from most preferred to least preferred. The client and authenticator will make a best-effort to create a credential of the most preferred type possible. <a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions#pubkeycredparams" target="_blank" rel="noreferrer">[link]</a></p>
                  </div>
                )}
              />
            </span>
          )}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center">
                <label htmlFor="pkc-alg" className="text-xs text-muted-foreground">alg(type)</label>
                <InfoTooltip
                  ariaLabel="alg(type) info"
                  content={(
                    <div>
                      <p>
                        A number that is equal to a <a className="text-blue-600 underline" href="https://www.iana.org/assignments/cose/cose.xhtml#algorithms" target="_blank" rel="noreferrer">COSE Algorithm Identifier</a>, representing the cryptographic algorithm to use for this credential type. <a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions#alg" target="_blank" rel="noreferrer">[link]</a>
                      </p>
                      <p className="mt-2">It is recommended that relying parties that wish to support a wide range of authenticators should include at least the following values in the provided choices:</p>
                      <ul className="list-disc pl-4 mt-1">
                        {/* <li><code>-8</code>: EdDSA</li> */}
                        <li><code>-7</code>: ES256</li>
                        <li><code>-257</code>: RS256</li>
                      </ul>
                    </div>
                  )}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {([
                  { label: "ES256 (-7)", value: -7 },
                  { label: "RS256 (-257)", value: -257 },
                ] as const).map((opt) => {
                  const selected = !!((request.pubKeyCredParams || []) as any[]).some((p: any) => p?.alg === opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={`h-8 px-3 rounded-full border text-xs ${selected ? "bg-brand-500 text-white border-brand-500" : "hover:bg-muted"}`}
                      onClick={() => {
                        const curr = [ ...(((request.pubKeyCredParams || []) as any[])) ];
                        const next = selected
                          ? curr.filter((p: any) => p?.alg !== opt.value)
                          : [...curr, { type: "public-key", alg: opt.value }];
                        setRequest({ ...request, pubKeyCredParams: next.length ? (next as any) : undefined } as any);
                      }}
                    >{opt.label}</button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center">
                <label htmlFor="challenge" className="text-xs text-muted-foreground">challenge</label>
                <InfoTooltip
                  ariaLabel="challenge info"
                  content={(
                    <div>
                      <p>An ArrayBuffer, TypedArray, or DataView provided by the relying party's server and used as a cryptographic challenge. This value will be signed by the authenticator and the signature will be sent back as part of <code>attestationObject</code>. <a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions#challenge" target="_blank" rel="noreferrer">[link]</a></p>
                      <br/><p>It can be written in UTF8, hex, or base64URL format, but it is ultimately passed as a base64URL parameter.</p>
                    </div>
                  )}
                />
              </div>
              <div className="flex items-center gap-2">
                <input id="challenge" required className="h-10 px-3 rounded-xl border flex-1 min-w-0" placeholder={challengeType === "hex" ? "0x.. (≤64 bytes)" : challengeType === "base64url" ? "base64url" : "utf8"} value={challengeRaw} onChange={(e) => setChallengeRaw(challengeType === "hex" ? filterHexPrefixed(e.target.value, 64) : e.target.value)} />
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
                <label htmlFor="timeout" className="text-xs text-muted-foreground">timeout</label>
                <InfoTooltip
                  ariaLabel="timeout info"
                  content={(
                    <div>
                      <p>A numerical hint, in milliseconds, which indicates the time the calling web app is willing to wait for the creation operation to complete. This hint may be overridden by the browser. <a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions#timeout" target="_blank" rel="noreferrer">[link]</a></p>
                    </div>
                  )}
                />
              </div>
              <input id="timeout" className="h-10 px-3 rounded-xl border" placeholder="timeout (ms)" type="number" value={(request as any).timeout ?? ""} onChange={(e) => setRequest({ ...request, timeout: e.target.value === "" ? undefined : Number(e.target.value) } as any)} />
            </div>
          </div>
        </SectionCard>
        <SectionCard
          title={(
            <span className="inline-flex items-center align-middle">
              <span>Authenticator Selection</span>
              <InfoTooltip
                ariaLabel="authenticatorSelection info"
                content={(
                  <div>
                    <p>An object whose properties are criteria used to filter out the potential authenticators for the credential creation operation. <a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions#authenticatorselection" target="_blank" rel="noreferrer">[link]</a></p>
                  </div>
                )}
              />
            </span>
          )}
        >
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center">
                <label htmlFor="auth-attachment" className="text-xs text-muted-foreground">authenticatorAttachment</label>
                <InfoTooltip
                  ariaLabel="authenticatorAttachment info"
                  content={(
                    <div>
                      <p>A string indicating which authenticator attachment type should be permitted for the chosen authenticator.<a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions#authenticatorattachment" target="_blank" rel="noreferrer">[link]</a></p>
                      <br/><p>Possible values are:</p>
                      <ul className="list-disc pl-4 mt-1">
                        <li>
                          <strong>platform</strong>: The authenticator is part of the device WebAuthn is running on (termed a platform authenticator), therefore WebAuthn will communicate with it using a transport available to that platform, such as a platform-specific API. A public key credential bound to a platform authenticator is called a platform credential.
                        </li>
                        <li>
                          <strong>cross-platform</strong>: The authenticator is not a part of the device WebAuthn is running on (termed a roaming authenticator as it can roam between different devices), therefore WebAuthn will communicate with it using a cross-platform transport protocol such as Bluetooth or NFC. A public key credential bound to a roaming authenticator is called a roaming credential.
                        </li>
                        <li>
                          <strong>undefined</strong>: If omitted, any type of authenticator, either platform or cross-platform, can be selected for the credential creation operation.
                        </li>
                      </ul>
                    </div>
                  )}
                />
              </div>
              <select id="auth-attachment" className="h-10 px-3 rounded-xl border" value={(request.authenticatorSelection as any)?.authenticatorAttachment || ""} onChange={(e) => setRequest({ ...request, authenticatorSelection: { ...(request.authenticatorSelection as any), authenticatorAttachment: (e.target.value || undefined) } as any })}>
                <option value="">undefined</option>
                <option value="platform">platform</option>
                <option value="cross-platform">cross-platform</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center">
                <label htmlFor="auth-residentKey" className="text-xs text-muted-foreground">residentKey</label>
                <InfoTooltip
                  ariaLabel="residentKey info"
                  content={(
                    <div>
                      <p>A string that specifies the extent to which the relying party desires to create a client-side discoverable credential. Possible values are:</p>
                      <ul className="list-disc pl-4 mt-1">
                        <li><strong>discouraged</strong>: Prefer server-side credential, but accept discoverable credential.</li>
                        <li><strong>preferred</strong>: Strongly prefer discoverable credential, but accept server-side credential. Takes precedence over userVerification.</li>
                        <li><strong>required</strong>: Require discoverable credential; otherwise a NotAllowedError is thrown.</li>
                      </ul>
                      <p className="mt-2">if <code>requireResidentKey</code> is true, otherwise <em>"discouraged"</em>. <a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions#residentkey" target="_blank" rel="noreferrer">[link]</a></p>
                      <br/><p>Default: <em>"required"</em>.</p>
                    </div>
                  )}
                />
              </div>
              <select id="auth-residentKey" className="h-10 px-3 rounded-xl border" value={(request.authenticatorSelection as any)?.residentKey || ""} onChange={(e) => setRequest({ ...request, authenticatorSelection: { ...(request.authenticatorSelection as any), residentKey: (e.target.value || undefined) } as any })}>
                <option value="">undefined</option>
                <option value="discouraged">discouraged</option>
                <option value="preferred">preferred</option>
                <option value="required">required</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center">
                <label htmlFor="auth-requireRK" className="text-xs text-muted-foreground">requireResidentKey</label>
                <InfoTooltip
                  ariaLabel="requireResidentKey info"
                  content={(
                    <div>
                      <p>A boolean indicating that a resident key is required (deprecated; kept for backwards compatibility). Set to <strong>true</strong> if <code>residentKey</code> is <em>"required"</em>. <a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions#requireresidentkey" target="_blank" rel="noreferrer">[link]</a></p>
                      <br/><p>Default: <em>false</em>.</p>
                    </div>
                  )}
                />
              </div>
              <select id="auth-requireRK" className="h-10 px-3 rounded-xl border" value={String((request.authenticatorSelection as any)?.requireResidentKey ?? "")} onChange={(e) => setRequest({ ...request, authenticatorSelection: { ...(request.authenticatorSelection as any), requireResidentKey: e.target.value === "true" ? true : e.target.value === "false" ? false : undefined } as any })}>
                <option value="">undefined</option>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center">
                <label htmlFor="auth-uv" className="text-xs text-muted-foreground">userVerification</label>
                <InfoTooltip
                  ariaLabel="userVerification info"
                  content={(
                    <div>
                      <p>A string specifying the relying party's requirements for user verification during the create() operation. Possible values are:</p>
                      <ul className="list-disc pl-4 mt-1">
                        <li><strong>discouraged</strong>: Prefer no user verification, minimizing disruption.</li>
                        <li><strong>preferred</strong>: Prefer user verification, but do not fail if unavailable.</li>
                        <li><strong>required</strong>: Require user verification; otherwise an error is thrown.</li>
                      </ul>
                      <p className="mt-2">Default: <em>"preferred"</em>. <a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions#userverification" target="_blank" rel="noreferrer">[link]</a></p>
                    </div>
                  )}
                />
              </div>
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
              <div className="flex items-center">
                <label htmlFor="attestation" className="text-xs text-muted-foreground">attestation</label>
                <InfoTooltip
                  ariaLabel="attestation info"
                  content={(
                    <div>
                      <p>A string specifying the relying party's preference for how the attestation statement is conveyed during credential creation. <a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions#attestation" target="_blank" rel="noreferrer">[link]</a></p>
                      <br/><p>Possible values:</p>
                      <ul className="list-disc pl-4 mt-1">
                        <li><strong>none</strong>: Not interested in authenticator attestation (often to simplify UX).</li>
                        <li><strong>direct</strong>: Receive attestation statement as generated by the authenticator.</li>
                        <li><strong>enterprise</strong>: May include uniquely identifying information for enterprise deployments.</li>
                        <li><strong>indirect</strong>: Allow client to decide how to receive a verifiable attestation statement.</li>
                      </ul>
                      <p className="mt-2">Default: <em>"none"</em>.</p>
                    </div>
                  )}
                />
              </div>
              <select id="attestation" className="h-10 px-3 rounded-xl border" value={(request as any).attestation ?? "none"} onChange={(e) => setRequest({ ...request, attestation: (e.target.value as any) } as any)}>
                <option value="none">none</option>
                <option value="direct">direct</option>
                <option value="enterprise">enterprise</option>
                <option value="indirect">indirect</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center">
                <label className="text-xs text-muted-foreground">hints</label>
                <InfoTooltip
                  ariaLabel="hints info"
                  content={(
                    <div>
                      <p>An array of strings providing hints as to what UI the browser should provide for the user to create a public key credential. <a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions#hints" target="_blank" rel="noreferrer">[link]</a></p>
                      <br/><p>Values (order denotes preference):</p>
                      <ul className="list-disc pl-4 mt-1">
                        <li><strong>security-key</strong>: Recommend using a separate physical security key.</li>
                        <li><strong>client-device</strong>: Recommend an authenticator available on the same device.</li>
                        <li><strong>hybrid</strong>: Recommend a general-purpose authenticator (e.g., phone) cross-device.</li>
                      </ul>
                      <p className="mt-2">Hints may override or be ignored depending on platform capabilities.</p>
                    </div>
                  )}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {(["hybrid","security-key","client-device"] as const).map((h) => {
                  const selected = !!(((request as any).hints || []) as string[]).includes(h);
                  return (
                    <button
                      key={h}
                      type="button"
                      className={`h-8 px-3 rounded-full border text-xs ${selected ? "bg-brand-500 text-white border-brand-500" : "hover:bg-muted"}`}
                      onClick={() => {
                        const curr = ((((request as any).hints || []) as string[]));
                        const next = selected ? curr.filter((x) => x !== h) : [...curr, h];
                        setRequest({ ...request, hints: next.length ? (next as any) : undefined } as any);
                      }}
                    >{h}</button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center">
                <label className="text-xs text-muted-foreground">attestationFormats</label>
                <InfoTooltip
                  ariaLabel="attestationFormats info"
                  content={(
                    <div>
                      <p>An array of strings specifying the relying party's preference for the attestation statement format. Ordered from highest to lowest preference and treated as hints — the authenticator may choose a different format. <a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions#attestationformats" target="_blank" rel="noreferrer">[link]</a></p>
                      <br/><p>Default: <em>empty array</em>.</p>
                    </div>
                  )}
                />
                <button type="button" className="ml-2 h-6 px-2 rounded-md border text-[11px] text-blue-600 hover:bg-blue-50" onClick={() => setShowParamsInfo(true)}>
                  Show
                </button>
              </div>
              
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
        <Modal open={showParamsInfo} onClose={() => setShowParamsInfo(false)} title="Attestation Formats - Parameters Info">
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2">format</th>
                  <th className="text-left px-3 py-2">description</th>
                  <th className="text-left px-3 py-2">reference</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-3 py-2">packed</td>
                  <td className="px-3 py-2">The "packed" attestation statement format is a WebAuthn-optimized format for attestation. It uses a very compact but still extensible encoding method. This format is implementable by authenticators with limited resources (e.g., secure elements).</td>
                  <td className="px-3 py-2"><a className="text-blue-600 underline" href="https://www.w3.org/TR/webauthn/#sctn-packed-attestation" target="_blank" rel="noreferrer">Web Authentication §8.2</a></td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2">tpm</td>
                  <td className="px-3 py-2">The TPM attestation statement format returns an attestation statement in the same format as the packed attestation statement format, although the rawData and signature fields are computed differently.</td>
                  <td className="px-3 py-2"><a className="text-blue-600 underline" href="https://www.w3.org/TR/webauthn/#sctn-tpm-attestation" target="_blank" rel="noreferrer">Web Authentication §8.3</a></td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2">android-key</td>
                  <td className="px-3 py-2">Platform authenticators on versions "N", and later, may provide this proprietary "hardware attestation" statement.</td>
                  <td className="px-3 py-2"><a className="text-blue-600 underline" href="https://www.w3.org/TR/webauthn/#sctn-android-key-attestation" target="_blank" rel="noreferrer">Web Authentication §8.4</a></td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2">android-safetynet</td>
                  <td className="px-3 py-2">Android-based platform authenticators MAY produce an attestation statement based on the Android SafetyNet API.</td>
                  <td className="px-3 py-2"><a className="text-blue-600 underline" href="https://www.w3.org/TR/webauthn/#sctn-android-safetynet-attestation" target="_blank" rel="noreferrer">Web Authentication §8.5</a></td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2">fido-u2f</td>
                  <td className="px-3 py-2">Used with FIDO U2F authenticators</td>
                  <td className="px-3 py-2"><a className="text-blue-600 underline" href="https://www.w3.org/TR/webauthn/#sctn-fido-u2f-attestation" target="_blank" rel="noreferrer">Web Authentication §8.6</a></td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2">apple</td>
                  <td className="px-3 py-2">Used with Apple devices' platform authenticators</td>
                  <td className="px-3 py-2"><a className="text-blue-600 underline" href="https://www.w3.org/TR/webauthn/#sctn-apple-anonymous-attestation" target="_blank" rel="noreferrer">Web Authentication §8.8</a></td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2">none</td>
                  <td className="px-3 py-2">Used to replace any authenticator-provided attestation statement when a WebAuthn Relying Party indicates it does not wish to receive attestation information.</td>
                  <td className="px-3 py-2"><a className="text-blue-600 underline" href="https://www.w3.org/TR/webauthn/#sctn-none-attestation-statement" target="_blank" rel="noreferrer">Web Authentication §8.7</a></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Source: <a className="text-blue-600 underline" href="https://www.iana.org/assignments/webauthn/webauthn.xhtml#webauthn-attestation-statement-format-ids" target="_blank" rel="noreferrer">IANA WebAuthn Attestation Statement Format Identifiers</a>
          </div>
        </Modal>
        <SectionCard
          title={(
            <span className="inline-flex items-center align-middle">
              <span>Exclude Credentials</span>
              <InfoTooltip
                ariaLabel="excludeCredentials info"
                content={(
                  <div>
                    <p>
                      An array of credential descriptors that are already mapped to this user (<code>user.id</code>), so the user agent avoids creating a new credential on an authenticator that already has one registered for this account. <a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions#excludecredentials" target="_blank" rel="noreferrer">[link]</a>
                    </p>
                    <br/>
                    <p>If excludeCredentials is omitted, it defaults to an empty array.</p>
                  </div>
                )}
              />
            </span>
          )}
        >
          <div className="grid gap-3">
            {(request.excludeCredentials as any[] | undefined)?.length ? (
              (request.excludeCredentials as any[]).map((ec, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-start">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center">
                        <label className="text-xs text-muted-foreground">id (base64URL)</label>
                        <InfoTooltip
                          ariaLabel="excludeCredentials.id info"
                          content={(
                            <div>
                              <p>
                                The credential ID, encoded as base64URL. This identifies an existing credential to exclude so that registration does not create a duplicate on the same authenticator. <a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions#excludecredentials" target="_blank" rel="noreferrer">[link]</a>
                              </p>
                            </div>
                          )}
                        />
                      </div>
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
                      <div className="flex items-center">
                        <label className="text-xs text-muted-foreground">transports</label>
                        <InfoTooltip
                          ariaLabel="excludeCredentials.transports info"
                          content={(
                            <div>
                              <p>An Array of strings representing allowed transports. <a className="text-blue-600 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/AuthenticatorAttestationResponse/getTransports" target="_blank" rel="noreferrer">[link]</a></p>
                              <ul className="list-disc pl-4 mt-1">
                                <li><strong>ble</strong>: The authenticator may be used over BLE (Bluetooth Low Energy).</li>
                                <li><strong>hybrid</strong>: The authenticator can be used over a combination of (often separate) data transport and proximity mechanisms. This supports, for example, authentication on a desktop computer using a smartphone.</li>
                                <li><strong>internal</strong>: The authenticator is specifically bound to the client device (cannot be removed).</li>
                                <li><strong>nfc</strong>: The authenticator may be used over NFC (Near Field Communication).</li>
                                <li><strong>usb</strong>: The authenticator can be contacted over USB.</li>
                              </ul>
                            </div>
                          )}
                        />
                      </div>
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
        <div className="text-sm font-semibold text-slate-700">Request JSON</div>
        <div className="min-h-[280px]">
          <JsonPanel title="PublicKeyCredentialCreation" value={prettyRequest} />
        </div>

        <div className="text-sm font-semibold text-slate-700 mt-2">Response JSON</div>
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


