import { describe, expect, it } from "vitest";
import { groupGallery, type PhotoInfo, type SectionInfo } from "./gallery-group";

const section = (id: string, title: string, sortOrder: number): SectionInfo => ({ id, title, subtitle: null, layout: "rows", sortOrder });
const photo = (id: string, sectionId: string | null, inGallery = true): PhotoInfo => ({ id, width: 100, height: 100, caption: null, inGallery, sectionId });

describe("groupGallery", () => {
  it("mengurutkan bagian, melewati bagian kosong dan foto yang disembunyikan", () => {
    const groups = groupGallery(
      [section("b", "Byron", 2), section("a", "Session", 1), section("c", "Kosong", 3)],
      [photo("1", "b"), photo("2", "a"), photo("3", "a"), photo("4", "a", false)],
    );
    expect(groups.map((g) => g.section.title)).toEqual(["Session", "Byron"]);
    expect(groups[0]?.photos.map((p) => p.id)).toEqual(["2", "3"]);
  });
  it("foto tanpa bagian (atau bagiannya sudah dihapus) masuk ke bagian 'Photos' di akhir", () => {
    const groups = groupGallery([section("a", "Session", 1)], [photo("1", "a"), photo("2", null), photo("3", "sudah-dihapus")]);
    expect(groups.map((g) => g.section.title)).toEqual(["Session", "Photos"]);
    expect(groups[1]?.photos.map((p) => p.id)).toEqual(["2", "3"]);
  });
  it("tanpa foto → tanpa grup", () => {
    expect(groupGallery([section("a", "Session", 1)], [])).toEqual([]);
  });
});
