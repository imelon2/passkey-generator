"use client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";
import dynamic from "next/dynamic";
import "react-json-view-lite/dist/index.css";

function safeStringify(data: unknown, space = 2) {
  const seen = new WeakSet();
  const replacer = (_key: string, val: any) => {
    if (typeof val === "bigint") return val.toString();
    if (typeof val === "function") return `[Function]`;
    if (val && typeof val === "object") {
      if (seen.has(val)) return "[Circular]";
      seen.add(val);
      if (val instanceof ArrayBuffer) return `[ArrayBuffer ${val.byteLength}]`;
      if (ArrayBuffer.isView(val)) {
        const v = val as ArrayBufferView;
        const len = (v as any).byteLength ?? (v as any).length ?? 0;
        return `[${(v as any).constructor?.name || "View"} ${len}]`;
      }
      if (val instanceof Map) return Object.fromEntries(val as any);
      if (val instanceof Set) return Array.from(val as any);
    }
    return val;
  };
  try {
    return JSON.stringify(data, replacer, space);
  } catch {
    try { return String(data); } catch { return ""; }
  }
}

export default function JsonPanel({ title, value }: { title: string; value?: unknown }) {
  const pretty = value ? safeStringify(value, 2) : "";
  const JsonView = dynamic(async () => (await import("react-json-view-lite")).JsonView, { ssr: false });
  // Sanitize complex values into JSON-friendly plain objects to avoid library issues
  let parsed: any = undefined;
  try {
    parsed = value ? JSON.parse(pretty) : undefined;
  } catch {
    parsed = undefined;
  }
  const onCopy = async () => navigator.clipboard.writeText(pretty);
  const onDownload = () => {
    const blob = new Blob([pretty || "{}"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.json`; a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Card className="p-4 h-full flex flex-col bg-[#eeeeee] min-w-0 w-full">
      <div className="flex items-center justify-between mb-3 bg-white rounded-lg px-3 py-2 border">
        <h3 className="font-medium">{title}</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCopy}><Copy className="size-4"/> Copy</Button>
          <Button variant="outline" size="sm" onClick={onDownload}><Download className="size-4"/> Download</Button>
        </div>
      </div>
      <div className="text-xs overflow-auto overflow-x-auto rounded-lg border border-transparent bg-[#eeeeee] p-3 flex-1 min-w-0 max-w-full break-all">
        {parsed ? <JsonView data={parsed} shouldExpandNode={() => true} /> : <pre className="whitespace-pre-wrap break-all">// No data yet</pre>}
      </div>
    </Card>
  );
}


