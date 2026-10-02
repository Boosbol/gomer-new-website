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

/** Untuk URL: selain pembersihan biasa, SEMUA spasi/baris baru di dalamnya dibuang (URL tidak boleh berspasi). */
export function cleanUrlValue(v: unknown): unknown {
  const c = cleanEnvValue(v);
  return typeof c === "string" ? c.replace(/\s+/g, "") || undefined : c;
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

export interface DatabaseUrlInfo {
  user: string;
  host: string;
  port: string;
  database: string;
  passwordLength: number;
  warnings: string[];
}

/**
 * Menguraikan DATABASE_URL untuk ditampilkan ke admin: username, host, port, nama database, dan PANJANG
 * password — tidak pernah isi password. Juga memberi peringatan untuk kesalahan umum. null bila tidak bisa dibaca.
 */
export function describeDatabaseUrl(raw: string | undefined): DatabaseUrlInfo | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const warnings: string[] = [];
  if (/\s/.test(trimmed)) warnings.push("Ada spasi/baris baru di dalam nilai DATABASE_URL (biasanya ikut tersalin dari terminal). Aplikasi otomatis membuangnya, tetapi sebaiknya ketik ulang alamat tanpa spasi.");

  let url: URL;
  try {
    url = new URL(trimmed.replace(/\s+/g, ""));
  } catch {
    return null;
  }
  const safeDecode = (s: string) => {
    try {
      return decodeURIComponent(s);
    } catch {
      warnings.push('Ada tanda "%" di username/password yang bukan bentuk encode yang benar.');
      return s;
    }
  };
  const user = safeDecode(url.username);
  const password = safeDecode(url.password);
  const database = safeDecode(url.pathname.replace(/^\//, ""));
  const host = url.hostname;
  const port = url.port || "3306";

  if (!user) warnings.push("Username tidak terbaca (kosong).");
  if (!password) warnings.push("Password tidak terbaca (kosong).");
  else if (password.length < 8) warnings.push(`Password terbaca hanya ${password.length} karakter — apakah terpotong saat disalin?`);
  if (!database) warnings.push("Nama database tidak terbaca (bagian setelah angka 3306/ kosong).");
  if (host !== "127.0.0.1") {
    warnings.push(
      host === "localhost"
        ? 'Host terbaca "localhost" — di Hostinger gunakan 127.0.0.1.'
        : `Host terbaca "${host}". Jika aplikasi dan database berada di akun Hostinger yang sama, host harus 127.0.0.1.`,
    );
  }
  if (port !== "3306") warnings.push(`Port terbaca ${port}; umumnya 3306.`);

  const hostingerPrefix = /^u(\d+)_/;
  const userPrefix = hostingerPrefix.exec(user)?.[1];
  const dbPrefix = hostingerPrefix.exec(database)?.[1];
  if (user && !userPrefix) warnings.push("Username tidak berawalan seperti u123456789_ (username Hostinger biasanya memakai awalan itu).");
  if (database && !dbPrefix) warnings.push("Nama database tidak berawalan seperti u123456789_ (nama database Hostinger biasanya memakai awalan itu).");
  if (userPrefix && dbPrefix && userPrefix !== dbPrefix) warnings.push("Angka awalan username dan nama database berbeda — keduanya seharusnya sama.");

  return { user, host, port, database, passwordLength: password.length, warnings };
}
