"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const MAX_EDGE = 1800; // px sisi terpanjang
const MAX_BYTES = 1_400_000;

/** Mengecilkan foto di browser (JPEG ≤ ~1,4 MB) sebelum diunggah, supaya cepat dan hemat database. */
async function shrink(file: File, asLogo: boolean): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, (asLogo ? 900 : MAX_EDGE) / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Browser tidak mendukung pemrosesan gambar");
  if (!asLogo) {
    ctx.fillStyle = "#ffffff"; // latar putih untuk PNG transparan (foto biasa disimpan sebagai JPEG)
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  if (asLogo) {
    // Logo: pertahankan transparansi (PNG).
    const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (png && png.size <= MAX_BYTES) return { blob: png, width, height };
    throw new Error("File logo terlalu besar. Gunakan gambar yang lebih kecil.");
  }
  for (const quality of [0.86, 0.75, 0.62, 0.5]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (blob && blob.size <= MAX_BYTES) return { blob, width, height };
  }
  throw new Error("Foto terlalu besar bahkan setelah dikecilkan");
}

export function PhotoUploader() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [asLogo, setAsLogo] = useState(false);

  async function onChange(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setMessage(null);
    let done = 0;
    try {
      for (const file of Array.from(files)) {
        setMessage(`Mengunggah ${done + 1} dari ${files.length}…`);
        const { blob, width, height } = await shrink(file, asLogo);
        const form = new FormData();
        form.set("file", new File([blob], asLogo ? "logo.png" : "photo.jpg", { type: blob.type }));
        if (asLogo) form.set("gallery", "0"); // logo tidak ikut tampil di Gallery
        form.set("width", String(width));
        form.set("height", String(height));
        const res = await fetch("/api/admin/media", { method: "POST", body: form });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error === "unauthorized" ? "Sesi habis. Login ulang." : `Gagal mengunggah (${data.error ?? res.status})`);
        }
        done++;
      }
      setMessage(`${done} foto berhasil diunggah.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal mengunggah");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <label className="inline-flex cursor-pointer items-center rounded-full bg-bone px-6 py-3 text-sm font-semibold text-night hover:bg-white">
        {busy ? "Mengunggah…" : "Pilih foto untuk diunggah"}
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={busy}
          onChange={(e) => onChange(e.target.files)}
          className="sr-only"
        />
      </label>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={asLogo} onChange={(e) => setAsLogo(e.target.checked)} disabled={busy} />
        Ini logo (pertahankan latar transparan; tidak ditampilkan di Gallery)
      </label>
      <p className="mt-2 text-sm text-mute">Format JPG, PNG, atau WebP. Foto otomatis dikecilkan sebelum diunggah.</p>
      {message ? (
        <p role="status" className="mt-3 text-sm">
          {message}
        </p>
      ) : null}
    </div>
  );
}
