"use client";
import JsonPanel from "./JsonPanel";

export default function KeyInfoPanel({ value }: { value?: any }) {
  const v = value || {};
  return <JsonPanel title="Key Info" value={v.keyResult ?? v} />;
}


