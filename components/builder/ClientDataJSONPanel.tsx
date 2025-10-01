"use client";
import JsonPanel from "./JsonPanel";

export default function ClientDataJSONPanel({ value }: { value?: any }) {
  const v = value || {};
  return <JsonPanel title="ClientDataJSON" value={v.clientDataJSON ?? v} />;
}


