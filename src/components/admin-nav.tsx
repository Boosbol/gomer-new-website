import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";

const items = [
  { href: "/admin", label: "Beranda" },
  { href: "/admin/content", label: "Biodata & Link" },
  { href: "/admin/photos", label: "Foto" },
  { href: "/admin/gallery", label: "Gallery" },
  { href: "/admin/videos", label: "Video" },
  { href: "/admin/sync", label: "Musik & Sinkron" },
];

export function AdminNav() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4 text-sm">
        <span className="font-display text-base font-bold">Admin</span>
        <nav aria-label="Menu admin" className="flex flex-wrap gap-x-4 gap-y-1 text-mute">
          {items.map((i) => (
            <Link key={i.href} href={i.href} className="hover:text-bone">
              {i.label}
            </Link>
          ))}
          <a href="/" target="_blank" rel="noopener" className="hover:text-bone">
            Lihat website ↗
          </a>
        </nav>
        <form action={logoutAction} className="ml-auto">
          <button type="submit" className="text-mute hover:text-bone">
            Keluar
          </button>
        </form>
      </div>
    </header>
  );
}

export function Notice({ params }: { params: Record<string, string | string[] | undefined> }) {
  const messages: Record<string, string> = {
    saved: "Tersimpan. Perubahan sudah tampil di website.",
    deleted: "Berhasil dihapus.",
  };
  const errors: Record<string, string> = {
    invalid: "Isian tidak valid. Periksa lagi (link harus diawali https://, email harus benar).",
    invalid_url: "Tautan YouTube tidak dikenali. Tempel alamat video dari YouTube.",
    no_database: "Database belum terhubung (DATABASE_URL).",
    save: "Gagal menyimpan. Coba lagi; jika berulang, cek Runtime Logs.",
  };
  const okKey = Object.keys(messages).find((k) => params[k]);
  const errKey = typeof params.error === "string" ? params.error : null;
  if (!okKey && !errKey) return null;
  const isError = !!errKey;
  return (
    <p
      role="status"
      className={`mb-6 rounded-md border px-4 py-3 text-sm ${isError ? "border-flare/60 text-flare" : "border-emerald-400/40 text-emerald-300"}`}
    >
      {isError ? (errors[errKey!] ?? "Terjadi kesalahan.") : messages[okKey!]}
    </p>
  );
}
