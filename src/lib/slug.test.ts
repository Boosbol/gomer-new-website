import { describe, expect, it } from "vitest";
import { slugify, uniqueSlug } from "./slug";

describe("slugify", () => {
  it("menghapus aksen dan tanda baca", () => {
    expect(slugify("Café Déjà Vu!")).toBe("cafe-deja-vu");
    expect(slugify("Gomer Lapudo'oh")).toBe("gomer-lapudooh");
  });
  it("memberi fallback jika kosong", () => {
    expect(slugify("！！！")).toBe("release");
  });
});

describe("uniqueSlug", () => {
  it("memakai sufiks lalu angka saat bentrok", () => {
    const taken = new Set(["lagu", "lagu-2026"]);
    expect(uniqueSlug("lagu", taken, ["2026", "abc123"])).toBe("lagu-abc123");
    taken.add("lagu-abc123");
    expect(uniqueSlug("lagu", taken, ["2026", "abc123"])).toBe("lagu-2");
    expect(uniqueSlug("baru", taken)).toBe("baru");
  });
});
