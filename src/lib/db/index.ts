import "server-only";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { getEnv } from "../env";
import * as schema from "./schema";

function create(url: string, ssl: boolean) {
  const pool = mysql.createPool({
    uri: url,
    connectionLimit: 3, // kecil: tiap instance serverless punya pool sendiri
    maxIdle: 1,
    idleTimeout: 60_000,
    enableKeepAlive: true,
    waitForConnections: true,
    connectTimeout: 10_000,
    timezone: "Z", // simpan & baca waktu sebagai UTC
    // TLS aktif secara default (wajib di hampir semua MySQL cloud). Matikan hanya untuk MySQL lokal.
    ssl: ssl ? { minVersion: "TLSv1.2", rejectUnauthorized: true } : undefined,
  });
  return drizzle(pool, { schema, mode: "default" });
}

let instance: ReturnType<typeof create> | null | undefined;

/** Mengembalikan null jika DATABASE_URL belum diatur — website tetap berjalan (mode fallback). */
export function getDb() {
  if (instance !== undefined) return instance;
  const env = getEnv();
  instance = env.DATABASE_URL ? create(env.DATABASE_URL, env.DATABASE_SSL !== "false") : null;
  return instance;
}

export type Db = NonNullable<ReturnType<typeof getDb>>;
