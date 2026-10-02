import { describe, expect, it } from "vitest";
import { adminEnvProblems, readAdminEnv } from "./admin-env";

const good = { ADMIN_USER: "gomer", ADMIN_PASSWORD: "password-panjang-123", CRON_SECRET: "x".repeat(24) };

describe("readAdminEnv", () => {
  it("membaca kredensial dan membuang spasi di awal/akhir", () => {
    expect(readAdminEnv({ ...good, ADMIN_USER: " gomer ", ADMIN_PASSWORD: "password-panjang-123\n" })).toEqual({
      user: "gomer",
      password: "password-panjang-123",
      cron: "x".repeat(24),
    });
  });
  it("tidak bergantung pada variabel lain yang mungkin tidak valid", () => {
    expect(readAdminEnv({ ...good, DATABASE_URL: "bukan-mysql", MUSIC_SOURCE: "ngawur" })).not.toBeNull();
  });
  it("null bila ada yang kurang atau terlalu pendek", () => {
    expect(readAdminEnv({ ...good, ADMIN_PASSWORD: "pendek" })).toBeNull();
    expect(readAdminEnv({ ...good, CRON_SECRET: "pendek" })).toBeNull();
    expect(readAdminEnv({ ...good, ADMIN_USER: "  " })).toBeNull();
    expect(readAdminEnv({})).toBeNull();
  });
  it("melaporkan masalah tanpa membocorkan nilai", () => {
    const problems = adminEnvProblems({ ADMIN_USER: "gomer", ADMIN_PASSWORD: "rahasia", CRON_SECRET: "" });
    expect(problems).toEqual(["ADMIN_PASSWORD kurang dari 12 karakter", "CRON_SECRET belum diisi"]);
    expect(problems.join()).not.toContain("rahasia");
  });
});
