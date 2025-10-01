"use client";
import JsonPanel from "./JsonPanel";

export default function PublicKeyCredentialPanel({ value }: { value?: any }) {
  const v = value || {};
  return <JsonPanel title="PublicKeyCredential" value={v.publicKeyCredential ?? v} />;
}


