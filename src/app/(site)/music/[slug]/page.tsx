import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Artwork } from "@/components/artwork";
import { ButtonLink } from "@/components/buttons";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/config/site";
import { formatDuration, formatReleaseDate, isoDuration, typeLabel } from "@/lib/format";
import { platformLabel, streamingPlatforms, type StreamingPlatform } from "@/integrations/streaming";
import { getRelease, type ReleaseDetail } from "@/services/releases";

export const revalidate = 3600;
export const dynamicParams = true; // halaman rilisan baru dibuat saat pertama diakses, lalu di-cache

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return [];
}

function describe(r: ReleaseDetail): string {
  return (
    r.description ??
    `${typeLabel(r.type)} by ${r.artist}, released ${formatReleaseDate(r.releaseDate, r.releaseDatePrecision)}. Listen on ${platformLabel(r.platform)}.`
  );
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const r = await getRelease(slug);
  if (!r) return { title: "Release not found", robots: { index: false, follow: false } };

  const title = `${r.artist} — ${r.title}`;
  const description = describe(r);
  const images = r.artworkUrl ? [{ url: r.artworkUrl, width: 640, height: 640, alt: `Cover art for ${r.title}` }] : undefined;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/music/${r.slug}` },
    openGraph: { type: "music.album", title, description, url: `${site.url}/music/${r.slug}`, images },
    twitter: { card: "summary_large_image", title, description, images: r.artworkUrl ? [r.artworkUrl] : undefined },
  };
}

function buildJsonLd(r: ReleaseDetail): Record<string, unknown> {
  const releaseType =
    r.type === "single"
      ? "https://schema.org/SingleRelease"
      : r.type === "ep"
        ? "https://schema.org/EPRelease"
        : r.type === "compilation"
          ? "https://schema.org/CompilationAlbum"
          : "https://schema.org/AlbumRelease";
  const byArtist = { "@type": "MusicGroup", name: r.artist };
  return {
    "@context": "https://schema.org",
    "@type": "MusicAlbum",
    name: r.title,
    url: `${site.url}/music/${r.slug}`,
    byArtist,
    datePublished: r.releaseDate,
    albumReleaseType: releaseType,
    ...(r.artworkUrl ? { image: r.artworkUrl } : {}),
    ...(r.genres.length ? { genre: r.genres } : {}),
    ...(r.totalTracks ? { numTracks: r.totalTracks } : {}),
    sameAs: Object.values(r.links),
    ...(r.tracks.length
      ? {
          track: r.tracks.map((t) => ({
            "@type": "MusicRecording",
            name: t.title,
            position: t.trackNumber,
            byArtist,
            ...(t.durationMs ? { duration: isoDuration(t.durationMs) } : {}),
            ...(t.externalUrl ? { url: t.externalUrl } : {}),
          })),
        }
      : {}),
  };
}

export default async function ReleasePage({ params }: Params) {
  const { slug } = await params;
  const r = await getRelease(slug);
  if (!r) notFound();

  const otherLinks = (Object.entries(r.links) as [StreamingPlatform, string][]).filter(([k]) => k !== r.platform);
  const multiDisc = r.tracks.some((t) => t.discNumber > 1);

  return (
    <>
      <JsonLd data={buildJsonLd(r)} />
      <SiteHeader tone="dark" />
      <article className="mx-auto w-full max-w-[1224px] px-5 pb-24 pt-6">
        <div className="grid gap-12 md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <Artwork
            src={r.artworkUrl}
            alt={`Cover art for ${r.title}`}
            sizes="(min-width: 768px) 416px, 90vw"
            priority
            className="w-full rounded-[2rem]"
          />
          <div>
            <p className="text-soft">{typeLabel(r.type)}</p>
            <h1 className="mt-2 text-balance font-display text-[clamp(2.25rem,6vw,4.5rem)] font-extrabold uppercase leading-none tracking-tight">
              {r.title}
            </h1>
            <p className="mt-4 text-xl">{r.artist}</p>
            <p className="mt-1 text-soft">
              {formatReleaseDate(r.releaseDate, r.releaseDatePrecision)}
              {r.totalTracks ? `, ${r.totalTracks} ${r.totalTracks === 1 ? "track" : "tracks"}` : ""}
              {r.genres.length ? `, ${r.genres.join(", ")}` : ""}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href={r.externalUrl} external>
                Listen on {platformLabel(r.platform)}
              </ButtonLink>
              {otherLinks.map(([key, href]) => (
                <ButtonLink key={key} href={href} external variant="secondary">
                  {streamingPlatforms[key]}
                </ButtonLink>
              ))}
              {!r.links.spotify ? (
                <ButtonLink
                  href={`https://open.spotify.com/search/${encodeURIComponent(`${r.artist} ${r.title}`)}`}
                  external
                  variant="secondary"
                >
                  Search on Spotify
                </ButtonLink>
              ) : null}
            </div>

            {r.description ? <p className="mt-8 max-w-prose leading-relaxed">{r.description}</p> : null}

            {r.embedUrl ? (
              <iframe
                title={`Play ${r.title} on ${platformLabel(r.platform)}`}
                src={r.embedUrl}
                width="100%"
                height={r.embedHeight ?? 352}
                loading="lazy"
                allow="autoplay *; clipboard-write; encrypted-media *; fullscreen *; picture-in-picture *"
                className="mt-8 max-w-xl rounded-xl border-0"
              />
            ) : null}
          </div>
        </div>

        {r.tracks.length > 0 ? (
          <section aria-labelledby="tracklist-heading" className="mt-16 max-w-3xl">
            <h2 id="tracklist-heading" className="font-display text-2xl font-bold tracking-tight">
              Tracklist
            </h2>
            <ol className="mt-5 border-b border-rule">
              {r.tracks.map((t) => (
                <li key={t.id} className="flex items-baseline gap-4 border-t border-rule py-3">
                  <span className="w-8 shrink-0 text-right text-sm tabular-nums text-soft">
                    {multiDisc ? `${t.discNumber}.${t.trackNumber}` : t.trackNumber}
                  </span>
                  <span className="flex-1">
                    {t.externalUrl ? (
                      <a href={t.externalUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {t.title}
                      </a>
                    ) : (
                      t.title
                    )}
                    {t.explicit ? (
                      <span className="ml-2 rounded border border-rule px-1.5 text-xs text-soft" title="Explicit content">
                        E
                      </span>
                    ) : null}
                  </span>
                  <span className="text-sm tabular-nums text-soft">{formatDuration(t.durationMs)}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </article>
    </>
  );
}
