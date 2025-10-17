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

function sanitizeForView(data: any, seen = new WeakSet()): any {
  if (data === undefined) return undefined;
  if (data === null) return null;
  const t = typeof data;
  if (t === "string" || t === "number" || t === "boolean") return data;
  if (t === "bigint") return data.toString();
  if (t === "function") return "[Function]";
  if (typeof data === "object") {
    if (seen.has(data)) return "[Circular]";
    seen.add(data);
    if (data instanceof ArrayBuffer) return `[ArrayBuffer ${data.byteLength}]`;
    if (ArrayBuffer.isView(data)) {
      const v = data as ArrayBufferView;
      const len = (v as any).byteLength ?? (v as any).length ?? 0;
      return `[${(v as any).constructor?.name || "View"} ${len}]`;
    }
    if (data instanceof Map) return Object.fromEntries(Array.from(data.entries()).map(([k, v]) => [k as any, sanitizeForView(v, seen)]));
    if (data instanceof Set) return Array.from(data).map((v) => sanitizeForView(v, seen));
    if (Array.isArray(data)) return data.map((v) => sanitizeForView(v, seen));
    const out: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      out[key] = sanitizeForView((data as any)[key], seen);
    }
    return out;
  }
  return data;
}

export default function JsonPanel({ title, value, titleExtra }: { title: string; value?: unknown; titleExtra?: React.ReactNode }) {
  const pretty = value !== undefined ? safeStringify(value, 2) : "";
  const JsonView = dynamic(async () => (await import("react-json-view-lite")).JsonView, { ssr: false });
  // Prepare a JS object for the viewer without losing undefined values
  const viewData: any = value !== undefined ? sanitizeForView(value) : undefined;
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
        <h3 className="font-medium flex items-center gap-2">
          <span>{title}</span>
          {titleExtra ? <span>{titleExtra}</span> : null}
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCopy}><Copy className="size-4"/> Copy</Button>
          <Button variant="outline" size="sm" onClick={onDownload}><Download className="size-4"/> Download</Button>
        </div>
      </div>
      <div className="text-xs overflow-auto overflow-x-auto rounded-lg border border-transparent bg-[#eeeeee] p-3 flex-1 min-w-0 max-w-full break-all">
        {viewData !== undefined ? <JsonView data={viewData} shouldExpandNode={() => true} /> : <pre className="whitespace-pre-wrap break-all">// No data yet</pre>}
      </div>
    </Card>
  );
}


