import { saveContentAction } from "@/app/admin/actions";
import { AdminNav, Notice } from "@/components/admin-nav";
import { socials } from "@/config/site";
import { SOCIAL_KEYS } from "@/lib/content-schema";
import { getContent } from "@/services/content";

const field = "mt-1 w-full rounded-md border border-line bg-panel px-3 py-2 text-bone";
const box = "space-y-4 rounded-lg border border-line p-4";

export default async function ContentPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const c = await getContent();

  return (
    <>
      <AdminNav />
      <div className="mx-auto w-full max-w-4xl px-5 py-10">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Biodata & Link</h1>
        <p className="mb-6 mt-2 text-sm text-mute">Teks di website ditampilkan dalam bahasa Inggris — tulis isian di bawah dalam bahasa Inggris.</p>
        <Notice params={params} />

        <form action={saveContentAction} className="space-y-6">
          <fieldset className={box}>
            <legend className="px-2 text-sm font-semibold">Halaman depan</legend>
            <label className="block text-sm">
              Teks pengantar (paragraf di bawah tulisan GOMER LAPUDOOH di bagian atas)
              <textarea name="tagline" defaultValue={c.tagline} rows={5} maxLength={600} className={field} />
            </label>
            <label className="block text-sm">
              Biodata (di samping sampul rilisan terbaru, juga tujuan menu About). Pisahkan paragraf dengan satu baris kosong.
              <textarea name="bio" defaultValue={c.bio} rows={12} maxLength={8000} className={field} />
            </label>
          </fieldset>

          <fieldset className={box}>
            <legend className="px-2 text-sm font-semibold">Bagian event / peluncuran (kosongkan judul untuk menyembunyikan)</legend>
            <label className="block text-sm">
              Judul (contoh: Djariwalla Launching)
              <input name="eventTitle" defaultValue={c.eventTitle} maxLength={120} className={field} />
            </label>
            <label className="block text-sm">
              Baris tanggal/kota (contoh: 2025 • JUNE • SYDNEY)
              <input name="eventLine" defaultValue={c.eventLine} maxLength={120} className={field} />
            </label>
            <label className="block text-sm">
              Tempat / alamat
              <input name="eventVenue" defaultValue={c.eventVenue} maxLength={240} className={field} />
            </label>
            <label className="block text-sm">
              Video YouTube di bagian ini (opsional, tempel tautan)
              <input name="eventVideoUrl" defaultValue={c.eventVideoUrl} maxLength={300} placeholder="https://www.youtube.com/watch?v=…" className={field} />
            </label>
            <p className="text-xs text-mute">Foto latar bagian ini dipilih di halaman Foto (&quot;Latar bagian Event&quot;).</p>
          </fieldset>

          <fieldset className={box}>
            <legend className="px-2 text-sm font-semibold">Kontak</legend>
            <label className="block text-sm">
              Nomor WhatsApp untuk tombol hijau melayang (angka saja dengan kode negara, contoh 61412345678; kosong = tombol disembunyikan)
              <input name="whatsapp" defaultValue={c.whatsapp} inputMode="tel" maxLength={25} className={field} />
            </label>
            <label className="block text-sm">
              Email (opsional, tampil di footer)
              <input name="contactEmail" type="email" defaultValue={c.contactEmail} maxLength={200} className={field} />
            </label>
          </fieldset>

          <fieldset className={box}>
            <legend className="px-2 text-sm font-semibold">Link streaming & sosial media (kosongkan untuk menyembunyikan ikonnya)</legend>
            {SOCIAL_KEYS.map((key) => (
              <label key={key} className="block text-sm">
                {socials[key].label}
                <input name={key} type="url" defaultValue={c.socials[key]} maxLength={300} placeholder="https://…" className={field} />
              </label>
            ))}
          </fieldset>

          <button type="submit" className="rounded-full bg-bone px-6 py-3 text-sm font-semibold text-night hover:bg-white">
            Simpan
          </button>
        </form>
      </div>
    </>
  );
}
