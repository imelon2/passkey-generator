import { useEffect, useState } from "react";
import { RunResult } from "@/lib/types";
import { base64URLStringToBuffer, bufferToBase64URLString, startAuthentication, type PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";
import { convertAAGUIDToString, convertCOSEtoPKCS, decodeClientDataJSON, parseAuthenticatorData } from "@simplewebauthn/server/helpers";
import { toHex } from "viem";
import {p256} from "@noble/curves/nist.js"

export function usePasskeyGet() {
  const [request, setRequest] = useState<PublicKeyCredentialRequestOptionsJSON>({
    challenge: "challenge",
    userVerification: "required",
    rpId: typeof window !== "undefined" ? window.location.hostname : undefined,
  });
  const [result, setResult] = useState<any | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<{ name: string; message: string } | null>(null);

  const run = async (override?: Partial<PublicKeyCredentialRequestOptionsJSON>) => {
    const effectiveRequest: PublicKeyCredentialRequestOptionsJSON = {
      ...request,
      ...(override as any),
    } as PublicKeyCredentialRequestOptionsJSON;
    setRunning(true);
    setError(null);
    try {
      const auth = await startAuthentication({ optionsJSON: effectiveRequest, verifyBrowserAutofillInput: true });
      const decodedAuthData = parseAuthenticatorData(Buffer.from(base64URLStringToBuffer(auth.response.authenticatorData)));
      const decodedAuthDataRawResult = {
        aaguid:decodedAuthData.aaguid ? convertAAGUIDToString(decodedAuthData.aaguid) : undefined,
        counter:decodedAuthData.counter,
        counterBuf:bufferToBase64URLString(decodedAuthData.counterBuf.buffer),
        credentialID:decodedAuthData.credentialID ? bufferToBase64URLString(decodedAuthData.credentialID.buffer) : undefined,
        credentialPublicKey: decodedAuthData.credentialPublicKey ? bufferToBase64URLString(decodedAuthData.credentialPublicKey.buffer) : undefined,
        flags:decodedAuthData.flags,
        flagsBuf:bufferToBase64URLString(decodedAuthData.flagsBuf.buffer),
        rpIdHash:bufferToBase64URLString(decodedAuthData.rpIdHash.buffer),
        extensionsData:decodedAuthData.extensionsData,
        extensionsDataBuffer:decodedAuthData.extensionsDataBuffer
      }
      
      const decodedClientData = decodeClientDataJSON(auth.response.clientDataJSON);
      
      
      const {r,s} = p256.Signature.fromBytes(new Uint8Array(base64URLStringToBuffer(auth.response.signature)),"der")
      
      const enriched = {
        auth,
        decodedAuthData: decodedAuthDataRawResult,
        decodedClientDataJSON: decodedClientData,
        signatureInfo: {
          r:toHex(r),
          s:toHex(s)
        }
      };

      setResult(enriched);
      setError(null);
    } catch (e: any) {
      const errRes: RunResult<PublicKeyCredentialRequestOptionsJSON, any> = { ok: false, request: effectiveRequest, error: { name: e?.name || "Error", message: e?.message || "Unknown" }, at: new Date().toISOString(), method: "get" };
      setResult(errRes);
      setError({ name: errRes.error!.name, message: errRes.error!.message });
    } finally {
      setRunning(false);
    }
  };

  return { request, setRequest, result, run, running, error, setError };
}


