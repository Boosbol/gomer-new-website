import Link from "next/link";
import type { ReactNode } from "react";

const base = "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors";
const variants = {
  primary: "bg-ink text-paper hover:bg-black",
  secondary: "border border-ink/40 text-ink hover:border-ink hover:bg-ink/5",
} as const;

export function ButtonLink({
  href,
  external = false,
  variant = "primary",
  children,
}: {
  href: string;
  external?: boolean;
  variant?: keyof typeof variants;
  children: ReactNode;
}) {
  const className = `${base} ${variants[variant]}`;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
