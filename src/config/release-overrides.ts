import type { StreamingPlatform } from "@/integrations/streaming";
import type { ReleaseType } from "@/integrations/types";

/**
 * Data yang TIDAK disediakan Spotify (deskripsi, tautan platform lain) diisi di sini,
 * dengan kunci = Spotify album ID (bagian akhir URL album). Semuanya opsional.
 * Website tidak pernah mengarang data: jika tidak diisi, bagian itu tidak ditampilkan.
 *
 * Contoh:
 *   "4aawyAB9vmqN3uQ7FjRGTy": {
 *     description: "Catatan singkat tentang rilisan ini.",
 *     links: { appleMusic: "https://music.apple.com/...", bandcamp: "https://..." },
 *   },
 */
export interface ReleaseOverride {
  description?: string;
  type?: ReleaseType; // koreksi jika klasifikasi otomatis EP/Single kurang tepat
  hidden?: boolean; // sembunyikan rilisan dari website
  links?: Partial<Record<StreamingPlatform, string>>;
}

export const releaseOverrides: Record<string, ReleaseOverride> = {};
