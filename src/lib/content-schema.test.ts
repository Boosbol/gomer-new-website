import { describe, expect, it } from "vitest";
import { contentSchema, defaultContent, paragraphs, parseStoredContent, socialsFor, STREAMING_KEYS } from "./content-schema";

describe("content schema", () => {
  it("default: teks awal dari website lama dan link sosial terisi dari konfigurasi", () => {
    const c = defaultContent();
    expect(c.bio).toContain("Timor Island");
    expect(paragraphs(c.bio)).toHaveLength(3);
    expect(c.eventTitle).toBe("Djariwalla Launching");
    expect(c.socials.appleMusic).toContain("music.apple.com");
    expect(c.socials.amazonMusic).toBe("");
  });
  it("menolak URL non-https, email, WhatsApp, dan video yang tidak valid", () => {
    const base = defaultContent();
    expect(contentSchema.safeParse({ ...base, socials: { ...base.socials, instagram: "javascript:alert(1)" } }).success).toBe(false);
    expect(contentSchema.safeParse({ ...base, socials: { ...base.socials, instagram: "http://x.example" } }).success).toBe(false);
    expect(contentSchema.safeParse({ ...base, contactEmail: "bukan-email" }).success).toBe(false);
    expect(contentSchema.safeParse({ ...base, contactEmail: "a@b.co" }).success).toBe(true);
    expect(contentSchema.safeParse({ ...base, whatsapp: "+61 412" }).success).toBe(false);
    expect(contentSchema.safeParse({ ...base, whatsapp: "61412345678" }).success).toBe(true);
    expect(contentSchema.safeParse({ ...base, eventVideoUrl: "https://evil.example/x" }).success).toBe(false);
    expect(contentSchema.safeParse({ ...base, eventVideoUrl: "https://youtu.be/afOr4egzBAQ" }).success).toBe(true);
    expect(contentSchema.safeParse({ ...base, heroImageId: "bukan-uuid" }).success).toBe(false);
  });
  it("data tersimpan yang rusak jatuh ke default; link kosong menyembunyikan ikon", () => {
    expect(parseStoredContent("{bukan json")).toEqual(defaultContent());
    const stored = JSON.stringify({ ...defaultContent(), socials: { ...defaultContent().socials, spotify: "" } });
    const list = socialsFor(parseStoredContent(stored), STREAMING_KEYS);
    expect(list.find((s) => s.key === "spotify")).toBeUndefined();
    expect(list.find((s) => s.key === "appleMusic")).toBeDefined();
  });
  it("data lama tanpa field baru tetap terbaca (field baru memakai default)", () => {
    const old = JSON.stringify({ tagline: "Halo", bio: "Satu.\n\nDua.", contactEmail: "", aboutImageId: null, location: "X", socials: {} });
    const c = parseStoredContent(old);
    expect(c.tagline).toBe("Halo");
    expect(c.whatsapp).toBe("");
    expect(c.eventTitle).toBe("Djariwalla Launching");
  });
  it("memecah bio menjadi paragraf", () => {
    expect(paragraphs("Satu.\n\nDua.\n   \nTiga.")).toEqual(["Satu.", "Dua.", "Tiga."]);
    expect(paragraphs("")).toEqual([]);
  });
});
