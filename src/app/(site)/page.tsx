import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { after } from "next/server";
import { Artwork } from "@/components/artwork";
import { EventSection } from "@/components/event-section";
import { JsonLd } from "@/components/json-ld";
import { ReleaseGrid } from "@/components/release-card";
import { Rule } from "@/components/rule";
import { SiteHeader } from "@/components/site-header";
import { StampTitle } from "@/components/stamp-title";
import { StreamingIcons } from "@/components/streaming-icons";
import { VideosSection } from "@/components/videos-section";
import { site } from "@/config/site";
import { STREAMING_KEYS, paragraphs, socialList, socialsFor } from "@/lib/content-schema";
import type { ReleaseType } from "@/integrations/types";
import { loadReleases } from "@/services/releases";
import { getSiteData } from "@/services/site";
import { triggerStaleSync } from "@/services/sync";
import { loadVideos } from "@/services/videos";

// ISR: dibuat ulang paling lambat tiap jam, dan langsung setelah sinkronisasi/edit admin (revalidatePath).
export const revalidate = 3600;

const HEADING: Record<ReleaseType, string> = {
  album: "New album is out now",
  single: "New single is out now",
  ep: "New EP is out now",
  compilation: "New compilation is out now",
};

export async function generateMetadata(): Promise<Metadata> {
  const { content } = await getSiteData();
  const description = content.tagline ? content.tagline.slice(0, 160) : site.description;
  return { description, openGraph: { description }, twitter: { description } };
}

export default async function HomePage() {
  const [{ items, newestFetchedAt }, videos, { content, media }] = await Promise.all([loadReleases(), loadVideos(5), getSiteData()]);
  const [latest, ...others] = items;
  const hero = media.find((m) => m.id === content.heroImageId) ?? null;
  const paras = paragraphs(content.bio);

  after(() => triggerStaleSync(newestFetchedAt)); // no-op kecuali ENABLE_STALE_SYNC=true

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: site.name,
    url: site.url,
    sameAs: socialList(content).map((s) => s.url),
    ...(content.tagline ? { description: content.tagline } : {}),
    ...(hero ? { image: `${site.url}/api/media/${hero.id}` } : {}),
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      {/* Hero layar penuh: foto latar + judul bergaya cap + paragraf pengantar */}
      <section aria-label="Introduction" className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-footer text-white">
        {hero ? (
          <Image src={`/api/media/${hero.id}`} alt="" fill sizes="100vw" priority unoptimized className="-z-20 object-cover" />
        ) : latest?.artworkUrl ? (
          <Image src={latest.artworkUrl} alt="" fill sizes="640px" quality={40} priority className="-z-20 scale-150 object-cover opacity-60 blur-3xl saturate-150" />
        ) : null}
        <div className="absolute inset-0 -z-10 bg-black/45" />

        <SiteHeader tone="light" />

        <div className="mx-auto flex w-full max-w-[1224px] flex-1 flex-col items-center justify-end px-5 pb-16 pt-10 text-center">
          <StampTitle />
          {content.tagline ? <p className="mt-12 max-w-3xl text-lg leading-8 [text-shadow:0_1px_8px_rgba(0,0,0,.5)]">{content.tagline}</p> : null}
        </div>
      </section>

      {/* Rilisan terbaru + biodata (menu About mengarah ke sini) */}
      {latest || paras.length > 0 ? (
        <section id="about" aria-labelledby="featured-heading" className="mx-auto w-full max-w-[1224px] scroll-mt-6 px-5 pb-20 pt-24">
          <h2 id="featured-heading" className="max-w-4xl text-balance font-display text-[clamp(2.75rem,6vw,5rem)] font-medium leading-[1.25]">
            {latest ? HEADING[latest.type] : "About"}
          </h2>
          <div className="mt-14 grid gap-12 md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] md:gap-x-28">
            {paras.length > 0 ? (
              <div className="space-y-6 leading-[1.7]">
                {paras.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            ) : (
              <div />
            )}
            {latest ? (
              <div>
                <Link href={`/music/${latest.slug}`} aria-label={`${latest.title} — details`} className="block">
                  <Artwork
                    src={latest.artworkUrl}
                    alt={`Cover art for ${latest.title}`}
                    sizes="(min-width: 768px) 704px, 90vw"
                    priority
                    className="w-full rounded-[2.5rem]"
                  />
                </Link>
                <StreamingIcons links={socialsFor(content, STREAMING_KEYS)} className="mt-8" />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {others.length > 0 ? (
        <>
          <Rule />
          <section aria-labelledby="more-heading" className="mx-auto w-full max-w-[1224px] px-5 py-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="more-heading" className="font-display text-[clamp(2.5rem,5vw,3.75rem)] font-bold leading-tight">
                Other releases
              </h2>
              <Link href="/music" className="text-soft hover:text-ink hover:underline hover:underline-offset-4">
                All music
              </Link>
            </div>
            <div className="mt-12">
              <ReleaseGrid releases={others.slice(0, 4)} />
            </div>
          </section>
          <Rule />
        </>
      ) : null}

      <VideosSection videos={videos} />
      <EventSection />
    </>
  );
}
