import { describe, expect, it } from "vitest";
import { createSessionToken, sessionSecret, verifySessionToken } from "./session";

const secret = sessionSecret("password-admin-panjang", "cron-secret-yang-cukup-panjang-123");

describe("session token", () => {
  it("valid selama belum kedaluwarsa", async () => {
    const token = await createSessionToken(secret, 1_000_000, 60);
    expect(await verifySessionToken(secret, token, 1_000_000 + 30_000)).toBe(true);
  });
  it("ditolak setelah kedaluwarsa", async () => {
    const token = await createSessionToken(secret, 1_000_000, 60);
    expect(await verifySessionToken(secret, token, 1_000_000 + 61_000)).toBe(false);
  });
  it("ditolak jika tanda tangan atau waktu diubah", async () => {
    const token = await createSessionToken(secret, 1_000_000, 60);
    const [v, exp, sig] = token.split(".");
    expect(await verifySessionToken(secret, `${v}.${Number(exp) + 99999}.${sig}`, 1_000_000)).toBe(false);
    expect(await verifySessionToken(secret, `${v}.${exp}.${"0".repeat(64)}`, 1_000_000)).toBe(false);
    expect(await verifySessionToken(secret, `${v}.${exp}.zz`, 1_000_000)).toBe(false);
  });
  it("ditolak dengan secret berbeda (mis. password diganti) dan untuk input kosong/rusak", async () => {
    const token = await createSessionToken(secret, 1_000_000, 60);
    expect(await verifySessionToken(sessionSecret("password-baru-123456", "cron-secret-yang-cukup-panjang-123"), token, 1_000_000)).toBe(false);
    expect(await verifySessionToken(secret, undefined)).toBe(false);
    expect(await verifySessionToken(secret, "abc")).toBe(false);
  });
});
