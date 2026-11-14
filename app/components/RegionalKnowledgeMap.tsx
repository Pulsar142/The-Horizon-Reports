"use client";

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import type { Feature } from "geojson";
import { AIRBASE_UNIT_CATEGORY_LABELS, hasFlyingUnit } from "@/lib/regionalKnowledge";
import type { ArticleSource } from "@/lib/types";
import type { AerodromeWeather } from "@/lib/aerodromeWeather";

export type AirbaseUnitData = {
  id: string;
  category: keyof typeof AIRBASE_UNIT_CATEGORY_LABELS;
  unitName: string;
  aircraftType: string | null;
  approxCount: number | null;
  notes: string | null;
  sources: string;
};

export type AirbaseMapData = {
  id: string;
  slug: string;
  name: string;
  country: string;
  operator: string;
  latitude: number;
  longitude: number;
  icaoCode: string | null;
  baseType: "MILITARY" | "CIVIL_MILITARY_SHARED";
  description: string;
  runwayDesignator: string | null;
  runwayLengthFt: number | null;
  runwayWidthFt: number | null;
  elevationFt: number | null;
  runwayCount: number | null;
  sources: string;
  units: AirbaseUnitData[];
};

const NOT_REPORTED = "Not publicly reported";
function fmtFt(v: number | null): string {
  return v === null ? NOT_REPORTED : `${v.toLocaleString()} ft`;
}

// e.g. "Runway 18/36: 8,530 ft x 148 ft" — falls back gracefully as designator/width are missing.
function runwaySummary(a: AirbaseMapData): string {
  const label = a.runwayDesignator ? `Runway ${a.runwayDesignator}` : "Runway";
  if (a.runwayLengthFt === null) return `${label}: ${NOT_REPORTED}`;
  const length = `${a.runwayLengthFt.toLocaleString()} ft`;
  const width = a.runwayWidthFt === null ? NOT_REPORTED : `${a.runwayWidthFt.toLocaleString()} ft`;
  return `${label}: ${length} x ${width}`;
}

type WeatherState = AerodromeWeather | "loading" | "error" | "unavailable";

const FLIGHT_CATEGORY_COLORS: Record<string, string> = {
  VFR: "#2f9e44",
  MVFR: "#3987e5",
  IFR: "#d9463c",
  LIFR: "#b03cd9",
};

function fmtCeiling(ft: number | null): string {
  return ft === null ? "No ceiling reported" : `${ft.toLocaleString()} ft AGL`;
}

function fmtVisibility(visib: string | null): string {
  if (visib === null) return NOT_REPORTED;
  return /sm$/i.test(visib) ? visib : `${visib} SM`;
}

function fmtObservedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "unknown time";
  return `${d.toISOString().slice(11, 16)}Z`;
}

function WeatherPanel({
  icaoCode,
  weather,
  compact = false,
}: {
  icaoCode: string | null;
  weather: WeatherState | undefined;
  compact?: boolean;
}) {
  if (!icaoCode) {
    return <p className="text-muted">No ICAO code on file — live weather unavailable.</p>;
  }
  if (weather === undefined || weather === "loading") {
    return <p className="text-muted">Loading live weather…</p>;
  }
  if (weather === "error") {
    return <p className="text-muted">Live weather temporarily unavailable.</p>;
  }
  if (weather === "unavailable") {
    return <p className="text-muted">No live METAR report available for {icaoCode}.</p>;
  }
  const color = weather.flightCategory ? FLIGHT_CATEGORY_COLORS[weather.flightCategory] : DEFAULT_BORDER;
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5">
        <span
          className="stencil rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-widest text-background"
          style={{ backgroundColor: color }}
        >
          {weather.flightCategory ?? "N/A"}
        </span>
        <span className="text-[10px] text-muted">as of {fmtObservedAt(weather.observedAt)}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
        <span className="text-muted">Ceiling</span>
        <span>{fmtCeiling(weather.ceilingFt)}</span>
        <span className="text-muted">Visibility</span>
        <span>{fmtVisibility(weather.visibilitySm)}</span>
        <span className="text-muted">Runway condition*</span>
        <span>{weather.runwayCondition}</span>
      </div>
      <p className="text-[9px] text-muted">
        * inferred from current METAR weather, not an official runway condition report
      </p>
      {!compact && <p className="text-[9px] text-muted">Source: {weather.source}</p>}
    </div>
  );
}

