/** Pembersih nilai environment variable (murni, mudah diuji). */

/** Membuang spasi, baris baru, dan tanda kutip pembungkus yang sering ikut tersalin. Kosong → undefined. */
export function cleanEnvValue(v: unknown): unknown {
  if (typeof v !== "string") return v;
  let s = v.trim();
  if (s.length >= 2 && ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))) {
    s = s.slice(1, -1).trim();
  }
  return s === "" ? undefined : s;
}

export const lowerEnvValue = (v: unknown) => {
  const c = cleanEnvValue(v);
  return typeof c === "string" ? c.toLowerCase() : c;
};

export const isMysqlUrl = (v: string) => /^mysql:\/\/.+/i.test(v);

/** Menjelaskan awalan nilai tanpa membocorkan username/password (hanya skema di depan "://"). */
export function describeUrlStart(raw: string | undefined): string {
  if (!raw || raw.trim() === "") return "kosong";
  const t = raw.trim();
  if (t.startsWith('"') || t.startsWith("'")) return "diawali tanda kutip";
  const m = /^([A-Za-z0-9+.:_-]{1,16}):\/\//.exec(t);
  if (m) return `diawali "${m[1]}://"`;
  return "tidak berbentuk alamat (tidak ada ://)";
}
