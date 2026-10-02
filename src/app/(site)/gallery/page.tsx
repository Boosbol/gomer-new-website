import type { Metadata } from "next";
import Image from "next/image";
import { EventSection } from "@/components/event-section";
import { GallerySectionBlock } from "@/components/gallery-grid";
import { Rule } from "@/components/rule";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/config/site";
import { loadGallery } from "@/services/gallery";
import { getSiteData } from "@/services/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Gallery",
  description: `Photos of ${site.name}: sessions, festivals and live shows.`,
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  const [groups, { content, media }] = await Promise.all([loadGallery(), getSiteData()]);
  const hero = media.find((m) => m.id === content.galleryHeroImageId) ?? media.find((m) => m.id === content.heroImageId) ?? null;

  return (
    <>
      <section aria-label="Gallery" className="relative isolate flex min-h-[34rem] flex-col overflow-hidden bg-footer text-white">
        {hero ? <Image src={`/api/media/${hero.id}`} alt="" fill sizes="100vw" priority unoptimized className="-z-20 object-cover grayscale" /> : null}
        <div className="absolute inset-0 -z-10 bg-black/55" />
        <SiteHeader tone="light" />
        <div className="mx-auto flex w-full max-w-[1224px] flex-1 items-center justify-center px-5 pb-16 pt-6">
          <h1 className="font-display text-[clamp(4rem,14vw,10rem)] font-extrabold leading-none tracking-tight">Gallery</h1>
        </div>
      </section>

      {groups.length === 0 ? (
        <p className="mx-auto max-w-[1224px] px-5 py-24 text-center text-soft">Photos are coming soon.</p>
      ) : (
        groups.map((g, i) => (
          <div key={g.section.id}>
            {i > 0 ? <Rule /> : null}
            <GallerySectionBlock group={g} />
          </div>
        ))
      )}

      <EventSection />
    </>
  );
}
