import Image from "next/image";

export function Artwork({
  src,
  alt,
  sizes,
  priority = false,
  className = "",
}: {
  src: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  if (!src) {
    return (
      <div role="img" aria-label={alt} className={`grid aspect-square place-items-center bg-rule/40 text-soft ${className}`}>
        <svg className="h-1/4 w-1/4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
          <path d="M9 18V6l10-2v12" />
          <circle cx="6.5" cy="18" r="2.5" />
          <circle cx="16.5" cy="16" r="2.5" />
        </svg>
      </div>
    );
  }
  return (
    <div className={`relative aspect-square overflow-hidden bg-rule/40 ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}
