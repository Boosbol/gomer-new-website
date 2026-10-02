import type { DatePrecision, ReleaseType } from "@/integrations/types";

const PUBLIC_LOCALE = "en-AU"; // tanggal di website publik (bahasa Inggris)
const ADMIN_LOCALE = "id-ID"; // tanggal di halaman admin (bahasa Indonesia)

/** Memformat "YYYY-MM-DD" sesuai presisi asli dari platform (tahun / bulan / hari). */
export function formatReleaseDate(iso: string, precision: DatePrecision = "day"): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y) return iso;
  const date = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  const options: Intl.DateTimeFormatOptions =
    precision === "year"
      ? { year: "numeric" }
      : precision === "month"
        ? { year: "numeric", month: "long" }
        : { year: "numeric", month: "long", day: "numeric" };
  return new Intl.DateTimeFormat(PUBLIC_LOCALE, { ...options, timeZone: "UTC" }).format(date);
}

export function formatDateTime(date: Date | string | null, timeZone: string): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat(ADMIN_LOCALE, { dateStyle: "long", timeStyle: "short", timeZone }).format(new Date(date));
}

export function formatDuration(ms: number | null): string {
  if (ms == null) return "";
  const total = Math.round(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function isoDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  return `PT${Math.floor(total / 60)}M${total % 60}S`;
}

const TYPE_LABELS: Record<ReleaseType, string> = {
  album: "Album",
  single: "Single",
  ep: "EP",
  compilation: "Compilation",
};

export const typeLabel = (type: ReleaseType) => TYPE_LABELS[type];
