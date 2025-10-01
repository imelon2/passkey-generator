"use client";
import JsonPanel from "./JsonPanel";

export default function DecodedAttestationPanel({ value }: { value?: any }) {
  const v = value || {};
  const attObj = v.decodedAttestationObjectResult ?? v;
  const authData = v.decodedAuthDataResult ?? v;
  return (
    <div className="grid md:grid-cols-2 gap-4 min-h-[240px]">
      <JsonPanel title="AttestationObject" value={attObj} />
      <JsonPanel title="AuthData" value={authData} />
    </div>
  );
}


