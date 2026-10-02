import Image from "next/image";
import Link from "next/link";
import { StreamingIcons } from "@/components/streaming-icons";
import { SocialIcon } from "@/components/icons";
import { site } from "@/config/site";
import { FOLLOW_KEYS, STREAMING_KEYS, socialsFor } from "@/lib/content-schema";
import { getSiteData } from "@/services/site";

export async function SiteFooter() {
  const { content, media } = await getSiteData();
  const logo = media.find((m) => m.id === content.logoImageId) ?? null;
  const streaming = socialsFor(content, STREAMING_KEYS);
  const follow = socialsFor(content, FOLLOW_KEYS);

  return (
    <footer className="bg-footer text-white">
      <div className="mx-auto w-full max-w-[1224px] px-5 pb-12 pt-24">
        <StreamingIcons links={streaming} size="lg" />
        <div className="mt-20 h-1 bg-white" aria-hidden />
        <div className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-6">
          <Link href="/" aria-label={`${site.name} — home`}>
            {logo ? (
              <Image src={`/api/media/${logo.id}`} alt={site.name} width={logo.width ?? 240} height={logo.height ?? 80} unoptimized className="h-14 w-auto" />
            ) : (
              <span className="font-display text-xl font-bold">{site.name}</span>
            )}
          </Link>
          <ul className="flex items-center gap-6">
            {follow.map((s) => (
              <li key={s.key}>
                <a href={s.url} target="_blank" rel="noopener noreferrer me" aria-label={s.label} title={s.label} className="block hover:opacity-70">
                  <SocialIcon name={s.key} className="h-6 w-6" />
                </a>
              </li>
            ))}
          </ul>
          {content.contactEmail ? (
            <a href={`mailto:${content.contactEmail}`} className="text-sm text-white/80 hover:text-white">
              {content.contactEmail}
            </a>
          ) : null}
        </div>
        <p className="mt-10 text-sm text-white/60">
          © {new Date().getFullYear()} {site.name}. Release info updates automatically from streaming platforms.
        </p>
      </div>
    </footer>
  );
}
