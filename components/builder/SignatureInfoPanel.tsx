"use client";
import JsonPanel from "./JsonPanel";

export default function SignatureInfoPanel({ value }: { value?: any }) {
  const v = value || {};
  // value.response.signature 는 base64url 또는 ArrayBuffer일 수 있음. 그대로 표시
  const signatureInfo = v.signatureInfo ?? (v.response?.signature ? { signature: v.response.signature } : undefined);
  return <JsonPanel title="Signature Info" value={signatureInfo ?? v} />;
}



