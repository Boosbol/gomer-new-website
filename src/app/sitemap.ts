import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { loadReleases } from "@/services/releases";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { items } = await loadReleases();
  return [
    { url: site.url, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/music`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${site.url}/gallery`, changeFrequency: "monthly", priority: 0.5 },
    ...items.map((r) => ({
      url: `${site.url}/music/${r.slug}`,
      lastModified: new Date(r.fetchedAt ?? r.releaseDate),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
