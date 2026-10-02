import { WhatsAppGlyph } from "@/components/icons";
import { getSiteData } from "@/services/site";

export async function WhatsAppButton() {
  const { content } = await getSiteData();
  if (!content.whatsapp) return null;
  return (
    <a
      href={`https://wa.me/${content.whatsapp}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 grid h-16 w-16 place-items-center rounded-full bg-[#0f8a5b] text-white shadow-lg shadow-black/30 hover:bg-[#0c7a50]"
    >
      <WhatsAppGlyph className="h-8 w-8" />
    </a>
  );
}
