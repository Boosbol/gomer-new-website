import type { SocialKey } from "@/config/site";

/** Set ikon garis sederhana (stroke = currentColor) agar seragam dengan gaya situs. */
export function SocialIcon({ name, className = "h-5 w-5" }: { name: SocialKey; className?: string }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "spotify":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.5" />
          <path d="M7 9.6c3.4-1 7.2-.7 10.2 1" />
          <path d="M7.6 12.8c2.8-.8 5.8-.5 8.3.9" />
          <path d="M8.3 15.7c2.2-.6 4.4-.4 6.3.6" />
        </svg>
      );
    case "appleMusic":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.5" />
          <path d="M10 16.5V8.2l5-1.2v8" />
          <circle cx="8.6" cy="16.6" r="1.6" />
          <circle cx="13.6" cy="15.4" r="1.6" />
        </svg>
      );
    case "bandcamp":
      return (
        <svg {...common}>
          <path d="M3 17.5 9.2 6.5H21l-6.2 11z" />
        </svg>
      );
    case "amazonMusic":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <path d="M10 14.5V8.5l4-1v6" />
          <circle cx="8.8" cy="14.6" r="1.2" />
          <circle cx="12.8" cy="13.6" r="1.2" />
          <path d="M7 18c3 1.4 7 1.4 10 0" />
        </svg>
      );
    case "deezer":
      return (
        <svg {...common} strokeWidth={2.4}>
          <path d="M4 19v-2M8.5 19v-5M13 19v-8M17.5 19v-11M22 19V5" transform="translate(-1 0)" />
        </svg>
      );
    case "youtubeMusic":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.5" />
          <circle cx="12" cy="12" r="4.6" />
          <path d="M10.8 10v4l3.3-2z" fill="currentColor" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common}>
          <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
          <path d="M10.2 9.2v5.6l4.8-2.8z" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r=".6" fill="currentColor" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common}>
          <path d="M14 3v11.2a3.7 3.7 0 1 1-3.7-3.7" />
          <path d="M14 3c.4 2.6 2 4.3 4.6 4.6" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.5" />
          <path d="M13.4 20.5v-7h2.4l.4-2.8h-2.8V9.2c0-.8.3-1.4 1.5-1.4h1.4V5.3a17 17 0 0 0-2-.1c-2.1 0-3.4 1.2-3.4 3.5v1.9H8.6v2.8h2.3v7" />
        </svg>
      );
  }
}

export function PlayGlyph({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}

export function WhatsAppGlyph({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3z" />
      <path d="M9.2 8.6c.3 2.8 3.4 5.9 6.2 6.2l1.2-1.3-2-1.2-1 .9c-1-.4-2.2-1.6-2.6-2.6l.9-1-1.2-2z" fill="currentColor" stroke="none" />
    </svg>
  );
}
