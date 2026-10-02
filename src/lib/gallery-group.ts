/** Mengelompokkan foto Gallery per bagian. Murni (tanpa database) agar mudah diuji. */
export interface SectionInfo {
  id: string;
  title: string;
  subtitle: string | null;
  layout: "rows" | "masonry";
  sortOrder: number;
}
export interface PhotoInfo {
  id: string;
  width: number | null;
  height: number | null;
  caption: string | null;
  inGallery: boolean;
  sectionId: string | null;
}
export interface GalleryGroup<P extends PhotoInfo = PhotoInfo> {
  section: SectionInfo;
  photos: P[];
}

export const UNSECTIONED: SectionInfo = { id: "_none", title: "Photos", subtitle: null, layout: "rows", sortOrder: Number.MAX_SAFE_INTEGER };

export function groupGallery<P extends PhotoInfo>(sections: SectionInfo[], photos: P[]): GalleryGroup<P>[] {
  const visible = photos.filter((p) => p.inGallery);
  const ordered = [...sections].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
  const known = new Set(ordered.map((s) => s.id));
  const groups: GalleryGroup<P>[] = ordered
    .map((section) => ({ section, photos: visible.filter((p) => p.sectionId === section.id) }))
    .filter((g) => g.photos.length > 0);
  const loose = visible.filter((p) => !p.sectionId || !known.has(p.sectionId));
  if (loose.length > 0) groups.push({ section: UNSECTIONED, photos: loose });
  return groups;
}
