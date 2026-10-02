import type { Metadata } from "next";
import { ButtonLink } from "@/components/buttons";
import { ReleaseGrid } from "@/components/release-card";
import { SiteHeader } from "@/components/site-header";
import { socials } from "@/config/site";
import { typeLabel } from "@/lib/format";
import type { ReleaseType } from "@/integrations/types";
import { loadReleases } from "@/services/releases";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Music",
  description: "All albums, EPs and singles by Gomer Lapudo'oh.",
  alternates: { canonical: "/music" },
};

const ORDER: ReleaseType[] = ["album", "ep", "single", "compilation"];

export default async function MusicPage() {
  const { items } = await loadReleases();

  return (
    <>
      <SiteHeader tone="dark" />
      <div className="mx-auto w-full max-w-[1224px] px-5 pb-24 pt-8">
        <h1 className="font-display text-[clamp(3rem,8vw,6rem)] font-extrabold leading-none tracking-tight">Music</h1>

        {items.length === 0 ? (
          <div className="mt-10 max-w-md">
            <p className="text-soft">No releases have been synced yet. Listen directly on your streaming platform.</p>
            <div className="mt-6">
              <ButtonLink href={socials.appleMusic.url} external>
                Open Apple Music profile
              </ButtonLink>
            </div>
          </div>
        ) : (
          ORDER.map((type) => {
            const group = items.filter((r) => r.type === type);
            if (group.length === 0) return null;
            return (
              <section key={type} aria-labelledby={`grp-${type}`} className="mt-16">
                <h2 id={`grp-${type}`} className="mb-8 font-display text-3xl font-bold tracking-tight">
                  {typeLabel(type)}
                </h2>
                <ReleaseGrid releases={group} />
              </section>
            );
          })
        )}
      </div>
    </>
  );
}
