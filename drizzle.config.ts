import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Memuat .env.local lalu .env (hanya untuk perintah CLI drizzle-kit di mesin lokal).
config({ path: [".env.local", ".env"] });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL belum diatur (lihat .env.example).");
}

export default defineConfig({
  dialect: "mysql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL },
});
