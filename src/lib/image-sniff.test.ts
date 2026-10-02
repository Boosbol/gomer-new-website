import { describe, expect, it } from "vitest";
import { sniffImageMime } from "./image-sniff";

describe("sniffImageMime", () => {
  it("mengenali JPEG, PNG, WebP dari byte awal", () => {
    expect(sniffImageMime(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0]))).toBe("image/jpeg");
    expect(sniffImageMime(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))).toBe("image/png");
    const webp = Uint8Array.from([...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBP")]);
    expect(sniffImageMime(webp)).toBe("image/webp");
  });
  it("menolak file lain (HTML/SVG/skrip yang menyamar)", () => {
    expect(sniffImageMime(Buffer.from("<svg onload=alert(1)>"))).toBeNull();
    expect(sniffImageMime(Buffer.from("<html>"))).toBeNull();
    expect(sniffImageMime(new Uint8Array())).toBeNull();
  });
});
