"use client";
import SectionCard from "./SectionCard";
import JsonPanel from "./JsonPanel";
import InfoTooltip from "@/components/ui/InfoTooltip";

export default function FidoU2FSignature({
  signatureFormat,
  challengeSignature,
  recoveredPublicKey,
}: {
  signatureFormat?: unknown;
  challengeSignature?: unknown;
  recoveredPublicKey?: unknown;
}) {
  return (
    <SectionCard
      title="FIDO U2F Signature"
      titleExtra={(
        <InfoTooltip
          ariaLabel="fido u2f signature description"
          content={(
            <div className="text-xs">
              <p>
                The format for assertion signatures, which sign over the concatenation of an authenticator data structure and the hash of the serialized client data, are compatible with the FIDO U2F authentication signature format (see Section 5.4 of {" "}
                <a
                  href="https://fidoalliance.org/specs/fido-u2f-v1.1-id-20160915/fido-u2f-raw-message-formats-v1.1-id-20160915.html"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
                >
                  FIDO-U2F-Message-Formats
                </a>
                ).
              </p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Source:{" "}
                <a
                  href="https://www.w3.org/TR/webauthn-2/#sctn-fido-u2f-sig-format-compat"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
                >
                  W3C WebAuthn - FIDO U2F signature format
                </a>
              </p>
            </div>
          )}
        />
      )}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="min-h-[180px]">
          <JsonPanel
            title="Signature Format"
            titleExtra={(
              <InfoTooltip
                ariaLabel="signature format info"
                content={(
                  <div>
                    <div className="text-xs">The FIDO U2F signature is produced by signing the message hash with the Passkey’s private key, as described below.</div>
                    <div className="mt-2 overflow-auto">
                      <div className="font-mono text-[11px] whitespace-nowrap">
                        <div className="mb-1">
                          <span className="font-semibold">authenticatorData</span>
                          <span> = </span>
                          <span className="px-2 py-0.5 rounded-md border bg-blue-50 text-blue-700">appIdHash [32 bytes]</span>
                          <span className="px-1">||</span>
                          <span className="px-2 py-0.5 rounded-md border bg-green-50 text-green-700">userPresenceFlag [1 byte]</span>
                          <span className="px-1">||</span>
                          <span className="px-2 py-0.5 rounded-md border bg-purple-50 text-purple-700">counter [4 bytes]</span>
                        </div>
                        <div className="mb-1">
                          <span className="font-semibold">signedData_U2F</span>
                          <span> = </span>
                          <span className="px-2 py-0.5 rounded-md border bg-slate-50">authenticatorData [37 bytes]</span>
                          <span className="px-1">||</span>
                          <span className="px-2 py-0.5 rounded-md border bg-amber-50 text-amber-700">SHA256(clientData) [32 bytes]</span>
                        </div>
                        <div>
                          <span className="font-semibold">messageHash</span>
                          <span> = </span>
                          <span>SHA256(signedData_U2F)</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-[11px] text-muted-foreground">
                      Source: <a className="text-blue-600 underline" href="https://www.w3.org/TR/webauthn-2/#sctn-fido-u2f-sig-format-compat" target="_blank" rel="noreferrer">W3C WebAuthn - FIDO U2F signature format</a>
                    </div>
                  </div>
                )}
              />
            )}
            value={signatureFormat ?? {}}
          />
        </div>
        <div className="min-h-[180px]">
          <JsonPanel title="Challenge & Signature" value={challengeSignature ?? {}} />
        </div>
        <div className="min-h-[180px] lg:col-span-2">
          <JsonPanel title="Verified Public Key" value={recoveredPublicKey ?? {}} />
        </div>
      </div>
    </SectionCard>
  );
}


