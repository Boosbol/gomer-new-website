import { ButtonLink } from "@/components/buttons";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader tone="dark" />
      <div className="mx-auto max-w-[1224px] px-5 py-24">
        <h1 className="font-display text-5xl font-extrabold tracking-tight">Page not found</h1>
        <p className="mt-4 max-w-md text-soft">The link may be wrong, or the release has moved.</p>
        <div className="mt-8">
          <ButtonLink href="/music">See all music</ButtonLink>
        </div>
      </div>
    </>
  );
}
