import { addVideoAction, deleteVideoAction, runSyncAction, toggleVideoAction } from "@/app/admin/actions";
import { AdminNav, Notice } from "@/components/admin-nav";
import { site } from "@/config/site";
import { formatDateTime } from "@/lib/format";
import { listAllVideos } from "@/services/videos";

const field = "mt-1 w-full rounded-md border border-line bg-panel px-3 py-2 text-bone";
const btn = "rounded-full border border-bone/40 px-4 py-2 text-xs font-semibold hover:border-bone";

export default async function VideosPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const videos = await listAllVideos();

  return (
    <>
      <AdminNav />
      <div className="mx-auto w-full max-w-4xl px-5 py-10">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Video</h1>
        <p className="mb-6 mt-2 text-sm text-mute">
          Video dari kanal YouTube Anda muncul otomatis. Anda juga bisa menambah video lain (mis. video orang lain yang menampilkan Anda) lewat tautan.
        </p>
        <Notice params={params} />

        <form action={addVideoAction} className="space-y-4 rounded-lg border border-line p-4">
          <h2 className="font-display text-xl font-bold">Tambah video YouTube</h2>
          <label className="block text-sm">
            Tautan video
            <input name="url" required placeholder="https://www.youtube.com/watch?v=…" className={field} />
          </label>
          <label className="block text-sm">
            Judul (opsional — kosongkan agar diambil otomatis dari YouTube)
            <input name="title" maxLength={400} className={field} />
          </label>
          <label className="block text-sm">
            Tanggal (opsional, menentukan urutan; kosong = hari ini)
            <input name="date" type="date" className={field} />
          </label>
          <button type="submit" className="rounded-full bg-bone px-6 py-3 text-sm font-semibold text-night hover:bg-white">
            Tambah
          </button>
        </form>

        <form action={runSyncAction} className="mt-4">
          <input type="hidden" name="target" value="social" />
          <button type="submit" className={btn}>
            Ambil video terbaru dari YouTube sekarang
          </button>
        </form>

        <h2 className="mt-10 font-display text-xl font-bold">Daftar video ({videos.length})</h2>
        {videos.length === 0 ? (
          <p className="mt-3 text-mute">Belum ada video.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {videos.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center gap-4 py-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {v.thumbnailUrl ? <img src={v.thumbnailUrl} alt="" className="aspect-video w-32 rounded object-cover" loading="lazy" /> : null}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug">{v.title}</p>
                  <p className="text-xs text-mute">
                    {formatDateTime(v.publishedAt, site.timeZone)} · {v.source === "manual" ? "ditambah manual" : "otomatis dari YouTube"}
                    {v.hidden ? " · DISEMBUNYIKAN" : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={toggleVideoAction}>
                    <input type="hidden" name="id" value={v.id} />
                    <input type="hidden" name="hide" value={v.hidden ? "0" : "1"} />
                    <button type="submit" className={btn}>
                      {v.hidden ? "Tampilkan" : "Sembunyikan"}
                    </button>
                  </form>
                  {v.source === "manual" ? (
                    <form action={deleteVideoAction}>
                      <input type="hidden" name="id" value={v.id} />
                      <button type="submit" className={`${btn} text-flare`}>
                        Hapus
                      </button>
                    </form>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
