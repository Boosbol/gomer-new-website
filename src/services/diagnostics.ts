import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { describeDatabaseUrl, describeUrlStart, type DatabaseUrlInfo } from "@/lib/env-clean";
import { envProblems } from "@/lib/env";
import { scrub } from "@/lib/logger";

export const REQUIRED_TABLES = ["releases", "tracks", "videos", "sync_runs", "settings", "media", "gallery_sections"] as const;

export interface DatabaseStatus {
  configured: boolean;
  connected: boolean;
  /** Pesan singkat dalam bahasa Indonesia tentang penyebab & cara memperbaiki (tanpa rahasia). */
  hint: string | null;
  code: string | null;
  missingTables: string[];
  /** Yang terbaca dari DATABASE_URL (tanpa password) agar bisa dicocokkan dengan hPanel. */
  details: DatabaseUrlInfo | null;
}

function errorCode(error: unknown): string | null {
  let current: unknown = error;
  for (let i = 0; i < 4 && current; i++) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string") return code;
    current = (current as { cause?: unknown }).cause;
  }
  return null;
}

function messageOf(error: unknown): string {
  let current: unknown = error;
  const parts: string[] = [];
  for (let i = 0; i < 4 && current; i++) {
    const m = (current as { message?: unknown }).message;
    if (typeof m === "string") parts.push(m);
    current = (current as { cause?: unknown }).cause;
  }
  return scrub(parts.join(" | ")).slice(0, 300);
}

function hintFor(code: string | null, message: string): string {
  const text = `${code ?? ""} ${message}`.toLowerCase();
  if (code === "ER_ACCESS_DENIED_ERROR" || text.includes("access denied"))
    return "Username atau password ditolak server database. Pastikan password di alamat SAMA dengan password user itu di hPanel (jika ragu: hPanel → Databases → Change password, lalu perbarui alamatnya). Password dengan karakter @ : / # harus di-encode (contoh @ → %40).";
  if (code === "ER_BAD_DB_ERROR" || text.includes("unknown database"))
    return "Nama database di DATABASE_URL tidak ditemukan. Periksa penulisan nama database (biasanya berawalan u123456789_).";
  if (code === "ECONNREFUSED") return "Server database menolak koneksi. Pastikan host 127.0.0.1 dan port 3306 (jika aplikasi & database di Hostinger yang sama).";
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") return "Alamat host database tidak ditemukan. Periksa bagian host pada DATABASE_URL.";
  if (code === "ETIMEDOUT" || code === "PROTOCOL_CONNECTION_LOST" || text.includes("timeout"))
    return "Koneksi ke database timeout. Jika database ada di luar server aplikasi, pastikan Remote MySQL diizinkan.";
  if (text.includes("ssl") || text.includes("tls") || text.includes("handshake"))
    return "Masalah SSL/TLS. Untuk koneksi lokal 127.0.0.1 isi DATABASE_SSL=false.";
  return "Tidak dapat terhubung ke database. Periksa DATABASE_URL dan DATABASE_SSL, lalu lihat Runtime Logs.";
}

/** Memeriksa koneksi database dan keberadaan semua tabel. Tidak pernah melempar error; tidak membocorkan secret. */
export async function checkDatabase(): Promise<DatabaseStatus> {
  const raw = process.env.DATABASE_URL;
  const problems = envProblems();
  const details = describeDatabaseUrl(raw);

  if (!raw || raw.trim() === "") {
    return {
      configured: false,
      connected: false,
      hint: 'Variabel DATABASE_URL belum ada/kosong. Tambahkan di Environment variables aplikasi Node.js (nama harus persis "DATABASE_URL"), lalu tunggu deploy ulang.',
      code: null,
      missingTables: [],
      details,
    };
  }
  if (problems.includes("DATABASE_URL")) {
    return {
      configured: false,
      connected: false,
      hint: `DATABASE_URL terbaca ${describeUrlStart(raw)}, padahal harus diawali "mysql://". Bentuk yang benar: mysql://USERNAME:PASSWORD@127.0.0.1:3306/NAMA_DATABASE — tanpa tanda kutip dan tanpa "jdbc:".`,
      code: null,
      missingTables: [],
      details,
    };
  }

  let db: ReturnType<typeof getDb>;
  try {
    db = getDb();
  } catch {
    return { configured: true, connected: false, hint: "Gagal menyiapkan koneksi database. Lihat Runtime Logs.", code: null, missingTables: [], details };
  }
  if (!db) {
    return { configured: false, connected: false, hint: "DATABASE_URL tidak dapat dibaca. Periksa penulisannya.", code: null, missingTables: [], details };
  }

  try {
    await db.execute(sql`select 1`);
  } catch (error) {
    const code = errorCode(error);
    const ignored = problems.length > 0 ? ` (Variabel lain yang bentuknya salah dan diabaikan: ${problems.join(", ")}.)` : "";
    return { configured: true, connected: false, hint: hintFor(code, messageOf(error)) + ignored, code, missingTables: [], details };
  }

  const missing: string[] = [];
  for (const table of REQUIRED_TABLES) {
    try {
      await db.execute(sql.raw(`select 1 from \`${table}\` limit 1`));
    } catch {
      missing.push(table);
    }
  }
  const ignored = problems.length > 0 ? `Variabel yang bentuknya salah dan diabaikan: ${problems.join(", ")}. ` : "";
  return {
    configured: true,
    connected: true,
    code: null,
    missingTables: missing,
    details,
    hint:
      missing.length > 0
        ? `${ignored}Terhubung, tetapi tabel belum lengkap. Impor database/schema.sql lewat phpMyAdmin (tab Import).`
        : ignored || null,
  };
}
