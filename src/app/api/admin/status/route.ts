import { json } from "@/lib/api";
import { getMusicProviders } from "@/integrations/registry";
import { isYouTubeConfigured } from "@/lib/env";
import { getSyncStatus } from "@/services/sync";

export const dynamic = "force-dynamic";

// Dilindungi Basic Auth oleh src/middleware.ts (matcher /api/admin/:path*).
export async function GET() {
  const status = await getSyncStatus();
  return json({
    ...status,
    configured: {
      music: getMusicProviders().map((p) => ({ id: p.id, configured: p.isConfigured() })),
      youtube: isYouTubeConfigured(),
    },
  });
}
