import Image from "next/image";
import { LiteYouTube } from "@/components/lite-youtube";
import { formatReleaseDate } from "@/lib/format";
import type { VideoView } from "@/services/videos";

export function VideosSection({ videos }: { videos: VideoView[] }) {
  const [featured, ...rest] = videos;
  if (!featured) return null;

  return (
    <section id="videos" aria-labelledby="video-heading" className="mx-auto w-full max-w-[1224px] scroll-mt-6 px-5 py-20">
      <h2 id="video-heading" className="font-display text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-tight">
        Videos
      </h2>
      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div>
          <LiteYouTube id={featured.externalId} title={featured.title} thumbnail={featured.thumbnailUrl} />
          <h3 className="mt-4 text-xl font-semibold">{featured.title}</h3>
          <p className="text-sm text-soft">{formatReleaseDate(featured.publishedAt.slice(0, 10))}</p>
        </div>
        {rest.length > 0 ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            {rest.slice(0, 4).map((v) => (
              <li key={v.id}>
                <a href={v.url} target="_blank" rel="noopener noreferrer" className="group flex gap-4">
                  <span className="relative aspect-video w-32 shrink-0 overflow-hidden rounded bg-rule/40">
                    {v.thumbnailUrl ? <Image src={v.thumbnailUrl} alt="" fill sizes="128px" className="object-cover" /> : null}
                  </span>
                  <span>
                    <span className="block font-semibold leading-snug group-hover:underline group-hover:underline-offset-4">{v.title}</span>
                    <span className="text-sm text-soft">{formatReleaseDate(v.publishedAt.slice(0, 10))}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
