import Link from "next/link";
import { notFound } from "next/navigation";
import { getAircraftBySlug } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SourcesList } from "@/app/components/SourcesList";
import { AIRCRAFT_ROLE_LABELS, WEAPON_CATEGORY_LABELS } from "@/lib/regionalKnowledge";
import type { ArticleSource } from "@/lib/types";

type Operator = { country: string; variant?: string; approxCount?: number; sources?: ArticleSource[] };

function Stat({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined) return null;
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}

export default async function AircraftPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const aircraft = await getAircraftBySlug(slug);
  if (!aircraft) notFound();

  const session = await getSession();
  const sources: ArticleSource[] = JSON.parse(aircraft.sources);
  const operators: Operator[] = JSON.parse(aircraft.operatorsInRegion);

  return (
    <>
      <SiteHeader role={session?.role ?? null} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
        <div>
          <Link href="/regional-knowledge/aircraft" className="font-mono text-xs text-accent hover:underline">
            ← Aircraft Platforms
          </Link>
          <h1 className="stencil mt-2 text-2xl text-foreground">{aircraft.name}</h1>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-gold">
            {aircraft.manufacturer} · {AIRCRAFT_ROLE_LABELS[aircraft.role]}
          </p>
        </div>

        {aircraft.imageUrl && (
          <div className="overflow-hidden rounded border border-border bg-panel-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- external, arbitrary-host photo */}
            <img src={aircraft.imageUrl} alt={aircraft.name} className="aspect-video w-full object-cover" />
          </div>
        )}

        <p className="text-sm leading-relaxed text-foreground">{aircraft.description}</p>

        <div className="grid grid-cols-2 gap-4 rounded border border-border bg-panel p-4 sm:grid-cols-3">
          <Stat label="First Flight" value={aircraft.firstFlight} />
          <Stat label="Crew" value={aircraft.crew} />
          <Stat label="Length" value={aircraft.lengthFt ? `${aircraft.lengthFt} ft` : null} />
          <Stat label="Wingspan" value={aircraft.wingspanFt ? `${aircraft.wingspanFt} ft` : null} />
          <Stat label="Height" value={aircraft.heightFt ? `${aircraft.heightFt} ft` : null} />
          <Stat label="Max Speed" value={aircraft.maxSpeed} />
          <Stat label="Combat Radius" value={aircraft.combatRadiusNm ? `${aircraft.combatRadiusNm} nm` : null} />
          <Stat
            label="Service Ceiling"
            value={aircraft.serviceCeilingFt ? `${aircraft.serviceCeilingFt.toLocaleString()} ft` : null}
          />
          <Stat
            label="Max Takeoff Weight"
            value={aircraft.maxTakeoffWeightLbs ? `${aircraft.maxTakeoffWeightLbs.toLocaleString()} lbs` : null}
          />
        </div>

        {aircraft.armamentSummary && (
          <div className="rounded border border-danger/40 bg-panel p-4">
            <p className="stencil mb-2 text-xs tracking-widest text-danger">Armament</p>
            <p className="text-sm leading-relaxed text-foreground">{aircraft.armamentSummary}</p>
          </div>
        )}

        {aircraft.weapons.length > 0 && (
          <div>
            <p className="stencil mb-2 text-xs tracking-widest text-muted">Compatible Weapons</p>
            <div className="flex flex-col gap-3">
              {Object.entries(
                aircraft.weapons.reduce<Record<string, typeof aircraft.weapons>>((groups, w) => {
                  (groups[w.weapon.category] ??= []).push(w);
                  return groups;
                }, {})
              ).map(([category, weapons]) => (
                <div key={category}>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    {WEAPON_CATEGORY_LABELS[category as keyof typeof WEAPON_CATEGORY_LABELS]}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {weapons.map((w) => (
                      <Link
                        key={w.id}
                        href={`/regional-knowledge/weapon/${w.weapon.slug}`}
                        className="rounded border border-border bg-panel px-3 py-1.5 text-xs text-accent hover:border-accent hover:underline"
                      >
                        {w.weapon.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {operators.length > 0 && (
          <div>
            <p className="stencil mb-2 text-xs tracking-widest text-muted">Operators in the Region</p>
            <div className="flex flex-col gap-2">
              {operators.map((op, i) => (
                <div key={i} className="rounded border border-border bg-panel p-3 text-sm">
                  <Link
                    href={`/regional-knowledge/country/${encodeURIComponent(op.country)}`}
                    className="font-semibold text-accent hover:underline"
                  >
                    {op.country}
                  </Link>
                  {op.variant && <span className="text-muted"> — {op.variant}</span>}
                  {op.approxCount ? <span className="text-muted"> · approx. {op.approxCount}</span> : ""}
                </div>
              ))}
            </div>
          </div>
        )}

        {aircraft.variants && (
          <div>
            <p className="stencil mb-2 text-xs tracking-widest text-muted">Variants</p>
            <p className="text-sm leading-relaxed text-foreground">{aircraft.variants}</p>
          </div>
        )}

        <SourcesList sources={sources} />
      </main>
    </>
  );
}
