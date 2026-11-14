import Link from "next/link";
import { notFound } from "next/navigation";
import { getAirbaseBySlug } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SourcesList } from "@/app/components/SourcesList";
import { AIRBASE_TYPE_LABELS, AIRBASE_UNIT_CATEGORY_LABELS } from "@/lib/regionalKnowledge";
import type { ArticleSource } from "@/lib/types";

function Stat({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined) return null;
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}

export default async function AirbasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const base = await getAirbaseBySlug(slug);
  if (!base) notFound();

  const session = await getSession();
  const sources: ArticleSource[] = JSON.parse(base.sources);

  return (
    <>
      <SiteHeader role={session?.role ?? null} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
        <div>
          <Link
            href={`/regional-knowledge/country/${encodeURIComponent(base.country)}`}
            className="font-mono text-xs text-accent hover:underline"
          >
            ← {base.country}
          </Link>
          <h1 className="stencil mt-2 text-2xl text-foreground">{base.name}</h1>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-gold">
            {base.operator} · {AIRBASE_TYPE_LABELS[base.baseType]}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-foreground">{base.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 rounded border border-border bg-panel p-4 sm:grid-cols-4">
          <Stat label="Coordinates" value={`${base.latitude.toFixed(4)}, ${base.longitude.toFixed(4)}`} />
          <Stat label="ICAO Code" value={base.icaoCode} />
          <Stat label="Runway" value={base.runwayDesignator} />
          <Stat
            label="Runway Length"
            value={base.runwayLengthFt ? `${base.runwayLengthFt.toLocaleString()} ft` : null}
          />
          <Stat label="Runway Width" value={base.runwayWidthFt ? `${base.runwayWidthFt} ft` : null} />
          <Stat label="Elevation" value={base.elevationFt ? `${base.elevationFt} ft` : null} />
          <Stat label="Runway Count" value={base.runwayCount} />
        </div>

        {base.units.length > 0 && (
          <div>
            <p className="stencil mb-2 text-xs tracking-widest text-muted">Based Units</p>
            <div className="flex flex-col gap-2">
              {base.units.map((u) => (
                <div key={u.id} className="rounded border border-border bg-panel p-3">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-gold">
                    {AIRBASE_UNIT_CATEGORY_LABELS[u.category]}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{u.unitName}</p>
                  {u.aircraftType && (
                    <p className="mt-0.5 text-xs text-muted">
                      {u.aircraft ? (
                        <Link
                          href={`/regional-knowledge/aircraft/${u.aircraft.slug}`}
                          className="text-accent hover:underline"
                        >
                          {u.aircraftType}
                        </Link>
                      ) : (
                        u.aircraftType
                      )}
                      {u.approxCount ? ` · approx. ${u.approxCount}` : ""}
                    </p>
                  )}
                  {u.notes && <p className="mt-1 text-xs text-muted">{u.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {(() => {
          const linkedAircraft = new Map(
            base.units.filter((u) => u.aircraft).map((u) => [u.aircraft!.slug, u.aircraft!])
          );
          if (linkedAircraft.size === 0) return null;
          return (
            <div>
              <p className="stencil mb-2 text-xs tracking-widest text-muted">Aircraft Based Here</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[...linkedAircraft.values()].map((a) => (
                  <Link
                    key={a.slug}
                    href={`/regional-knowledge/aircraft/${a.slug}`}
                    className="overflow-hidden rounded border border-border bg-panel transition-colors hover:border-accent"
                  >
                    {a.imageUrl ? (
                      <div className="aspect-video w-full overflow-hidden bg-panel-2">
                        {/* eslint-disable-next-line @next/next/no-img-element -- external, arbitrary-host photo */}
                        <img src={a.imageUrl} alt={a.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="aspect-video w-full bg-panel-2" />
                    )}
                    <p className="p-2 text-xs font-semibold text-foreground">{a.name}</p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })()}

        <SourcesList sources={sources} />
      </main>
    </>
  );
}
