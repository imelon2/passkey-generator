"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fingerprint, KeyRound, Github, Linkedin } from "lucide-react";
import Image from "next/image";
// NOTE: User requested to use ./app/profile.jpg explicitly
// Static import works with next/image; keep the path as provided
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import ProfileImg from "@/app/profile.jpg";

const nav = [
  { href: "/create", label: "Create", icon: KeyRound },
  { href: "/get", label: "Get", icon: Fingerprint },
];

export default function Sidebar({ active }: { active: "create" | "get" }) {
  const pathname = usePathname();
  return (
    <div className="p-4 h-screen sticky top-0 flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <Image src={ProfileImg as any} alt="Author profile" width={32} height={32} className="rounded-full object-cover border-2 border-brand-500 shadow-sm" />
        <div className="font-semibold">Passkey Generator</div>
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


