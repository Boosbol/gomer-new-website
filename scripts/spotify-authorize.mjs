// OPSIONAL — hanya jika Client Credentials tidak cukup. Menghasilkan SPOTIFY_REFRESH_TOKEN.
// Jalankan lokal:  npm run spotify:authorize
// Prasyarat: SPOTIFY_CLIENT_ID & SPOTIFY_CLIENT_SECRET di .env.local, dan Redirect URI
// "http://127.0.0.1:8888/callback" sudah didaftarkan di Spotify Developer Dashboard.
import crypto from "node:crypto";
import http from "node:http";

const id = process.env.SPOTIFY_CLIENT_ID;
const secret = process.env.SPOTIFY_CLIENT_SECRET;
if (!id || !secret) {
  console.error("Isi SPOTIFY_CLIENT_ID dan SPOTIFY_CLIENT_SECRET di .env.local terlebih dahulu.");
  process.exit(1);
}

const PORT = 8888;
const REDIRECT = `http://127.0.0.1:${PORT}/callback`;
const state = crypto.randomBytes(16).toString("hex");

const authUrl = new URL("https://accounts.spotify.com/authorize");
authUrl.search = new URLSearchParams({
  client_id: id,
  response_type: "code",
  redirect_uri: REDIRECT,
  state,
  show_dialog: "true",
}).toString();

console.log("Buka URL ini di browser, lalu setujui akses:\n\n" + authUrl + "\n");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);
  if (url.pathname !== "/callback") {
    res.writeHead(404).end();
    return;
  }
  if (url.searchParams.get("state") !== state) {
    res.writeHead(400).end("State tidak cocok. Ulangi proses dari terminal.");
    return;
  }
  const code = url.searchParams.get("code");
  if (!code) {
    res.writeHead(400).end("Tidak ada authorization code: " + (url.searchParams.get("error") ?? "unknown"));
    return;
  }

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: REDIRECT }),
  });
  const data = await tokenRes.json().catch(() => ({}));

  if (!tokenRes.ok || !data.refresh_token) {
    res.writeHead(500).end("Gagal menukar code (HTTP " + tokenRes.status + "). Lihat terminal.");
    console.error("Gagal menukar code:", tokenRes.status, data.error ?? "");
    server.close();
    process.exitCode = 1;
    return;
  }

  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" }).end("Berhasil. Kembali ke terminal.");
  console.log(
    "\nSPOTIFY_REFRESH_TOKEN (salin ke environment variables hosting; jangan dibagikan atau di-commit):\n\n" +
      data.refresh_token +
      "\n",
  );
  server.close();
});

server.listen(PORT, "127.0.0.1", () => console.log(`Menunggu callback di ${REDIRECT} ...`));
