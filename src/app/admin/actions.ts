"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkCredentials, endSession, requireAdmin, startSession } from "@/lib/admin-auth";
import { IMAGE_ROLES, SOCIAL_KEYS, contentSchema, type ImageRole } from "@/lib/content-schema";
import { sleep } from "@/lib/http";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import { createSection, deleteSection, updateSection } from "@/services/gallery";
import { deleteMedia, updateMedia } from "@/services/media";
import { getContent, saveContent } from "@/services/content";
import { addManualVideo, deleteManualVideo, setVideoHidden } from "@/services/videos";
import { syncMusic, syncVideos } from "@/services/sync";

const str = (fd: FormData, key: string) => (typeof fd.get(key) === "string" ? (fd.get(key) as string) : "");
const refreshSite = () => revalidatePath("/", "layout");

// ─── Login / logout ───────────────────────────────────────────────────────────
export async function loginAction(formData: FormData) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const rl = rateLimit(`login:${ip}`, 5, 15 * 60_000);
  if (!rl.ok) redirect("/admin/login?error=locked");

  if (!checkCredentials(str(formData, "username"), str(formData, "password"))) {
    logger.warn("admin login failed");
    await sleep(700); // memperlambat tebak-tebakan password
    redirect("/admin/login?error=invalid");
  }
  await startSession();
  logger.info("admin login success");
  redirect("/admin");
}

export async function logoutAction() {
  await endSession();
  redirect("/admin/login");
}

// ─── Konten (teks, event, kontak, link) ─────────────────────────────────────────
export async function saveContentAction(formData: FormData) {
  await requireAdmin();
  const current = await getContent();
  const parsed = contentSchema.safeParse({
    tagline: str(formData, "tagline"),
    bio: str(formData, "bio"),
    contactEmail: str(formData, "contactEmail"),
    whatsapp: str(formData, "whatsapp").replace(/\D/g, ""), // "+62 812-3456" → "628123456"
    // Gambar diatur dari halaman Foto — dipertahankan apa adanya.
    logoImageId: current.logoImageId,
    heroImageId: current.heroImageId,
    galleryHeroImageId: current.galleryHeroImageId,
    eventImageId: current.eventImageId,
    eventTitle: str(formData, "eventTitle"),
    eventLine: str(formData, "eventLine"),
    eventVenue: str(formData, "eventVenue"),
    eventVideoUrl: str(formData, "eventVideoUrl"),
    socials: Object.fromEntries(SOCIAL_KEYS.map((k) => [k, str(formData, k)])),
  });
  if (!parsed.success) redirect("/admin/content?error=invalid");
  try {
    await saveContent(parsed.data);
  } catch (error) {
    logger.error("save content failed", { error });
    redirect("/admin/content?error=save");
  }
  refreshSite();
  redirect("/admin/content?saved=1");
}

// ─── Foto ───────────────────────────────────────────────────────────────────────
const UUID = /^[0-9a-f-]{36}$/i;

export async function updatePhotoAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const sectionRaw = str(formData, "sectionId");
  if (!UUID.test(id) || (sectionRaw !== "" && !UUID.test(sectionRaw))) redirect("/admin/photos?error=invalid");
  await updateMedia(id, {
    caption: str(formData, "caption").trim().slice(0, 300) || null,
    inGallery: formData.get("inGallery") === "on",
    sectionId: sectionRaw === "" ? null : sectionRaw,
  });
  refreshSite();
  redirect("/admin/photos?saved=1");
}

/** Menetapkan foto sebagai Logo / Hero halaman depan / Hero Gallery / Latar bagian Event. */
export async function setImageRoleAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const role = str(formData, "role");
  if (!UUID.test(id) || !(role in IMAGE_ROLES)) redirect("/admin/photos?error=invalid");
  const field = IMAGE_ROLES[role as ImageRole];
  await saveContent({ ...(await getContent()), [field]: id });
  refreshSite();
  redirect("/admin/photos?saved=1");
}

export async function clearImageRoleAction(formData: FormData) {
  await requireAdmin();
  const role = str(formData, "role");
  if (!(role in IMAGE_ROLES)) redirect("/admin/photos?error=invalid");
  const field = IMAGE_ROLES[role as ImageRole];
  await saveContent({ ...(await getContent()), [field]: null });
  refreshSite();
  redirect("/admin/photos?saved=1");
}

export async function deletePhotoAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  if (!UUID.test(id)) redirect("/admin/photos?error=invalid");
  const content = await getContent();
  await deleteMedia(id);
  // Jika foto dipakai sebagai logo/hero/dll., lepaskan agar tidak menjadi gambar rusak.
  const cleared = { ...content };
  for (const field of Object.values(IMAGE_ROLES)) if (cleared[field] === id) cleared[field] = null;
  if (JSON.stringify(cleared) !== JSON.stringify(content)) await saveContent(cleared);
  refreshSite();
  redirect("/admin/photos?deleted=1");
}

// ─── Bagian Gallery ─────────────────────────────────────────────────────────────
function sectionInput(formData: FormData) {
  const title = str(formData, "title").trim().slice(0, 160);
  const order = Number.parseInt(str(formData, "sortOrder"), 10);
  return {
    title,
    subtitle: str(formData, "subtitle").trim().slice(0, 300) || null,
    layout: (str(formData, "layout") === "masonry" ? "masonry" : "rows") as "rows" | "masonry",
    sortOrder: Number.isFinite(order) ? Math.min(Math.max(order, 0), 9999) : 0,
  };
}

export async function createSectionAction(formData: FormData) {
  await requireAdmin();
  const input = sectionInput(formData);
  if (!input.title) redirect("/admin/gallery?error=invalid");
  await createSection(input);
  refreshSite();
  redirect("/admin/gallery?saved=1");
}

export async function updateSectionAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const input = sectionInput(formData);
  if (!UUID.test(id) || !input.title) redirect("/admin/gallery?error=invalid");
  await updateSection(id, input);
  refreshSite();
  redirect("/admin/gallery?saved=1");
}

export async function deleteSectionAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  if (!UUID.test(id)) redirect("/admin/gallery?error=invalid");
  await deleteSection(id);
  refreshSite();
  redirect("/admin/gallery?deleted=1");
}

// ─── Video ──────────────────────────────────────────────────────────────────────
export async function addVideoAction(formData: FormData) {
  await requireAdmin();
  const dateRaw = str(formData, "date");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? new Date(`${dateRaw}T00:00:00Z`) : undefined;
  const result = await addManualVideo({ url: str(formData, "url"), title: str(formData, "title"), publishedAt: date });
  if (!result.ok) redirect(`/admin/videos?error=${result.error}`);
  refreshSite();
  redirect("/admin/videos?saved=1");
}

export async function toggleVideoAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin/videos?error=invalid");
  await setVideoHidden(id, formData.get("hide") === "1");
  refreshSite();
  redirect("/admin/videos?saved=1");
}

export async function deleteVideoAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin/videos?error=invalid");
  await deleteManualVideo(id);
  refreshSite();
  redirect("/admin/videos?deleted=1");
}

// ─── Sinkronisasi manual ────────────────────────────────────────────────────────
export async function runSyncAction(formData: FormData) {
  await requireAdmin();
  const target = str(formData, "target");
  let status = "ok";
  try {
    if (target === "social") await syncVideos({ force: true });
    else await syncMusic({ force: true });
    refreshSite();
  } catch {
    status = "failed"; // detail tercatat di sync_runs & log
  }
  revalidatePath("/admin/sync");
  redirect(`/admin/sync?sync=${status}`);
}
