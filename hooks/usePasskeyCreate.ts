import { useEffect, useState } from "react";
import { RunResult } from "@/lib/types";
import { useHistoryStore } from "@/hooks/useHistory";
import { convertCOSEALG, hex0xToUint8Array, toSerializablePublicKeyCredential } from "@/lib/utils";
import { base64URLStringToBuffer, bufferToBase64URLString, startRegistration } from "@simplewebauthn/browser";
import { type PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/browser";
import { decodeAttestationObject, parseAuthenticatorData, decodeCredentialPublicKey, convertCOSEtoPKCS, convertAAGUIDToString, decodeClientDataJSON } from "@simplewebauthn/server/helpers";
import { toHex } from "viem";


export function usePasskeyCreate() {
  const [request, setRequest] = useState<PublicKeyCredentialCreationOptionsJSON>(() => ({
    rp: { name: "choi" },
    user: { name: "choi", displayName: "choi" },
    pubKeyCredParams: [{ type: "public-key", alg: -7 }],
    attestation:"none"
  } as PublicKeyCredentialCreationOptionsJSON));
  const [result, setResult] = useState<any|null>(null);
  const [error, setError] = useState<{ name: string; message: string } | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setRequest((prev) => ({ ...prev, rp: { ...(prev.rp as any), id: window.location.hostname } }));
    if (typeof window !== "undefined" && !request.rp?.id) {
    }
  }, []);

  const run = async (override?: PublicKeyCredentialCreationOptionsJSON) => {
    setRunning(true);
    setError(null);
    const req = (override || request);
    try {
      const cred = await startRegistration({ optionsJSON: req })
      const decodedAttestationObject = decodeAttestationObject(Buffer.from(base64URLStringToBuffer(cred.response.attestationObject)))
      const decodedAttestationObjectResult = {
        attStmt:decodedAttestationObject.get('attStmt'),
        fmt:decodedAttestationObject.get('fmt'),
        authData:bufferToBase64URLString(decodedAttestationObject.get('authData').buffer)
      }
      
      const decodedAuthData = parseAuthenticatorData(decodedAttestationObject.get('authData'))
      
      const decodedAuthDataResult = {
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
      
      const key = decodeCredentialPublicKey(decodedAuthData.credentialPublicKey!)
      const _alg = key.get(3)
      const _x = key.get(-2!)
      const _y = key.get(-3!)
      
      const keyResult = {
        alg:_alg ? convertCOSEALG(_alg) : undefined,
        x: _x ? toHex(new Uint8Array(_x)) : undefined,
        y: _y ? toHex(new Uint8Array(_y)) : undefined
      }
      const decodeClientData = decodeClientDataJSON(cred.response.clientDataJSON)
      
      setResult({
        publicKeyCredential: cred,
        decodedAttestationObjectResult,
        decodedAuthDataResult,
        keyResult,
        clientDataJSON: decodeClientData,
      });
      // try { useHistoryStore.getState().push(cred); } catch {}
    } catch (e: any) {
      const errRes: RunResult<PublicKeyCredentialCreationOptionsJSON, any> = { ok: false, request: req, error: { name: e?.name || "Error", message: e?.message || "Unknown" }, at: new Date().toISOString(), method: "create" };
      setError({ name: errRes.error!.name, message: errRes.error!.message });
      try { useHistoryStore.getState().push(errRes); } catch {}
    } finally {
      setRunning(false);
    }
  };

  return { request, setRequest, result, run, running, error, setError };
}