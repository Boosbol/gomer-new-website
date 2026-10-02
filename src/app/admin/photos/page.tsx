import { clearImageRoleAction, deletePhotoAction, setImageRoleAction, updatePhotoAction } from "@/app/admin/actions";
import { AdminNav, Notice } from "@/components/admin-nav";
import { PhotoUploader } from "@/components/photo-uploader";
import { IMAGE_ROLES, type ImageRole } from "@/lib/content-schema";
import { getContent } from "@/services/content";
import { listSections } from "@/services/gallery";
import { listMedia } from "@/services/media";

const btn = "rounded-full border border-bone/40 px-4 py-2 text-xs font-semibold hover:border-bone";
const input = "w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-bone";

const ROLE_LABELS: Record<ImageRole, string> = {
  logo: "Logo (header & footer)",
  hero: "Foto latar halaman depan",
  galleryHero: "Foto latar halaman Gallery",
  event: "Latar bagian Event",
};

export default async function PhotosPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const [photos, content, sections] = await Promise.all([listMedia(), getContent(), listSections()]);
  const roleOf = (id: string) => (Object.keys(IMAGE_ROLES) as ImageRole[]).filter((r) => content[IMAGE_ROLES[r]] === id);

  return (
    <>
      <AdminNav />
      <div className="mx-auto w-full max-w-4xl px-5 py-10">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Foto</h1>
        <p className="mb-6 mt-2 text-sm text-mute">
          Unggah foto, lalu atur: bagian Gallery-nya, atau jadikan Logo / foto latar. Bagian Gallery dibuat di menu &quot;Gallery&quot;.
        </p>
        <Notice params={params} />
        <PhotoUploader />

        <section className="mt-10 rounded-lg border border-line p-4">
          <h2 className="font-display text-xl font-bold">Foto khusus yang sedang dipakai</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {(Object.keys(IMAGE_ROLES) as ImageRole[]).map((role) => {
              const id = content[IMAGE_ROLES[role]];
              return (
                <li key={role} className="flex items-center gap-3 text-sm">
                  {id ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/media/${id}`} alt="" className="h-12 w-12 rounded object-cover" />
                  ) : (
                    <span className="grid h-12 w-12 place-items-center rounded border border-line text-xs text-mute">—</span>
                  )}
                  <span className="flex-1">{ROLE_LABELS[role]}</span>
                  {id ? (
                    <form action={clearImageRoleAction}>
                      <input type="hidden" name="role" value={role} />
                      <button type="submit" className={btn}>
                        Lepas
                      </button>
                    </form>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>

        {photos.length === 0 ? (
          <p className="mt-10 text-mute">Belum ada foto.</p>
        ) : (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2">
            {photos.map((p) => (
              <li key={p.id} className="rounded-lg border border-line p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/media/${p.id}`} alt={p.caption ?? "Foto"} loading="lazy" className="aspect-[4/3] w-full rounded bg-panel object-contain" />
                {roleOf(p.id).length > 0 ? (
                  <p className="mt-2 text-xs text-emerald-300">✓ Dipakai sebagai: {roleOf(p.id).map((r) => ROLE_LABELS[r]).join(", ")}</p>
                ) : null}

                <form action={updatePhotoAction} className="mt-3 space-y-2">
                  <input type="hidden" name="id" value={p.id} />
                  <input name="caption" defaultValue={p.caption ?? ""} maxLength={300} placeholder="Keterangan (opsional, bahasa Inggris)" className={input} />
                  <select name="sectionId" defaultValue={p.sectionId ?? ""} className={input}>
                    <option value="">Bagian Gallery: (tanpa bagian)</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        Bagian Gallery: {s.title}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="inGallery" defaultChecked={p.inGallery} /> Tampilkan di halaman Gallery
                  </label>
                  <button type="submit" className={btn}>
                    Simpan
                  </button>
                </form>

                <form action={setImageRoleAction} className="mt-3 flex gap-2">
                  <input type="hidden" name="id" value={p.id} />
                  <select name="role" defaultValue="hero" className={input}>
                    {(Object.keys(IMAGE_ROLES) as ImageRole[]).map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className={`${btn} shrink-0`}>
                    Pakai sebagai
                  </button>
                </form>

                <form action={deletePhotoAction} className="mt-3">
                  <input type="hidden" name="id" value={p.id} />
                  <button type="submit" className={`${btn} text-flare`}>
                    Hapus foto
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
