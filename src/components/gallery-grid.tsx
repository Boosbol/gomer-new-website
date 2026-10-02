import Image from "next/image";
import { site } from "@/config/site";
import type { GalleryGroup } from "@/lib/gallery-group";
import type { MediaMeta } from "@/services/media";

function Photo({ p, fill = false }: { p: MediaMeta; fill?: boolean }) {
  return (
    <Image
      src={`/api/media/${p.id}`}
      alt={p.caption || `Photo of ${site.name}`}
      width={p.width ?? 1200}
      height={p.height ?? 800}
      unoptimized
      loading="lazy"
      className={fill ? "h-full w-full object-cover" : "h-auto w-full"}
    />
  );
}

/** Satu bagian Gallery: judul di tengah, keterangan, lalu foto (baris rata atau kolom bertingkat). */
export function GallerySectionBlock({ group }: { group: GalleryGroup<MediaMeta> }) {
  const { section, photos } = group;
  return (
    <section aria-label={section.title} className="mx-auto w-full max-w-[1224px] px-5 py-16">
      <h2 className="text-balance text-center font-display text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-tight">{section.title}</h2>
      {section.subtitle ? <p className="mt-4 text-center text-soft">{section.subtitle}</p> : null}

      {section.layout === "masonry" ? (
        <div className="mx-auto mt-14 max-w-3xl columns-2 gap-3 md:columns-4">
          {photos.map((p) => (
            <a key={p.id} href={`/api/media/${p.id}`} target="_blank" rel="noopener noreferrer" className="mb-3 block break-inside-avoid overflow-hidden bg-rule/40">
              <Photo p={p} />
            </a>
          ))}
        </div>
      ) : (
        // Baris rata: tiap foto melebar sesuai rasio aslinya sehingga tinggi satu baris seragam.
        <div className="mt-14 flex flex-wrap gap-2 after:flex-[10] after:content-['']">
          {photos.map((p) => {
            const ratio = (p.width ?? 3) / (p.height ?? 2);
            return (
              <a
                key={p.id}
                href={`/api/media/${p.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden bg-rule/40"
                style={{ flex: `${ratio} 1 ${Math.round(ratio * 200)}px` }}
              >
                <Photo p={p} fill />
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}
