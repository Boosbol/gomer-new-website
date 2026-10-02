import { SocialIcon } from "@/components/icons";
import type { SocialKey } from "@/config/site";

export function StreamingIcons({
  links,
  size = "sm",
  className = "",
}: {
  links: { key: SocialKey; label: string; url: string }[];
  size?: "sm" | "lg";
  className?: string;
}) {
  if (links.length === 0) return null;
  const dim = size === "lg" ? "h-11 w-11" : "h-6 w-6";
  return (
    <ul className={`flex flex-wrap items-center justify-center ${size === "lg" ? "gap-x-10 gap-y-6" : "gap-x-5 gap-y-3"} ${className}`}>
      {links.map((l) => (
        <li key={l.key}>
          <a href={l.url} target="_blank" rel="noopener noreferrer me" aria-label={l.label} title={l.label} className="block hover:opacity-70">
            <SocialIcon name={l.key} className={dim} />
          </a>
        </li>
      ))}
    </ul>
  );
}
