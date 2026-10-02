import { describe, expect, it } from "vitest";
import { formatDuration, formatReleaseDate, isoDuration } from "./format";

describe("format", () => {
  it("menghormati presisi tanggal", () => {
    expect(formatReleaseDate("2026-09-30", "day")).toContain("2026");
    expect(formatReleaseDate("2026-01-01", "year")).toBe("2026");
  });
  it("memformat durasi", () => {
    expect(formatDuration(215_000)).toBe("3:35");
    expect(formatDuration(null)).toBe("");
    expect(isoDuration(215_000)).toBe("PT3M35S");
  });
});
