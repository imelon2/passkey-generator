import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

export function Button({ className, variant = "default", size = "md", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl border text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<Variant, string> = {
    default: "bg-brand-500 text-white border-brand-500 hover:bg-brand-600",
    outline: "bg-transparent text-foreground border hover:bg-muted",
    ghost: "bg-transparent border-transparent hover:bg-muted",
  };
  const sizes: Record<Size, string> = {
    sm: "h-8 px-3",
    md: "h-10 px-4",
    lg: "h-12 px-5",
  };
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}


