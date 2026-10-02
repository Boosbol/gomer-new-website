import "server-only";

/**
 * Logger JSON dengan redaksi otomatis. Tidak pernah mencetak client secret, refresh token,
 * API key, password, atau header Authorization — baik lewat nama key maupun lewat nilai.
 */
const SENSITIVE_KEY = /(secret|token|password|passwd|authorization|api[_-]?key|cookie|credential)/i;
const SECRET_ENV_NAMES = [
  "SPOTIFY_CLIENT_SECRET",
  "SPOTIFY_REFRESH_TOKEN",
  "DATABASE_URL",
  "CRON_SECRET",
  "ADMIN_PASSWORD",
];

export function scrub(input: string): string {
  let out = input;
  for (const name of SECRET_ENV_NAMES) {
    const value = process.env[name];
    if (value && value.length >= 6) out = out.split(value).join("[redacted]");
  }
  return out
    .replace(/Bearer\s+[\w.~+/=-]+/gi, "Bearer [redacted]")
    .replace(/Basic\s+[A-Za-z0-9+/=]{8,}/g, "Basic [redacted]")
    .replace(/([?&](?:key|api_key|access_token|client_secret)=)[^&\s]+/gi, "$1[redacted]");
}

function clean(value: unknown, depth = 0): unknown {
  if (value == null) return value;
  if (typeof value === "string") return scrub(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Error) return { name: value.name, message: scrub(value.message) };
  if (depth > 3) return "[truncated]";
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => clean(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEY.test(k) ? "[redacted]" : clean(v, depth + 1);
    }
    return out;
  }
  return String(value);
}

type Level = "info" | "warn" | "error";

function emit(level: Level, message: string, context?: Record<string, unknown>) {
  const line = JSON.stringify({
    level,
    time: new Date().toISOString(),
    message: scrub(message),
    ...(context ? { context: clean(context) } : {}),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => emit("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => emit("error", message, context),
};
