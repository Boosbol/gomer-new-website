import { site } from "@/config/site";

/**
 * Judul bergaya cap: balok merah dengan tepi kasar + huruf gelap. Efek kasar dibuat dengan filter SVG
 * (feTurbulence + feDisplacementMap), jadi tetap berupa teks yang bisa dibaca mesin pencari & pembaca layar.
 */
export function StampTitle({ text = site.name }: { text?: string }) {
  const words = text.replace(/['’]/g, "").toUpperCase().split(/\s+/).filter(Boolean);
  return (
    <h1 aria-label={text} className="font-stamp text-[clamp(3.25rem,13vw,10.5rem)] leading-none">
      <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
        <filter id="stamp-rough" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" />
        </filter>
      </svg>
      {words.map((word, i) => (
        <span key={word + i} aria-hidden className={`block ${i > 0 ? "-mt-[0.04em]" : ""}`}>
          <span
            style={{ filter: "url(#stamp-rough)" }}
            className="inline-block bg-stamp px-[0.16em] pb-[0.02em] pt-[0.06em] text-[#0f1a2b]"
          >
            {word}
          </span>
        </span>
      ))}
    </h1>
  );
}
