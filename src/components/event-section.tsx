import Image from "next/image";
import { LiteYouTube } from "@/components/lite-youtube";
import { parseYouTubeId } from "@/lib/youtube-url";
import { getSiteData } from "@/services/site";

/** Bagian peluncuran/event dengan foto latar (diatur di admin). Tersembunyi bila judul kosong. */
export async function EventSection() {
  const { content, media } = await getSiteData();
  if (!content.eventTitle) return null;
  const photo = media.find((m) => m.id === content.eventImageId) ?? null;
  const videoId = content.eventVideoUrl ? parseYouTubeId(content.eventVideoUrl) : null;

  return (
    <section aria-labelledby="event-heading" className="relative isolate mt-20 overflow-hidden text-white">
      {photo ? (
        <Image src={`/api/media/${photo.id}`} alt="" fill sizes="100vw" unoptimized className="-z-20 object-cover" />
      ) : (
        <div className="absolute inset-0 -z-20 bg-footer" />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#5b0d1c]/80 via-[#5b0d1c]/55 to-[#2b0f2e]/60" />
      <div className="mx-auto grid w-full max-w-[1224px] gap-12 px-5 py-24 md:grid-cols-2 md:items-center">
        <div>
          <h2 id="event-heading" className="text-balance font-display text-[clamp(2.75rem,6vw,5rem)] font-medium leading-[1.25]">
            {content.eventTitle}
          </h2>
          {content.eventLine ? <p className="mt-8 text-2xl font-bold uppercase tracking-wide">{content.eventLine}</p> : null}
          {content.eventVenue ? <p className="mt-4 max-w-md">{content.eventVenue}</p> : null}
        </div>
        {videoId ? (
          <LiteYouTube id={videoId} title={content.eventTitle} thumbnail={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} />
        ) : null}
      </div>
    </section>
  );
}
