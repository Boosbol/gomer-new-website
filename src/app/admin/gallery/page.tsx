import { createSectionAction, deleteSectionAction, updateSectionAction } from "@/app/admin/actions";
import { AdminNav, Notice } from "@/components/admin-nav";
import { listSections } from "@/services/gallery";
import { listMedia } from "@/services/media";

const input = "mt-1 w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-bone";
const btn = "rounded-full border border-bone/40 px-4 py-2 text-xs font-semibold hover:border-bone";

function SectionFields({ s }: { s?: { title: string; subtitle: string | null; layout: string; sortOrder: number } }) {
  return (
    <>
      <label className="block text-sm">
        Judul bagian (contoh: Session photoshoot)
        <input name="title" required defaultValue={s?.title ?? ""} maxLength={160} className={input} />
      </label>
      <label className="block text-sm">
        Keterangan di bawah judul (opsional)
        <input name="subtitle" defaultValue={s?.subtitle ?? ""} maxLength={300} className={input} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          Tata letak
          <select name="layout" defaultValue={s?.layout ?? "rows"} className={input}>
            <option value="rows">Baris rata (foto sejajar dalam baris)</option>
            <option value="masonry">Kolom bertingkat (masonry)</option>
          </select>
        </label>
        <label className="block text-sm">
          Urutan (angka kecil tampil lebih dulu)
          <input name="sortOrder" type="number" min={0} max={9999} defaultValue={s?.sortOrder ?? 0} className={input} />
        </label>
      </div>
    </>
  );
}

export default async function GalleryAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const [sections, photos] = await Promise.all([listSections(), listMedia()]);
  const countFor = (id: string) => photos.filter((p) => p.sectionId === id).length;

  return (
    <>
      <AdminNav />
      <div className="mx-auto w-full max-w-4xl px-5 py-10">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Bagian Gallery</h1>
        <p className="mb-6 mt-2 text-sm text-mute">
          Halaman Gallery terdiri dari bagian-bagian dengan judul. Buat bagiannya di sini, lalu pilih bagian untuk tiap foto di menu Foto.
        </p>
        <Notice params={params} />

        <form action={createSectionAction} className="space-y-3 rounded-lg border border-line p-4">
          <h2 className="font-display text-xl font-bold">Tambah bagian baru</h2>
          <SectionFields />
          <button type="submit" className="rounded-full bg-bone px-6 py-3 text-sm font-semibold text-night hover:bg-white">
            Tambah bagian
          </button>
        </form>

        <ul className="mt-8 space-y-6">
          {sections.map((s) => (
            <li key={s.id} className="rounded-lg border border-line p-4">
              <p className="mb-3 text-xs text-mute">{countFor(s.id)} foto di bagian ini</p>
              <form action={updateSectionAction} className="space-y-3">
                <input type="hidden" name="id" value={s.id} />
                <SectionFields s={s} />
                <button type="submit" className={btn}>
                  Simpan perubahan
                </button>
              </form>
              <form action={deleteSectionAction} className="mt-3">
                <input type="hidden" name="id" value={s.id} />
                <button type="submit" className={`${btn} text-flare`}>
                  Hapus bagian (foto tidak ikut terhapus)
                </button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
