import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";
import { getDb } from "@/lib/db";
import { listMedia } from "@/services/media";
import { listAllVideos } from "@/services/videos";

const cards = [
  { href: "/admin/content", title: "Biodata & Link", text: "Tulis bio, tagline, email kontak, dan link sosial media." },
  { href: "/admin/photos", title: "Foto", text: "Unggah foto, atur keterangan, pilih foto untuk bagian About." },
  { href: "/admin/videos", title: "Video", text: "Tambah video YouTube lewat tautan, atau sembunyikan video." },
  { href: "/admin/sync", title: "Musik & Sinkron", text: "Lihat status sinkronisasi rilisan dan jalankan manual." },
];

export default async function AdminHome() {
  const hasDb = getDb() !== null;
  const [photos, videos] = hasDb ? await Promise.all([listMedia(), listAllVideos()]) : [[], []];

  return (
    <>
      <AdminNav />
      <div className="mx-auto w-full max-w-4xl px-5 py-10">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Halo 👋</h1>
        <p className="mt-2 text-mute">
          Rilisan musik diperbarui otomatis. Di sini Anda mengatur sisanya.
          {hasDb ? ` Saat ini ada ${photos.length} foto dan ${videos.length} video.` : ""}
        </p>
        {!hasDb ? <p className="mt-4 text-flare">DATABASE_URL belum diatur, jadi fitur edit belum bisa dipakai.</p> : null}
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
