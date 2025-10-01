"use client";
import { useHistoryStore } from "@/hooks/useHistory";

export default function HistoryTable() {
  const items = useHistoryStore((s) => s.items);
  return (
    <div className="rounded-2xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left px-3 py-2">시간</th>
            <th className="text-left px-3 py-2">메서드</th>
            <th className="text-left px-3 py-2">결과</th>
            <th className="text-left px-3 py-2">요약</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td className="px-3 py-6 text-center text-muted-foreground" colSpan={4}>아직 실행 기록이 없습니다.</td>
            </tr>
          )}
          {items.map((it, i) => (
            <tr key={i} className="border-t">
              <td className="px-3 py-2">{new Date(it.at).toLocaleString()}</td>
              <td className="px-3 py-2">{it.method}</td>
              <td className="px-3 py-2">{it.ok ? "success" : "error"}</td>
              <td className="px-3 py-2 truncate max-w-[360px]">{it.ok ? JSON.stringify(it.response)?.slice(0, 80) : it.error?.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


