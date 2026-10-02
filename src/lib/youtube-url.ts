const ID = /^[\w-]{11}$/;

/** Mengambil ID video dari berbagai bentuk tautan YouTube (watch, youtu.be, shorts, embed, live) atau ID polos. */
export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (ID.test(value)) return value;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m)\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0] ?? "";
    return ID.test(id) ? id : null;
  }
  if (host === "youtube.com" || host === "music.youtube.com" || host === "youtube-nocookie.com") {
    const v = url.searchParams.get("v");
    if (v && ID.test(v)) return v;
    const m = /^\/(?:shorts|embed|live|v)\/([\w-]{11})(?:\/|$)/.exec(url.pathname);
    if (m?.[1]) return m[1];
  }
  return null;
}
