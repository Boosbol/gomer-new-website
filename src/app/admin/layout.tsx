import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  // Area admin memakai tema gelap sendiri (situs publik memakai tema terang).
  return (
    <div className="min-h-dvh bg-night text-bone" style={{ colorScheme: "dark" }}>
      {children}
    </div>
  );
}
