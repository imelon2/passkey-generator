"use client";
import JsonPanel from "./JsonPanel";
import InfoTooltip from "@/components/ui/InfoTooltip";

export default function DecodedAttestationPanel({ value }: { value?: any }) {
  const v = value || {};
  const attObj = v.decodedAttestationObjectResult ?? v;
  const authData = v.decodedAuthDataResult ?? v;
  return (
    <div className="grid md:grid-cols-2 gap-4 min-h-[240px]">
      <JsonPanel title="AttestationObject" value={attObj} />
      <JsonPanel
        title="AuthData"
        titleExtra={(
          <InfoTooltip
            ariaLabel="authData flags info"
            label={<span className="capitalize">What is flags?</span>}
            buttonClassName="ml-1"
            content={(
              <div className="text-xs">
                <p>A bitfield that indicates various attributes asserted by the authenticator. Bit 0 is the least significant bit. Unlisted bits are reserved.</p>
                <ul className="list-disc pl-4 mt-2 space-y-1">
                  <li><strong>Bit 0 — User Presence (UP):</strong> If set (1), authenticator validated user presence (e.g., touch).</li>
                  <li><strong>Bit 2 — User Verification (UV):</strong> If set, authenticator verified the user (biometric, PIN, etc.).</li>
                  <li><strong>Bit 3 — Backup Eligibility (BE):</strong> If set, the credential source is backup-eligible (multi-device credential).</li>
                  <li><strong>Bit 4 — Backup State (BS):</strong> If set, the credential source is currently backed up.</li>
                  <li><strong>Bit 6 — Attested Credential Data (AT):</strong> If set, attested credential data follows the first 37 bytes of authenticatorData.</li>
                  <li><strong>Bit 7 — Extension Data (ED):</strong> If set, extension data is present (follows attested credential data if any, otherwise follows the first 37 bytes).</li>
                </ul>
              </div>
            )}
          />
        )}
        value={authData}
      />
    </div>
  );
}


