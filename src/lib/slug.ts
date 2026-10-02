export function slugify(input: string): string {
  return (
    input
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/['’`]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80)
      .replace(/-+$/g, "") || "release"
  );
}

/** Menghasilkan slug yang belum ada di `taken`. Mencoba sufiks yang diberikan, lalu angka. */
export function uniqueSlug(base: string, taken: ReadonlySet<string>, suffixes: string[] = []): string {
  if (!taken.has(base)) return base;
  for (const suffix of suffixes) {
    const candidate = `${base}-${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}
