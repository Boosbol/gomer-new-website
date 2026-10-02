import Image from "next/image";
import Link from "next/link";
import { site } from "@/config/site";
import { paragraphs } from "@/lib/content-schema";
import { getSiteData } from "@/services/site";

/** tone="light": teks putih (di atas foto hero). tone="dark": teks gelap (di atas latar terang). */
export async function SiteHeader({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { content, media } = await getSiteData();
  const logo = media.find((m) => m.id === content.logoImageId) ?? null;

  const nav: { href: string; label: string }[] = [{ href: "/music", label: "Music" }];
  if (media.some((m) => m.inGallery)) nav.push({ href: "/gallery", label: "Gallery" });
  if (paragraphs(content.bio).length > 0) nav.push({ href: "/#about", label: "About" });

  return (
    <header
      className={`relative z-10 mx-auto flex w-full max-w-[1224px] flex-wrap items-center gap-x-8 gap-y-3 px-5 py-8 ${
        tone === "light" ? "text-white [text-shadow:0_1px_8px_rgba(0,0,0,.45)]" : "text-ink"
      }`}
    >
      <Link href="/" aria-label={`${site.name} — home`} className="shrink-0">
        {logo ? (
          <Image
            src={`/api/media/${logo.id}`}
            alt={site.name}
            width={logo.width ?? 240}
            height={logo.height ?? 80}
            unoptimized
            priority
            className="h-14 w-auto"
          />
        ) : (
          <span className="font-display text-xl font-bold tracking-tight">{site.name}</span>
        )}
      </Link>
      <nav aria-label="Main" className="flex flex-wrap gap-x-8 gap-y-1 text-base font-medium">
        {nav.map((item) => (
          <Link key={item.href} href={item.href} className="hover:underline hover:underline-offset-8">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
