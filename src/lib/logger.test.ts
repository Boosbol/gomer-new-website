import { afterEach, describe, expect, it, vi } from "vitest";
import { logger, scrub } from "./logger";

describe("logger redaction", () => {
  afterEach(() => vi.restoreAllMocks());

  it("menyamarkan nilai secret dari env dan pola umum", () => {
    process.env.SPOTIFY_CLIENT_SECRET = "super-secret-value-123";
    expect(scrub("gagal: super-secret-value-123")).toBe("gagal: [redacted]");
    expect(scrub("Authorization: Bearer abc.def-ghi")).toContain("Bearer [redacted]");
    expect(scrub("https://x.test/?key=AIzaFAKE&a=1")).toContain("key=[redacted]");
    delete process.env.SPOTIFY_CLIENT_SECRET;
  });

  it("tidak mencetak field sensitif", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info("tes", { refreshToken: "rahasia-panjang", authorization: "Bearer zzz", ok: 1 });
    const line = String(spy.mock.calls[0]?.[0]);
    expect(line).not.toContain("rahasia-panjang");
    expect(line).not.toContain("zzz");
    expect(line).toContain('"ok":1');
  });
});
