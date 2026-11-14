import Link from "next/link";
import { notFound } from "next/navigation";
import { getWeaponBySlug } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SourcesList } from "@/app/components/SourcesList";
import { WEAPON_CATEGORY_LABELS } from "@/lib/regionalKnowledge";
import type { ArticleSource } from "@/lib/types";

type Operator = { country: string; sources?: ArticleSource[] };

function Stat({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined) return null;
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}

export default async function WeaponPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const weapon = await getWeaponBySlug(slug);
  if (!weapon) notFound();

  const session = await getSession();
  const sources: ArticleSource[] = JSON.parse(weapon.sources);
  const operators: Operator[] = weapon.operatorsInRegion ? JSON.parse(weapon.operatorsInRegion) : [];

  return (
    <>
      <SiteHeader role={session?.role ?? null} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
        <div>
          <Link href="/regional-knowledge/weapon" className="font-mono text-xs text-accent hover:underline">
            ← Weapons &amp; Munitions
          </Link>
          <h1 className="stencil mt-2 text-2xl text-foreground">{weapon.name}</h1>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-danger">
            {weapon.manufacturer} · {WEAPON_CATEGORY_LABELS[weapon.category]}
          </p>
        </div>

        {weapon.imageUrl && (
          <div className="overflow-hidden rounded border border-border bg-panel-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- external, arbitrary-host photo */}
            <img src={weapon.imageUrl} alt={weapon.name} className="aspect-video w-full object-cover" />
          </div>
        )}

        <p className="text-sm leading-relaxed text-foreground">{weapon.description}</p>

        <div className="grid grid-cols-2 gap-4 rounded border border-border bg-panel p-4 sm:grid-cols-3">
          <Stat label="Guidance" value={weapon.guidance} />
          <Stat label="Range" value={weapon.rangeNm ? `${weapon.rangeNm} nm` : null} />
          <Stat label="Speed" value={weapon.speed} />
          <Stat label="Warhead" value={weapon.warhead} />
          <Stat label="Length" value={weapon.lengthIn ? `${weapon.lengthIn} in` : null} />
          <Stat label="Diameter" value={weapon.diameterIn ? `${weapon.diameterIn} in` : null} />
          <Stat label="Weight" value={weapon.weightLbs ? `${weapon.weightLbs} lbs` : null} />
        </div>

        {weapon.aircraft.length > 0 && (
          <div>
            <p className="stencil mb-2 text-xs tracking-widest text-muted">Carried By</p>
            <div className="flex flex-wrap gap-2">
              {weapon.aircraft.map((a) => (
                <Link
                  key={a.id}
                  href={`/regional-knowledge/aircraft/${a.aircraft.slug}`}
                  className="rounded border border-border bg-panel px-3 py-1.5 text-xs text-accent hover:border-accent hover:underline"
                >
                  {a.aircraft.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {operators.length > 0 && (
          <div>
            <p className="stencil mb-2 text-xs tracking-widest text-muted">Operators in the Region</p>
            <div className="flex flex-wrap gap-2">
              {operators.map((op, i) => (
                <Link
                  key={i}
                  href={`/regional-knowledge/country/${encodeURIComponent(op.country)}`}
                  className="rounded border border-border bg-panel px-3 py-1.5 text-xs text-accent hover:underline"
                >
                  {op.country}
                </Link>
              ))}
            </div>
          </div>
        )}

        {weapon.variants && (
          <div>
            <p className="stencil mb-2 text-xs tracking-widest text-muted">Variants</p>
            <p className="text-sm leading-relaxed text-foreground">{weapon.variants}</p>
          </div>
        )}

        <SourcesList sources={sources} />
      </main>
    </>
  );
}
