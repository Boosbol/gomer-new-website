import type { Metadata } from "next";
import { site } from "@/config/site";
import { getMusicProviders } from "@/integrations/registry";
import { platformLabel } from "@/integrations/streaming";
import { isYouTubeConfigured } from "@/lib/env";
import { formatDateTime } from "@/lib/format";
import { runSyncAction } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin-nav";
import { getSyncStatus, type RunRow } from "@/services/sync";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Status sinkronisasi", robots: { index: false, follow: false } };

function statusLabel(configured: boolean, last: RunRow | null): { text: string; tone: string } {
  if (!configured) return { text: "Belum dikonfigurasi", tone: "text-mute" };
  if (!last) return { text: "Belum pernah sinkron", tone: "text-mute" };
  if (last.status === "running") return { text: "Sedang berjalan", tone: "text-bone" };
  if (last.status === "success") return { text: "Terhubung", tone: "text-emerald-300" };
  return { text: "Bermasalah", tone: "text-flare" };
}

function Row({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex justify-between gap-6 border-t border-line py-3">
      <dt className="text-mute">{label}</dt>
      <dd className={`text-right ${tone}`}>{value}</dd>
    </div>
  );
}

export default async function AdminSyncPage({ searchParams }: { searchParams: Promise<{ sync?: string }> }) {
  const { sync } = await searchParams;
  const status = await getSyncStatus();
  const music = status.sources.music;
  const social = status.sources.social;
  const provider = getMusicProviders()[0];
  const musicStatus = statusLabel(provider?.isConfigured() ?? false, music.lastRun);
  const youtube = statusLabel(isYouTubeConfigured(), social.lastRun);
  const tz = site.timeZone;

  return (
    <>
    <AdminNav />
    <div className="mx-auto w-full max-w-3xl px-5 py-12">
      <h1 className="font-display text-4xl font-extrabold tracking-tight">Status sinkronisasi</h1>
      {sync === "ok" ? <p className="mt-4 text-emerald-300">Sinkronisasi selesai.</p> : null}
      {sync === "failed" ? <p className="mt-4 text-flare">Sinkronisasi gagal. Lihat &quot;Error terakhir&quot; di bawah.</p> : null}
      {!status.database ? (
        <p className="mt-4 text-flare">DATABASE_URL belum diatur. Sinkronisasi tidak dapat berjalan.</p>
      ) : null}

      <section className="mt-10" aria-labelledby="music-sync">
        <h2 id="music-sync" className="font-display text-2xl font-bold">Sinkronisasi musik</h2>
        <dl className="mt-4 border-b border-line">
          <Row label={`Status ${platformLabel(provider?.id ?? "")}`} value={musicStatus.text} tone={musicStatus.tone} />
          <Row label="Sinkron terakhir" value={formatDateTime(music.lastRun?.startedAt ?? null, tz)} />
          <Row label="Sinkron sukses terakhir" value={formatDateTime(music.lastSuccess?.finishedAt ?? null, tz)} />
          <Row label="Rilisan ditemukan (sinkron terakhir)" value={String(music.lastRun?.itemsFound ?? 0)} />
          <Row label="Rilisan tersimpan" value={String(status.releaseCount)} />
          <Row
            label="Error terakhir"
            value={music.lastRun?.status === "error" ? (music.lastRun.errorMessage ?? "Tidak diketahui") : "Tidak ada"}
            tone={music.lastRun?.status === "error" ? "text-flare" : ""}
          />
        </dl>
        <form action={runSyncAction} className="mt-5">
          <input type="hidden" name="target" value="music" />
          <button type="submit" className="rounded-full bg-bone px-6 py-3 text-sm font-semibold text-night hover:bg-white">
            Sinkronkan musik sekarang
          </button>
        </form>
      </section>

      <section className="mt-12" aria-labelledby="social-sync">
        <h2 id="social-sync" className="font-display text-2xl font-bold">Sinkronisasi video</h2>
        <dl className="mt-4 border-b border-line">
          <Row label="Status YouTube" value={youtube.text} tone={youtube.tone} />
          <Row label="Sinkron terakhir" value={formatDateTime(social.lastRun?.startedAt ?? null, tz)} />
          <Row label="Sinkron sukses terakhir" value={formatDateTime(social.lastSuccess?.finishedAt ?? null, tz)} />
          <Row label="Video tersimpan" value={String(status.videoCount)} />
          <Row
            label="Error terakhir"
            value={social.lastRun?.status === "error" ? (social.lastRun.errorMessage ?? "Tidak diketahui") : "Tidak ada"}
            tone={social.lastRun?.status === "error" ? "text-flare" : ""}
          />
        </dl>
        <form action={runSyncAction} className="mt-5">
          <input type="hidden" name="target" value="social" />
          <button type="submit" className="rounded-full border border-bone/40 px-6 py-3 text-sm font-semibold hover:border-bone">
            Sinkronkan video sekarang
          </button>
        </form>
      </section>
    </div>
    </>
  );
}
