import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedAirbasesByCountry } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { SiteHeader } from "@/app/components/SiteHeader";
import { REGIONAL_KNOWLEDGE_COUNTRIES } from "@/lib/regionalKnowledge";

export function generateStaticParams() {
  return REGIONAL_KNOWLEDGE_COUNTRIES.map((country) => ({ country: encodeURIComponent(country) }));
}

export default async function CountryPage({ params }: { params: Promise<{ country: string }> }) {
  const { country: encoded } = await params;
  const country = decodeURIComponent(encoded);
  if (!REGIONAL_KNOWLEDGE_COUNTRIES.includes(country as (typeof REGIONAL_KNOWLEDGE_COUNTRIES)[number])) {
    notFound();
  }

  const [airbases, session] = await Promise.all([getPublishedAirbasesByCountry(country), getSession()]);

  return (
    <>
      <SiteHeader role={session?.role ?? null} />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6">
        <div>
          <Link href="/regional-knowledge" className="font-mono text-xs text-accent hover:underline">
            ← Regional Knowledge
          </Link>
          <h1 className="stencil mt-2 text-2xl text-foreground">{country}</h1>
          <p className="mt-2 font-mono text-xs text-muted">
            {airbases.length} published airbase{airbases.length === 1 ? "" : "s"} on record.
          </p>
        </div>

        {airbases.length === 0 ? (
          <p className="rounded border border-border bg-panel p-6 text-center text-sm text-muted">
            No published airbases for {country} yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded border border-border bg-panel">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted">
                  <th className="px-4 py-3">Airbase Name</th>
                  <th className="px-4 py-3">Operated By</th>
                  <th className="px-4 py-3">Based Aircraft</th>
                  <th className="px-4 py-3">Units</th>
                </tr>
              </thead>
              <tbody>
                {airbases.map((base) => {
                  const aircraftTypes = base.units.map((u) => u.aircraftType).filter(Boolean) as string[];
                  return (
                    <tr key={base.id} className="border-b border-border last:border-0 hover:bg-panel-2">
                      <td className="px-4 py-3">
                        <Link
                          href={`/regional-knowledge/airbase/${base.slug}`}
                          className="font-semibold text-accent hover:underline"
                        >
                          {base.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">{base.operator}</td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {aircraftTypes.length === 0
                          ? "—"
                          : aircraftTypes.length === 1
                            ? aircraftTypes[0]
                            : `${aircraftTypes[0]} +${aircraftTypes.length - 1}`}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">{base.units.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
