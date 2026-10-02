"use client";

import Link from "next/link";

// Ditampilkan bila halaman admin gagal dimuat (paling sering karena database tidak terhubung).
export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto w-full max-w-xl px-5 py-16">
      <h1 className="font-display text-3xl font-extrabold">Halaman admin gagal dimuat</h1>
      <p className="mt-3 text-mute">
        Penyebab paling umum: database belum tersambung atau tabel belum diimpor. Buka Beranda admin untuk melihat status dan petunjuk perbaikannya.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/admin" className="rounded-full bg-bone px-6 py-3 text-sm font-semibold text-night hover:bg-white">
          Ke Beranda admin
        </Link>
        <button type="button" onClick={reset} className="rounded-full border border-bone/40 px-6 py-3 text-sm font-semibold hover:border-bone">
          Coba lagi
        </button>
      </div>
    </div>
  );
}
