/**
 * Pembacaan kredensial admin yang MANDIRI (tidak bergantung pada validasi env lain), dipakai bersama oleh
 * middleware (Edge) dan server (Node) agar keduanya selalu menghitung hal yang sama.
 * Nilai di-trim: spasi/baris baru yang tak sengaja ikut tersalin tidak membuat login gagal.
 */
export interface AdminEnv {
  user: string;
  password: string;
  cron: string;
}

type EnvLike = Record<string, string | undefined>;

export function readAdminEnv(env: EnvLike): AdminEnv | null {
  const user = env.ADMIN_USER?.trim();
  const password = env.ADMIN_PASSWORD?.trim();
  const cron = env.CRON_SECRET?.trim();
  if (!user || !password || password.length < 12 || !cron || cron.length < 24) return null;
  return { user, password, cron };
}

/** Hanya nama variabel dan jenis masalah — tidak pernah nilainya. */
export function adminEnvProblems(env: EnvLike): string[] {
  const problems: string[] = [];
  const user = env.ADMIN_USER?.trim();
  const password = env.ADMIN_PASSWORD?.trim();
  const cron = env.CRON_SECRET?.trim();
  if (!user) problems.push("ADMIN_USER belum diisi");
  if (!password) problems.push("ADMIN_PASSWORD belum diisi");
  else if (password.length < 12) problems.push("ADMIN_PASSWORD kurang dari 12 karakter");
  if (!cron) problems.push("CRON_SECRET belum diisi");
  else if (cron.length < 24) problems.push("CRON_SECRET kurang dari 24 karakter");
  return problems;
}
