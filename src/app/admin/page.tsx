import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";
import { checkDatabase } from "@/services/diagnostics";
import { listMedia } from "@/services/media";
import { listAllVideos } from "@/services/videos";

const cards = [
  { href: "/admin/content", title: "Biodata & Link", text: "Teks pengantar, biodata, bagian event, WhatsApp, dan link streaming/sosial." },
  { href: "/admin/photos", title: "Foto", text: "Unggah foto dan logo; jadikan foto latar; atur bagian Gallery." },
  { href: "/admin/gallery", title: "Gallery", text: "Buat bagian Gallery (judul, keterangan, tata letak)." },
  { href: "/admin/videos", title: "Video", text: "Tambah video YouTube lewat tautan, atau sembunyikan video." },
  { href: "/admin/sync", title: "Musik & Sinkron", text: "Status sinkronisasi rilisan dan tombol sinkron manual." },
];

export default async function AdminHome() {
  const db = await checkDatabase();
  const ready = db.connected && db.missingTables.length === 0;
  const [photos, videos] = ready ? await Promise.all([listMedia(), listAllVideos()]) : [[], []];

  return (
    <>
      <AdminNav />
      <div className="mx-auto w-full max-w-4xl px-5 py-10">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Admin</h1>

        <section
          aria-label="Status database"
          className={`mt-6 rounded-lg border p-4 text-sm ${ready ? "border-emerald-400/40" : "border-flare/60"}`}
        >
          <p className={`font-semibold ${ready ? "text-emerald-300" : "text-flare"}`}>
            {ready
              ? "✓ Database terhubung dan semua tabel tersedia."
              : !db.configured
                ? "✗ Database belum diatur."
                : !db.connected
                  ? "✗ Database tidak dapat dihubungi."
                  : "✗ Database terhubung, tetapi tabel belum lengkap."}
          </p>
          {db.hint ? <p className="mt-2 text-bone/90">{db.hint}</p> : null}
          {db.code ? <p className="mt-1 text-xs text-mute">Kode: {db.code}</p> : null}
          {db.missingTables.length > 0 ? <p className="mt-1 text-xs text-mute">Tabel yang belum ada: {db.missingTables.join(", ")}</p> : null}
          {!ready ? (
            <p className="mt-3 text-mute">
              Selama database belum siap, unggah foto, link video, dan penyimpanan biodata <strong>tidak akan berfungsi</strong>. Setelah memperbaiki
              environment variables di Hostinger (dan Redeploy), muat ulang halaman ini.
            </p>
          ) : (
            <p className="mt-2 text-mute">
              Saat ini ada {photos.length} foto dan {videos.length} video.
            </p>
          )}
        </section>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {cards.map((c) => (
            <li key={c.href}>
              <Link href={c.href} className="block h-full rounded-lg border border-line p-5 hover:border-bone/60">
                <h2 className="font-display text-xl font-bold">{c.title}</h2>
                <p className="mt-1 text-sm text-mute">{c.text}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
