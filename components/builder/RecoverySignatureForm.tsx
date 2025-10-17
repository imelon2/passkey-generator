"use client";
import SectionCard from "./SectionCard";
import JsonPanel from "./JsonPanel";
import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { AuthenticationResponseJSON, base64URLStringToBuffer } from "@simplewebauthn/browser";
import FidoU2FSignature from "./FidoU2FSignature";
import { concatBytes, sha256, toBytes, toHex } from "viem";
import { p256 } from "@noble/curves/nist.js";

import { decodeClientDataJSON } from "@simplewebauthn/server/helpers";
import { Button } from "@/components/ui/button";
import { ClipboardPaste } from "lucide-react";
import InfoTooltip from "@/components/ui/InfoTooltip";

export default function RecoverySignatureForm() {
  const [raw, setRaw] = useState<string>("");
  const [signatureFormat, setSignatureFormat] = useState<{
    authenticatorData: `0x${string}`;
    format: {
      appIdHash: `0x${string}`;
      userPresenceFlag: `0x${string}`;
      counter: `0x${string}`;
    }
    clientDataSHA256: `0x${string}`;
  } | {}>({});
  const [challengeSignature, setChallengeSignature] = useState<{
    challenge: `0x${string}`;
    signature: {
      r: `0x${string}`;
      s: `0x${string}`;
      uncompressed: `0x${string}`;
    };
  } | {}>({});
  const [recoveredPublicKey, setRecoveredPublicKey] = useState< {
    recovery0: {
        v: number;
        x: `0x${string}`;
        y: `0x${string}`;
    };
    recovery1: {
        v: number;
        x: `0x${string}`;
        y: `0x${string}`;
    };
} | {}>({});
  const [error, setError] = useState<string | null>(null);

  const validate = async (text: string) => {
    setError(null);
    try {
      const obj = JSON.parse(text);
      // minimal structural validation for AuthenticationResponseJSON
      if (typeof obj !== "object" || obj === null) throw new Error("Root must be an object");
      if (typeof obj.id !== "string" || typeof obj.type !== "string") throw new Error("id and type are required");
      if (typeof obj.rawId !== "string") throw new Error("rawId must be base64URL string");
      if (typeof obj.response !== "object" || obj.response === null) throw new Error("response is required");
      if (typeof obj.response.clientDataJSON !== "string") throw new Error("response.clientDataJSON must be base64URL string");
      if (typeof obj.response.authenticatorData !== "string") throw new Error("response.authenticatorData must be base64URL string");
      if (typeof obj.response.signature !== "string") throw new Error("response.signature must be base64URL string");
      if (obj.response.userHandle !== undefined && typeof obj.response.userHandle !== "string") throw new Error("response.userHandle must be base64URL string if provided");

      const verifiedOpt = (obj as AuthenticationResponseJSON);

      const authenticatorDataBytes = new Uint8Array(base64URLStringToBuffer(verifiedOpt.response.authenticatorData))
      const clientDataJSONBytes = new Uint8Array(base64URLStringToBuffer(verifiedOpt.response.clientDataJSON))
      const appIdHash = toHex(authenticatorDataBytes.subarray(0, 32))
      const userPresenceFlag = toHex(authenticatorDataBytes.subarray(32, 33))
      const counter = toHex(authenticatorDataBytes.subarray(33))
      const clientDataSHA256 = sha256(clientDataJSONBytes)


      const challenge = decodeClientDataJSON(verifiedOpt.response.clientDataJSON).challenge
      const signature = p256.Signature.fromBytes(new Uint8Array(base64URLStringToBuffer(obj.response.signature)), "der")

      const _challengeSignature = {
        challenge:toHex(new Uint8Array(base64URLStringToBuffer(challenge))),
        signature: {
          r: toHex(signature.r),
          s: toHex(signature.s),
          uncompressed: toHex(signature.toBytes())
        }
      }
      setChallengeSignature(_challengeSignature)

      const clientDataSHA256Bytes = toBytes(clientDataSHA256)
      const msg = concatBytes([authenticatorDataBytes, clientDataSHA256Bytes])
      const msgSHA256 = sha256(msg)
      const msgHash = Uint8Array.from(toBytes(msgSHA256))

      if (p256.Point.Fp.isValid(signature.r)) {
        const recoveryBit0 = signature.addRecoveryBit(0).recoverPublicKey(msgHash)
        const recoveryBit1 = signature.addRecoveryBit(1).recoverPublicKey(msgHash)
        const recovered = {
          recovery0: {
            v: 0,
            x: toHex(recoveryBit0.x),
            y: toHex(recoveryBit0.y)
          },
          recovery1: {
            v: 1,
            x: toHex(recoveryBit1.x),
            y: toHex(recoveryBit1.y)
          }
        }

        setRecoveredPublicKey(recovered)
      } else {
        const recoveryBit2 = signature.addRecoveryBit(2).recoverPublicKey(msgHash)
        const recoveryBit3 = signature.addRecoveryBit(3).recoverPublicKey(msgHash)
        const recovered = {
          recovery2: {
            v: 2,
            x: toHex(recoveryBit2.x),
            y: toHex(recoveryBit2.y)
          },
          recovery3: {
            v: 3,
            x: toHex(recoveryBit3.x),
            y: toHex(recoveryBit3.y)
          }
        }
        setRecoveredPublicKey(recovered)
      }


      const _signatureFormat = {
        authenticatorData: toHex(authenticatorDataBytes),
        format: {
          appIdHash,
          userPresenceFlag,
          counter,
        },
        clientDataSHA256,
        messageHash:msgSHA256
      }
      setSignatureFormat(_signatureFormat)

    } catch (e: any) {
      setError(e?.message || "Invalid JSON");
    }
  };

  return (
    <div className="grid gap-6">
      <Alert variant="warning" title="Warning">
        The current page only supports signature recovery for Passkeys using the <strong>P-256 (ES256 -7)</strong> algorithm.
      </Alert>
      {error ? (
        <Alert variant="error" title="Validation Error" onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      <SectionCard
        title="Recovery Signature"
        titleExtra={(
          <InfoTooltip
            ariaLabel="recovery signature how-to"
            content={(
              <div className="text-xs">
                <p>
                  On the <span className="px-2 py-0.5 rounded-md border bg-blue-50 text-blue-700">Get page</span>, generate a Passkey <span className="px-1.5 py-0.5 rounded-md border bg-slate-50">PublicKeyCredential</span> first.
                </p>
                <p className="mt-1">
                  Then, copy the JSON data of the generated <span className="px-1.5 py-0.5 rounded-md border bg-slate-50">PublicKeyCredential</span> from the response (by clicking the <span className="px-2 py-0.5 rounded-md border bg-emerald-50 text-emerald-700">Copy</span> button) and paste it here.
                </p>
              </div>
            )}
          />
        )}
      >
        <div className="grid gap-3">
          <label className="text-xs text-muted-foreground">Paste AuthenticationResponseJSON</label>
          <textarea
            className="min-h-[260px] w-full rounded-xl border bg-muted/50 px-3 py-2 font-mono text-xs leading-5 tracking-tight outline-none shadow-inner placeholder:text-muted-foreground focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-y"
            placeholder="{\n  &quot;id&quot;: &quot;...&quot;,\n  &quot;rawId&quot;: &quot;base64url...&quot;,\n  &quot;type&quot;: &quot;public-key&quot;,\n  &quot;response&quot;: {\n    &quot;clientDataJSON&quot;: &quot;base64url...&quot;,\n    &quot;authenticatorData&quot;: &quot;base64url...&quot;,\n    &quot;signature&quot;: &quot;base64url...&quot;\n  }\n}"
            value={raw}
            onChange={(e) => { const v = e.target.value; setRaw(v); validate(v); }}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            wrap="off"
            style={{ tabSize: 2 as any }}
          />
          <div className="pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-xs rounded-lg border border-dashed border-muted-foreground/40 font-mono gap-1.5"
              onClick={() => {
                const sample = {
                  id: "TmEFmpB_wmjLhEhvxgR-pdPGLCg",
                  rawId: "TmEFmpB_wmjLhEhvxgR-pdPGLCg",
                  response: {
                    authenticatorData: "SZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2MdAAAAAA",
                    clientDataJSON: "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiWTJoaGJHeGxibWRsIiwib3JpZ2luIjoiaHR0cDovL2xvY2FsaG9zdDozMDAwIiwiY3Jvc3NPcmlnaW4iOmZhbHNlLCJvdGhlcl9rZXlzX2Nhbl9iZV9hZGRlZF9oZXJlIjoiZG8gbm90IGNvbXBhcmUgY2xpZW50RGF0YUpTT04gYWdhaW5zdCBhIHRlbXBsYXRlLiBTZWUgaHR0cHM6Ly9nb28uZ2wveWFiUGV4In0",
                    signature: "MEUCIQDDv9dQaFRdpX7PJKNXMhg2-0rZGmakV37cW5cJVMbMdgIgbdzD3cKLLx2MuKRo2VGhP4BGRFML_fPalq-Ipnf4PHg",
                    userHandle: "dXNlcmlk",
                  },
                  type: "public-key",
                  clientExtensionResults: {},
                  authenticatorAttachment: "platform",
                };
                const text = JSON.stringify(sample, null, 2);
                setRaw(text);
                validate(text);
              }}
            >
              <ClipboardPaste className="h-[14px] w-[14px]" />
              Insert Example JSON
            </Button>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-4">
        <FidoU2FSignature
          signatureFormat={signatureFormat}
          challengeSignature={challengeSignature}
          recoveredPublicKey={recoveredPublicKey}
        />
      </div>
    </div>
  );
}


