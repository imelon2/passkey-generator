import { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export default function SectionCard({ title, desc, children, titleExtra }: { title: ReactNode; desc?: string; children: ReactNode; titleExtra?: ReactNode }) {
  return (
    <Card className="p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold flex items-center">
          <span>{title}</span>
          {titleExtra ? <span className="inline-flex items-center align-middle">{titleExtra}</span> : null}
        </h3>
        {desc ? <p className="text-xs text-muted-foreground mt-1">{desc}</p> : null}
      </div>
      <div className="grid gap-3">
        {children}
      </div>
    </Card>
  );
}