// Fixed categorical hues, one per focus country (validated CVD-safe order).
const COUNTRY_COLORS: Record<string, string> = {
  Singapore: "#3987e5",
  Malaysia: "#d95926",
  Indonesia: "#199e70",
  Brunei: "#c98500",
  Philippines: "#d55181",
  Vietnam: "#008300",
  Thailand: "#9085e9",
  Cambodia: "#e66767",
  Laos: "#4aa3a2",
  Myanmar: "#e0b04a",
  "Timor-Leste": "#7a5fb5",
};
const DEFAULT_BORDER = "#6b6f5a";

const FLYING_MARKER_COLOR = "#c9a227"; // gold — hosts a flying squadron
const GROUND_MARKER_COLOR = "#b5432c"; // rust — ground-only installation (air defence / ammo depot / support)

function airbaseIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="9" r="7" fill="${color}" stroke="#12150f" stroke-width="2" />
    </svg>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9],
  });
}

function FitToBorders({ geojson }: { geojson: GeoJSON.FeatureCollection | null }) {
  const map = useMap();
  useMemo(() => {
    if (!geojson) return;
    const layer = L.geoJSON(geojson);
    const bounds = layer.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [16, 16] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geojson]);
  return null;
}

export function RegionalKnowledgeMap({
  airbases,
  geojson,
}: {
  airbases: AirbaseMapData[];
  geojson: GeoJSON.FeatureCollection | null;
}) {
  const [activeCountry, setActiveCountry] = useState<string | null>(null);
  const [weatherByIcao, setWeatherByIcao] = useState<Record<string, WeatherState>>({});

  const visibleAirbases = activeCountry ? airbases.filter((a) => a.country === activeCountry) : airbases;

  const ensureWeather = useCallback(
    (icaoCode: string | null) => {
      if (!icaoCode || weatherByIcao[icaoCode] !== undefined) return;
      setWeatherByIcao((prev) => ({ ...prev, [icaoCode]: "loading" }));
      fetch(`/api/weather/${icaoCode}`)
        .then(async (res) => {
          if (res.status === 404) return "unavailable" as const;
          if (!res.ok) return "error" as const;
          return (await res.json()) as AerodromeWeather;
        })
        .catch(() => "error" as const)
        .then((result) => setWeatherByIcao((prev) => ({ ...prev, [icaoCode]: result })));
    },
    [weatherByIcao]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 font-mono text-[10px]">
        <button
          onClick={() => setActiveCountry(null)}
          className={`stencil rounded-full border px-3 py-1 tracking-widest transition-colors ${
            activeCountry === null ? "border-accent bg-accent text-background" : "border-border text-muted hover:text-foreground"
          }`}
        >
          All
        </button>
        {Object.keys(COUNTRY_COLORS).concat(["South China Sea"]).map((c) => (
          <button
            key={c}
            onClick={() => setActiveCountry(c)}
            className={`stencil rounded-full border px-3 py-1 tracking-widest transition-colors ${
              activeCountry === c ? "text-background" : "border-border text-muted hover:text-foreground"
            }`}
            style={activeCountry === c ? { backgroundColor: COUNTRY_COLORS[c] ?? DEFAULT_BORDER, borderColor: COUNTRY_COLORS[c] ?? DEFAULT_BORDER } : undefined}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="h-[520px] w-full overflow-hidden rounded border border-border">
        <MapContainer center={[6, 111]} zoom={4} scrollWheelZoom className="h-full w-full" style={{ background: "#12150f" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {geojson && (
            <GeoJSON
              data={geojson}
              interactive={false}
              style={(feature?: Feature) => {
                const name = feature?.properties?.name as string | undefined;
                const color = (name && COUNTRY_COLORS[name]) || DEFAULT_BORDER;
                return { color, weight: 2, fillColor: color, fillOpacity: 0.08 };
              }}
            />
          )}
          <FitToBorders geojson={geojson} />

          {visibleAirbases.map((a) => {
            const flying = hasFlyingUnit(a.units.map((u) => u.category));
            const sources = JSON.parse(a.sources) as ArticleSource[];
            return (
              <Marker
                key={a.id}
                position={[a.latitude, a.longitude]}
                icon={airbaseIcon(flying ? FLYING_MARKER_COLOR : GROUND_MARKER_COLOR)}
                eventHandlers={{
                  mouseover: () => ensureWeather(a.icaoCode),
                  click: () => ensureWeather(a.icaoCode),
                }}
              >
                <Tooltip direction="top" offset={[0, -9]} opacity={0.95}>
                  <span className="font-mono text-xs">
                    <strong>{a.name}</strong>
                    <br />
                    {runwaySummary(a)}
                    <div className="mt-1 border-t border-black/10 pt-1">
                      <WeatherPanel icaoCode={a.icaoCode} weather={a.icaoCode ? weatherByIcao[a.icaoCode] : undefined} compact />
                    </div>
                  </span>
                </Tooltip>
                <Popup maxWidth={300} maxHeight={420}>
                  <div className="flex flex-col gap-1.5 font-mono text-xs">
                    <p className="text-[10px] uppercase tracking-widest text-muted">
                      {a.country} — {a.baseType === "CIVIL_MILITARY_SHARED" ? "Civil/Military Shared" : "Military"}
                    </p>
                    <p className="text-sm font-semibold">
                      <Link href={`/regional-knowledge/airbase/${a.slug}`} className="text-accent hover:underline">
                        {a.name}
                      </Link>
                    </p>
                    <p className="text-muted">{a.operator}</p>
                    <p>{a.description}</p>

                    <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5 border-t border-black/10 pt-1 text-[10px]">
                      <span className="text-muted">ICAO</span>
                      <span>{a.icaoCode ?? NOT_REPORTED}</span>
                      <span className="text-muted">Runway{a.runwayDesignator ? ` ${a.runwayDesignator}` : ""} L × W</span>
                      <span>
                        {fmtFt(a.runwayLengthFt)} × {a.runwayWidthFt === null ? NOT_REPORTED : `${a.runwayWidthFt.toLocaleString()} ft`}
                      </span>
                      <span className="text-muted">Elevation</span>
                      <span>{a.elevationFt === null ? NOT_REPORTED : `${a.elevationFt.toLocaleString()} ft`}</span>
                      <span className="text-muted">Runways available</span>
                      <span>{a.runwayCount ?? NOT_REPORTED}</span>
                    </div>

                    <div className="mt-1 border-t border-black/10 pt-1">
                      <p className="mb-0.5 text-[10px] uppercase tracking-widest text-muted">Live Weather</p>
                      <WeatherPanel icaoCode={a.icaoCode} weather={a.icaoCode ? weatherByIcao[a.icaoCode] : undefined} />
                    </div>

                    <div className="mt-1 flex flex-col gap-1 border-t border-black/10 pt-1">
                      {a.units.map((u) => (
                        <div key={u.id}>
                          <p className="text-[10px] uppercase tracking-widest text-muted">
                            {AIRBASE_UNIT_CATEGORY_LABELS[u.category]}
                          </p>
                          <p className="font-semibold">
                            {u.unitName} — {u.aircraftType ?? NOT_REPORTED}
                            {" ("}
                            {u.approxCount ? `~${u.approxCount}` : NOT_REPORTED}
                            {")"}
                          </p>
                          {u.notes && <p className="text-muted">{u.notes}</p>}
                        </div>
                      ))}
                    </div>
                    <div className="mt-1 flex flex-col gap-0.5 border-t border-black/10 pt-1 text-[10px] text-muted">
                      {sources.map((s, i) => (
                        <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="underline">
                          {s.name}
                        </a>
                      ))}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <p className="font-mono text-[10px] text-muted">
        <span className="mr-3">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: FLYING_MARKER_COLOR }} /> flying squadron present
        </span>
        <span>
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: GROUND_MARKER_COLOR }} /> ground installation only (air defence / ammo depot / support)
        </span>
      </p>
    </div>
  );
}
