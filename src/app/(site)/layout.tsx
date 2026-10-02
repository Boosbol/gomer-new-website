import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppButton } from "@/components/whatsapp-button";

// Semua halaman publik berbagi footer + tombol WhatsApp. Area /admin berada di luar grup ini.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
      <WhatsAppButton />
    </>
  );
}
