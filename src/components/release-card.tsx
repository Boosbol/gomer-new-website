import Link from "next/link";
import { Artwork } from "@/components/artwork";
import { typeLabel } from "@/lib/format";
import type { ReleaseView } from "@/services/releases";

export function ReleaseCard({ release }: { release: ReleaseView }) {
  return (
    <Link href={`/music/${release.slug}`} className="group block">
      <Artwork
        src={release.artworkUrl}
        alt={`Cover art for ${release.title}`}
        sizes="(min-width: 1024px) 290px, (min-width: 640px) 33vw, 50vw"
        className="rounded-2xl"
      />
      <h3 className="mt-4 text-xl font-medium uppercase leading-tight group-hover:underline group-hover:underline-offset-4">
        {release.title}
      </h3>
      <p className="mt-1 text-soft">{typeLabel(release.type)}</p>
    </Link>
  );
}

export function ReleaseGrid({ releases }: { releases: ReleaseView[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {releases.map((r) => (
        <ReleaseCard key={r.id} release={r} />
      ))}
    </div>
  );
}
