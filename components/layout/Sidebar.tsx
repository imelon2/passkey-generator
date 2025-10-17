"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fingerprint, KeyRound, Github, Linkedin, ShieldCheck } from "lucide-react";

const nav = [
  { href: "/create", label: "Create", icon: KeyRound },
  { href: "/get", label: "Get", icon: Fingerprint },
  { href: "/verify", label: "Recovery Signature", icon: ShieldCheck },
];

export default function Sidebar({ active }: { active: "create" | "get" }) {
  const pathname = usePathname();
  return (
    <div className="p-4 h-screen sticky top-0 flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <div className="font-semibold flex items-center gap-1">
          <Fingerprint className="size-6 text-brand-500" />
          <span>Passkey Generator</span>
        </div>
      </div>
      <nav className="flex flex-col gap-2">
        {nav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href as any} className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition ${isActive ? "bg-brand-500 text-white border-brand-500" : "hover:bg-muted"}`}>
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="pt-4 border-t mt-auto">
        <div className="flex items-center gap-3 text-muted-foreground">
          <a
            href={process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/imelon2/passkey-generator"}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="p-2 rounded-lg border hover:bg-muted"
            title="GitHub"
          >
            <Github className="size-4" />
          </a>
          <a
            href={process.env.NEXT_PUBLIC_LINKEDIN_URL || "https://www.linkedin.com/in/wonhyeok-choi-b7b8a125b/"}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="p-2 rounded-lg border hover:bg-muted"
            title="LinkedIn"
          >
            <Linkedin className="size-4" />
          </a>
        </div>
      </div>
    </div>
  );
}


