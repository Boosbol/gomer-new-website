/**
 * Menjalankan sync dari terminal (sinkronisasi awal / debugging):
 *   npm run sync:music            # cooldown berlaku
 *   npm run sync:music -- --force # abaikan cooldown
 * Memakai kredensial dari .env.local; tidak pernah mencetak secret.
 */
import { scrub } from "@/lib/logger";
import { syncMusic, syncVideos } from "@/services/sync";

async function main() {
  const target = process.argv[2] === "social" ? "social" : "music";
  const force = process.argv.includes("--force");
  const result = target === "social" ? await syncVideos({ force }) : await syncMusic({ force });
  console.log(`Sync ${target} selesai:`, result);
}

main().catch((error) => {
  console.error("Sync gagal:", scrub(error instanceof Error ? error.message : String(error)));
  process.exit(1);
});
