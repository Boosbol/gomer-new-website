import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readAdminEnv } from "./admin-env";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  sessionSecret,
  verifySessionToken,
} from "./session";

function adminSecrets() {
  return readAdminEnv(process.env); // mandiri: tidak ikut gagal bila variabel lain (mis. DATABASE_URL) tidak valid
}

const digest = (s: string) => createHash("sha256").update(s).digest();
const safeEqual = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));

export const adminEnabled = () => adminSecrets() !== null;

/** Constant-time; keduanya selalu dibandingkan agar waktu respons tidak membocorkan mana yang salah. */
export function checkCredentials(user: string, password: string): boolean {
  const s = adminSecrets();
  if (!s) return false;
  const okUser = safeEqual(user.trim(), s.user);
  const okPass = safeEqual(password.trim(), s.password);
  return okUser && okPass;
}

export async function isAdmin(): Promise<boolean> {
  const s = adminSecrets();
  if (!s) return false;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(sessionSecret(s.password, s.cron), token);
}

/** Dipanggil di setiap server action / route admin (pertahanan berlapis di samping middleware). */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function startSession(): Promise<void> {
  const s = adminSecrets();
  if (!s) throw new Error("Admin belum dikonfigurasi");
  const token = await createSessionToken(sessionSecret(s.password, s.cron));
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Untuk route handler yang mengubah data: Origin harus sama dengan host situs (perlindungan CSRF tambahan). */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return host !== null && new URL(origin).host === host;
  } catch {
    return false;
  }
}
