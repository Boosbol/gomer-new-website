import { loginAction } from "@/app/admin/actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const message =
    error === "locked"
      ? "Terlalu banyak percobaan. Coba lagi dalam 15 menit."
      : error === "invalid"
        ? "Username atau password salah."
        : null;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-5">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Admin login</h1>
      <p className="mt-2 text-sm text-mute">Masuk untuk mengubah biodata, foto, dan video.</p>
      {message ? (
        <p role="alert" className="mt-5 rounded-md border border-flare/60 px-4 py-3 text-sm text-flare">
          {message}
        </p>
      ) : null}
      <form action={loginAction} className="mt-6 space-y-4">
        <label className="block text-sm">
          Username
          <input
            name="username"
            type="text"
            required
            autoComplete="username"
            className="mt-1 w-full rounded-md border border-line bg-panel px-3 py-2 text-bone"
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-md border border-line bg-panel px-3 py-2 text-bone"
          />
        </label>
        <button type="submit" className="w-full rounded-full bg-bone px-6 py-3 text-sm font-semibold text-night hover:bg-white">
          Masuk
        </button>
      </form>
    </div>
  );
}
