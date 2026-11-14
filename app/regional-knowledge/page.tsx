import { readFile } from "fs/promises";
import path from "path";
import Link from "next/link";
import { getPublishedAirbases, getPublishedAirbaseCountries } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { SiteHeader } from "@/app/components/SiteHeader";
import { RegionalKnowledgeMapLoader } from "@/app/components/RegionalKnowledgeMapLoader";
import { DistanceChallenge } from "@/app/components/DistanceChallenge";
import type { AirbaseMapData } from "@/app/components/RegionalKnowledgeMap";

async function loadBorders(): Promise<GeoJSON.FeatureCollection | null> {
  try {
    const file = await readFile(path.join(process.cwd(), "public", "regional-knowledge-borders.geojson"), "utf-8");
    return JSON.parse(file) as GeoJSON.FeatureCollection;
  } catch {
    return null;
  }
}

export default async function RegionalKnowledgePage() {
  const [airbases, countries, geojson, session] = await Promise.all([
    getPublishedAirbases(),
    getPublishedAirbaseCountries(),
    loadBorders(),
    getSession(),
  ]);

  const mapData: AirbaseMapData[] = airbases.map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    country: a.country,
    operator: a.operator,
    latitude: a.latitude,
    longitude: a.longitude,
    icaoCode: a.icaoCode,
    baseType: a.baseType,
    description: a.description,
    runwayDesignator: a.runwayDesignator,
    runwayLengthFt: a.runwayLengthFt,
    runwayWidthFt: a.runwayWidthFt,
    elevationFt: a.elevationFt,
    runwayCount: a.runwayCount,
    sources: a.sources,
    units: a.units.map((u) => ({
      id: u.id,
      category: u.category,
      unitName: u.unitName,
      aircraftType: u.aircraftType,
      approxCount: u.approxCount,
      notes: u.notes,
      sources: u.sources,
    })),
  }));

  return (
    <>
      <SiteHeader role={session?.role ?? null} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
        <div>
          <h1 className="stencil text-2xl text-foreground">Regional Knowledge</h1>
          <p className="mt-2 max-w-3xl font-mono text-xs text-muted">
            An OSINT-compiled map of military air bases — and civilian airfields hosting military
            units — across Singapore, Indonesia, Brunei, the Philippines, Vietnam, Cambodia,
            Thailand, Malaysia, and the South China Sea. Compiled entirely from public reporting
            (IISS Military Balance-adjacent open reporting, official air force releases,
            GlobalSecurity.org, Wikipedia, and CSIS AMTI for South China Sea features) — never from
            classified sources. Illustrative and approximate, not a real-time order of battle.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 font-mono text-xs">
          <Link
            href="/regional-knowledge/aircraft"
            className="rounded border border-accent/60 px-3 py-1.5 text-accent hover:bg-accent hover:text-background transition-colors"
          >
            Aircraft Platforms
          </Link>
          <Link
            href="/regional-knowledge/weapon"
            className="rounded border border-danger/60 px-3 py-1.5 text-danger hover:bg-danger hover:text-background transition-colors"
          >
            Weapons &amp; Munitions
          </Link>
        </div>

        {countries.length > 0 && (
          <div>
            <p className="stencil mb-2 text-xs tracking-widest text-muted">Browse by Country</p>
            <div className="flex flex-wrap gap-2">
              {countries.map((c) => (
                <Link
                  key={c}
                  href={`/regional-knowledge/country/${encodeURIComponent(c)}`}
                  className="rounded border border-border bg-panel px-3 py-1.5 font-mono text-xs text-foreground hover:border-accent hover:text-accent"
                >
                  {c}
                </Link>
              ))}
            </div>
          </div>
        )}

        {mapData.length === 0 ? (
          <p className="mt-8 text-center font-mono text-sm text-muted">
            No published airbases yet.
          </p>
        ) : (
          <>
            <RegionalKnowledgeMapLoader airbases={mapData} geojson={geojson} />
            <DistanceChallenge
              airbases={mapData.map((a) => ({
                id: a.id,
                name: a.name,
                country: a.country,
                latitude: a.latitude,
                longitude: a.longitude,
              }))}
            />
          </>
        )}
      </main>
      <footer className="border-t border-border px-4 py-4 text-center font-mono text-[10px] text-muted">
        KNOWLEDGE BEFORE CONFLICT — open-source information, not an official government publication.
      </footer>
    </>
  );
}
