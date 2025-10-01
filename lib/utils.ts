import { decode } from "cbor-x";
import { parseAuthenticatorData,decodeClientDataJSON,decodeCredentialPublicKey  } from "@simplewebauthn/server/helpers";
import { bufferToBase64URLString } from "@simplewebauthn/browser";
import { toHex } from "viem";
import { type ClassValue } from "clsx";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function tryParseJSON<T = unknown>(text: string): { ok: true; value: T } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Invalid JSON" };
  }
}

export function convertCOSEALG(alg:number) {
  switch (alg) {
    case -7:
      return "ES256"
      break;
    case -257:
      return "RS256"
      break;
    
    default:
      return ""
      break;
  }
}
export function downloadText(filename: string, content: string, type = "application/json") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function isPrefixedHex(input: string): boolean {
  return /^0x[0-9a-fA-F]*$/.test(input);
}

export function hexToByteLength(input: string): number {
  if (!isPrefixedHex(input)) return 0;
  const hex = input.slice(2);
  return Math.ceil(hex.length / 2);
}

export function hex0xToUint8Array(input: string): Uint8Array {
  if (!isPrefixedHex(input)) return new Uint8Array();
  let hex = input.slice(2);
  if (hex.length % 2 === 1) hex = "0" + hex;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

export function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = typeof btoa !== "undefined" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  // Base64URL → Base64
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4 ? 4 - (base64.length % 4) : 0;
  const padded = base64 + "=".repeat(pad);

  // Base64 → binary string
  const binary =
    typeof atob !== "undefined"
      ? atob(padded)
      : Buffer.from(padded, "base64").toString("binary");

  // binary string → Uint8Array
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

export function toSerializablePublicKeyCredential(cred: PublicKeyCredential | null | undefined): any {
  if (!cred) return undefined;
  const base: any = {
    id: toHex(Buffer.from(base64UrlToArrayBuffer(cred.id as string))),
    type: cred.type,
    authenticatorAttachment: cred.authenticatorAttachment ?? undefined,
    clientExtensionResults: cred.getClientExtensionResults?.() ?? undefined,
  };
  const resp = cred.response as AuthenticatorAttestationResponse;
  if (resp) {
    const isAttestation = typeof resp.attestationObject !== "undefined";
    // const isAssertion = typeof resp.authenticatorData !== "undefined" || typeof resp.signature !== "undefined";

    const common = {
      // base64
      clientDataJSON: resp.clientDataJSON ? decodeClientDataJSON(arrayBufferToBase64Url(resp.clientDataJSON)) : undefined,
    };
    
    if (isAttestation) {
      const decodedAttesta0tionObj = resp.attestationObject ? decode(new Uint8Array(resp.attestationObject)) : undefined;
      const decodedAuthData = decodedAttesta0tionObj ? parseAuthenticatorData(Uint8Array.from((decodedAttesta0tionObj).authData)) : undefined;      
      const publicKey = decodedAuthData ? decodedAuthData.credentialPublicKey ? decode(Uint8Array.from(decodedAuthData.credentialPublicKey)) : undefined : undefined;      
      
      // const is = decodeCredentialPublicKey(decodedAuthData!.credentialPublicKey!)
      
      const x = publicKey ? toHex(publicKey[-2]) : '0x';
      const y = publicKey ? toHex(publicKey[-3]) : '0x';

      const attestationObject = {
        ...decodedAttesta0tionObj,
        authData: decodedAuthData ? {
          ...toHexified(decodedAuthData),
          credentialPublicKey: {
            x,y
          }
        } : undefined,
      };

      base.response = {
        ...common,
        attestationObject: attestationObject,
        transports: resp.getTransports ? resp.getTransports() : undefined,
        // ASN.1 / DER de/encode metadata
        publicKey: resp.getPublicKey ? (resp.getPublicKey() ? toHex(Buffer.from(resp.getPublicKey() as any)) : undefined) : undefined,
        publicKeyAlgorithm: resp.getPublicKeyAlgorithm ? resp.getPublicKeyAlgorithm() : undefined,
      };
    } 
    // else if (isAssertion) {
    //   base.response = {
    //     ...common,
    //     authenticatorData: resp.authenticatorData ? arrayBufferToBase64Url(resp.authenticatorData) : undefined,
    //     signature: resp.signature ? arrayBufferToBase64Url(resp.signature) : undefined,
    //     userHandle: resp.userHandle ? arrayBufferToBase64Url(resp.userHandle) : undefined,
    //   };
    // }
  }
  // rawId at the top-level (many libs expect this)
  const anyCred = cred as any;

  console.log(bufferToBase64URLString(anyCred.rawId as ArrayBuffer));
  
  base.rawId = anyCred.rawId ? toHex(Buffer.from(anyCred.rawId)) : undefined;
  // base.rawId = anyCred.rawId ? arrayBufferToBase64Url(anyCred.rawId as ArrayBuffer) : undefined;
  return base;
}

export function isAsciiLettersOnly(input: string): boolean {
  return /^[A-Za-z]+$/.test(input);
}

export function asciiToHex0x(input: string): string {
  let hex = "0x";
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    // limit to 0-127 ascii
    hex += code.toString(16).padStart(2, "0");
  }
  return hex as `0x${string}`;
}

export function isAsciiAlphaNumOnly(input: string): boolean {
  return /^[A-Za-z0-9]+$/.test(input);
}

export function filterAlphaNum(input: string): string {
  return input.replace(/[^A-Za-z0-9]/g, "");
}

export function filterHexPrefixed(input: string, maxBytes?: number): `0x${string}` {
  // keep hex digits only, remove 0x/0X and non-hex
  const hexBody = input.replace(/^0x/i, "").replace(/[^0-9a-fA-F]/g, "");
  const limited = typeof maxBytes === "number" ? hexBody.slice(0, maxBytes * 2) : hexBody;
  return ("0x" + limited) as `0x${string}`;
}

export function randomHex0x(byteLength: number): `0x${string}` {
  let hex = "0x";
  for (let i = 0; i < byteLength; i++) {
    const v = Math.floor(Math.random() * 256);
    hex += v.toString(16).padStart(2, "0");
  }
  return hex as `0x${string}`;
}

export const u8ToHex = (u8: Uint8Array): string => {
  try {
    // @ts-ignore Buffer may not exist in some runtimes; viem can handle Uint8Array directly
    return toHex(Buffer.from(u8));
  } catch {
    return toHex(u8 as unknown as Uint8Array);
  }
};

export const toHexified = (value: any): any => {
  if (value instanceof Uint8Array) return u8ToHex(value);
  if (value && typeof value === "object") {
    if (Array.isArray(value)) return value.map((v) => toHexified(v));
    const out: any = {};
    for (const k of Object.keys(value)) out[k] = toHexified((value as any)[k]);
    return out;
  }
  return value;
};

