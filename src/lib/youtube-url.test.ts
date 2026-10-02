import { describe, expect, it } from "vitest";
import { parseYouTubeId } from "./youtube-url";

describe("parseYouTubeId", () => {
  it("mengenali berbagai bentuk tautan", () => {
    const id = "afOr4egzBAQ";
    expect(parseYouTubeId(`https://www.youtube.com/watch?v=${id}&t=10s`)).toBe(id);
    expect(parseYouTubeId(`https://youtu.be/${id}?si=abc`)).toBe(id);
    expect(parseYouTubeId(`https://www.youtube.com/shorts/${id}`)).toBe(id);
    expect(parseYouTubeId(`https://m.youtube.com/watch?v=${id}`)).toBe(id);
    expect(parseYouTubeId(`youtube.com/embed/${id}`)).toBe(id);
    expect(parseYouTubeId(id)).toBe(id);
  });
  it("menolak tautan lain atau tidak valid", () => {
    expect(parseYouTubeId("https://evil.example/watch?v=afOr4egzBAQ")).toBeNull();
    expect(parseYouTubeId("https://www.youtube.com/watch?v=pendek")).toBeNull();
    expect(parseYouTubeId("")).toBeNull();
  });
});
