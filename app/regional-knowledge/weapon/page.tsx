import Link from "next/link";
import { getPublishedWeapons } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { SiteHeader } from "@/app/components/SiteHeader";
import { WEAPON_CATEGORY_LABELS } from "@/lib/regionalKnowledge";

export default async function WeaponIndexPage() {
  const [weapons, session] = await Promise.all([getPublishedWeapons(), getSession()]);

  return (
    <>
      <SiteHeader role={session?.role ?? null} />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6">
        <div>
          <Link href="/regional-knowledge" className="font-mono text-xs text-accent hover:underline">
            ← Regional Knowledge
          </Link>
          <h1 className="stencil mt-2 text-2xl text-foreground">Weapons &amp; Munitions</h1>
          <p className="mt-2 max-w-2xl font-mono text-xs text-muted">
            Missiles, bombs, and other munitions reported in service with South East Asian air
            forces — compiled from manufacturer datasheets, official releases, and established
            defence references.
          </p>
        </div>

        {weapons.length === 0 ? (
          <p className="rounded border border-border bg-panel p-6 text-center text-sm text-muted">
            No published weapons yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {weapons.map((w) => (
              <Link
                key={w.id}
                href={`/regional-knowledge/weapon/${w.slug}`}
                className="flex gap-3 rounded border border-border bg-panel p-4 transition-colors hover:border-danger"
              >
                {w.imageUrl && (
                  <div className="h-16 w-24 shrink-0 overflow-hidden rounded border border-border bg-panel-2">
                    {/* eslint-disable-next-line @next/next/no-img-element -- external, arbitrary-host thumbnail */}
                    <img src={w.imageUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-danger">
                    {WEAPON_CATEGORY_LABELS[w.category]}
                  </p>
                  <h2 className="mt-1 text-sm font-semibold text-foreground">{w.name}</h2>
                  <p className="mt-1 text-xs text-muted">{w.manufacturer}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
