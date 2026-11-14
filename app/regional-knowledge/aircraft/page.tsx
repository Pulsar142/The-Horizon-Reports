import Link from "next/link";
import { getPublishedAircraft } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { SiteHeader } from "@/app/components/SiteHeader";
import { AIRCRAFT_ROLE_LABELS } from "@/lib/regionalKnowledge";

export default async function AircraftIndexPage() {
  const [aircraft, session] = await Promise.all([getPublishedAircraft(), getSession()]);

  return (
    <>
      <SiteHeader role={session?.role ?? null} />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6">
        <div>
          <Link href="/regional-knowledge" className="font-mono text-xs text-accent hover:underline">
            ← Regional Knowledge
          </Link>
          <h1 className="stencil mt-2 text-2xl text-foreground">Aircraft Platforms</h1>
          <p className="mt-2 max-w-2xl font-mono text-xs text-muted">
            Aircraft types currently operated by South East Asian air forces — compiled from
            manufacturer datasheets, official air force releases, and established defence
            references.
          </p>
        </div>

        {aircraft.length === 0 ? (
          <p className="rounded border border-border bg-panel p-6 text-center text-sm text-muted">
            No published aircraft platforms yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {aircraft.map((a) => (
              <Link
                key={a.id}
                href={`/regional-knowledge/aircraft/${a.slug}`}
                className="flex gap-3 rounded border border-border bg-panel p-4 transition-colors hover:border-accent"
              >
                {a.imageUrl && (
                  <div className="h-16 w-24 shrink-0 overflow-hidden rounded border border-border bg-panel-2">
                    {/* eslint-disable-next-line @next/next/no-img-element -- external, arbitrary-host thumbnail */}
                    <img src={a.imageUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-gold">
                    {AIRCRAFT_ROLE_LABELS[a.role]}
                  </p>
                  <h2 className="mt-1 text-sm font-semibold text-foreground">{a.name}</h2>
                  <p className="mt-1 text-xs text-muted">{a.manufacturer}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
