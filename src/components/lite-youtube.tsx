"use client";

import Image from "next/image";
import { useState } from "react";
import { PlayGlyph } from "@/components/icons";

/** Thumbnail dulu; iframe YouTube (domain privacy-enhanced) baru dimuat setelah diklik. */
export function LiteYouTube({ id, title, thumbnail }: { id: string; title: string; thumbnail: string | null }) {
  const [active, setActive] = useState(false);

  if (active) {
    return (
      <iframe
        className="aspect-video w-full rounded-md border-0"
        src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`}
        title={title}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      aria-label={`Play video: ${title}`}
      className="relative block aspect-video w-full overflow-hidden rounded-md bg-panel"
    >
      {thumbnail ? (
        <Image src={thumbnail} alt="" fill sizes="(min-width: 1024px) 640px, 100vw" className="object-cover" />
      ) : null}
      <span className="absolute inset-0 grid place-items-center bg-night/30">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-bone text-night">
          <PlayGlyph className="h-7 w-7" />
        </span>
      </span>
    </button>
  );
}
