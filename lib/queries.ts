import "server-only";
import { db } from "@/lib/db";
import type { Region, AviationSafetyRegion, AviationSafetySector } from "@/generated/prisma/client";
import type { ArticleImage, ArticleSource } from "@/lib/types";

export type ArticleCard = {
  id: string;
  slug: string;
  title: string;
  region: Region;
  country: string | null;
  status: string;
  weekOf: Date;
  month: number;
  year: number;
  publishedAt: Date | null;
  articleDate: Date | null;
  reliabilityScore: number;
  teaser: string;
  image: ArticleImage | null;
};

function firstImage(imagesJson: string): ArticleImage | null {
  try {
    const images = JSON.parse(imagesJson) as ArticleImage[];
    return images[0] ?? null;
  } catch {
    return null;
  }
}

function toCard(a: {
  id: string;
  slug: string;
  title: string;
  region: Region;
  country: string | null;
  status: string;
  weekOf: Date;
  month: number;
  year: number;
  publishedAt: Date | null;
  articleDate: Date | null;
  reliabilityScore: number;
  summaryP1: string;
  images: string;
}): ArticleCard {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    region: a.region,
    country: a.country,
    status: a.status,
    weekOf: a.weekOf,
    month: a.month,
    year: a.year,
    publishedAt: a.publishedAt,
    articleDate: a.articleDate,
    reliabilityScore: a.reliabilityScore,
    teaser: a.summaryP1.slice(0, 160) + (a.summaryP1.length > 160 ? "…" : ""),
    image: firstImage(a.images),
  };
}

/** The single fun fact currently shown to viewers, or null if none is published. */
export async function getPublishedFunFact() {
  return db.funFact.findFirst({ where: { status: "PUBLISHED" } });
}

/** The single Aircraft Recognition card currently shown to viewers, or null if none is published. */
export async function getPublishedAircraftRecognition() {
  return db.aircraftRecognition.findFirst({ where: { status: "PUBLISHED" } });
}

export type AviationSafetyCard = {
  id: string;
  slug: string;
  title: string;
  region: AviationSafetyRegion;
  country: string | null;
  incidentCategory: string;
  sector: AviationSafetySector;
  incidentDate: Date | null;
  weekOf: Date;
  publishedAt: Date | null;
  reliabilityScore: number;
  teaser: string;
  image: ArticleImage | null;
};

function toAviationSafetyCard(a: {
  id: string;
  slug: string;
  title: string;
  region: AviationSafetyRegion;
  country: string | null;
  incidentCategory: string;
  sector: AviationSafetySector;
  incidentDate: Date | null;
  weekOf: Date;
  publishedAt: Date | null;
  reliabilityScore: number;
  summaryP1: string;
  images: string;
}): AviationSafetyCard {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    region: a.region,
    country: a.country,
    incidentCategory: a.incidentCategory,
    sector: a.sector,
    incidentDate: a.incidentDate,
    weekOf: a.weekOf,
    publishedAt: a.publishedAt,
    reliabilityScore: a.reliabilityScore,
    teaser: a.summaryP1.slice(0, 160) + (a.summaryP1.length > 160 ? "…" : ""),
    image: firstImage(a.images),
  };
}

/** Published Aviation Safety briefings, most recent first, optionally filtered by region. */
export async function getPublishedAviationSafetyArticles(region?: AviationSafetyRegion): Promise<AviationSafetyCard[]> {
  const rows = await db.aviationSafetyArticle.findMany({
    where: { status: "PUBLISHED", ...(region ? { region } : {}) },
    orderBy: { publishedAt: "desc" },
  });
  return rows.map(toAviationSafetyCard);
}

/** Month/week archive tree for Aviation Safety, mirroring getArchiveTree() for regular Articles. */
export async function getAviationSafetyArchiveTree(): Promise<ArchiveMonth[]> {
  const rows = await db.aviationSafetyArticle.findMany({
    where: { status: { in: ["PUBLISHED", "ARCHIVED"] } },
    select: { weekOf: true, month: true, year: true },
    orderBy: { weekOf: "desc" },
  });
  return buildArchiveTree(rows);
}

/** Every Aviation Safety briefing (published or archived) for one archive week, optionally filtered by region. */
export async function getAviationSafetyArticlesForWeek(
  weekOf: Date,
  region?: AviationSafetyRegion
): Promise<AviationSafetyCard[]> {
  const rows = await db.aviationSafetyArticle.findMany({
    where: { weekOf, status: { in: ["PUBLISHED", "ARCHIVED"] }, ...(region ? { region } : {}) },
    orderBy: { publishedAt: "desc" },
  });
  return rows.map(toAviationSafetyCard);
}

export async function getAviationSafetyArticleBySlug(slug: string) {
  const row = await db.aviationSafetyArticle.findUnique({ where: { slug } });
  if (!row) return null;
  return {
    ...row,
    images: JSON.parse(row.images) as ArticleImage[],
    sources: JSON.parse(row.sources) as ArticleSource[],
    bullets: JSON.parse(row.bullets) as string[],
  };
}

/** The Aviation Safety page's latest auto-generated monthly catchphrase + trend highlights, if one exists. */
export async function getLatestAviationSafetyBrief() {
  return db.aviationSafetyBrief.findFirst({ orderBy: [{ year: "desc" }, { month: "desc" }] });
}

/** Every monthly brief, oldest first — the Military vs Commercial trend chart's data series. */
export async function getAviationSafetyBriefHistory() {
  return db.aviationSafetyBrief.findMany({ orderBy: [{ year: "asc" }, { month: "asc" }] });
}

/** Published "Regional Knowledge" airbases with their units, for the interactive map + distance tool. */
export async function getPublishedAirbases() {
  return db.militaryAirbase.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ country: "asc" }, { name: "asc" }],
    include: { units: true },
  });
}

/** Every distinct country with at least one published airbase, for the Regional Knowledge country index. */
export async function getPublishedAirbaseCountries(): Promise<string[]> {
  const rows = await db.militaryAirbase.findMany({
    where: { status: "PUBLISHED" },
    select: { country: true },
    distinct: ["country"],
    orderBy: { country: "asc" },
  });
  return rows.map((r) => r.country);
}

/** Published airbases for one country (case-sensitive exact match on the stored country name), with their units. */
export async function getPublishedAirbasesByCountry(country: string) {
  return db.militaryAirbase.findMany({
    where: { status: "PUBLISHED", country },
    orderBy: { name: "asc" },
    include: { units: true },
  });
}

/** One published airbase by slug, with its units and each unit's linked aircraft platform (if any). */
export async function getAirbaseBySlug(slug: string) {
  return db.militaryAirbase.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      units: { include: { aircraft: { select: { slug: true, name: true, imageUrl: true } } } },
    },
  });
}

/** Published aircraft platforms, for the Regional Knowledge aircraft index. */
export async function getPublishedAircraft() {
  return db.militaryAircraft.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { name: "asc" },
  });
}

/** One published aircraft platform by slug, with the weapons it's known to carry. */
export async function getAircraftBySlug(slug: string) {
  return db.militaryAircraft.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { weapons: { include: { weapon: true } } },
  });
}

/** Published weapon/munition platforms, for the Regional Knowledge weapons index. */
export async function getPublishedWeapons() {
  return db.weapon.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { name: "asc" },
  });
}

/** One published weapon by slug, with the aircraft known to carry it. */
export async function getWeaponBySlug(slug: string) {
  return db.weapon.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { aircraft: { include: { aircraft: true } } },
  });
}

export async function getEnabledRegions(): Promise<Region[]> {
  const settings = await db.regionSetting.findMany();
  const disabled = new Set(settings.filter((s) => !s.enabled).map((s) => s.region));
  const all: Region[] = ["SINGAPORE", "SEA", "GLOBAL", "USA", "MALAYSIA", "INDONESIA"];
  return all.filter((r) => !disabled.has(r));
}

export async function getPublishedArticles(region?: Region): Promise<ArticleCard[]> {
  const rows = await db.article.findMany({
    where: { status: "PUBLISHED", ...(region ? { region } : {}) },
    orderBy: { weekOf: "desc" },
  });
  return rows.map(toCard);
}

export async function getArticleBySlug(slug: string) {
  const row = await db.article.findUnique({ where: { slug } });
  if (!row) return null;
  return {
    ...row,
    bullets: JSON.parse(row.bullets) as string[],
    images: JSON.parse(row.images) as ArticleImage[],
    sources: JSON.parse(row.sources) as ArticleSource[],
  };
}

export type DigestArticle = {
  slug: string;
  title: string;
  region: Region;
  country: string | null;
};

/**
 * Live-joins the digest's article IDs against currently PUBLISHED articles
 * (rather than trusting the digest's own stored summary text), so a
 * briefing never keeps naming a story that's since been archived or
 * deleted.
 */
export async function getCurrentDigest() {
  const digest = await db.weeklyDigest.findFirst({ orderBy: { weekOf: "desc" } });
  if (!digest) return null;
  const ids = JSON.parse(digest.articleIds) as string[];
  const rows = await db.article.findMany({
    where: { id: { in: ids }, status: "PUBLISHED" },
    select: { id: true, slug: true, title: true, region: true, country: true },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  const articles: DigestArticle[] = ids
    .map((id) => byId.get(id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));
  return { ...digest, articleIds: ids, articles };
}

export type ArchiveMonth = {
  year: number;
  month: number;
  weeks: { weekOf: Date; count: number }[];
};

function buildArchiveTree(rows: { weekOf: Date; month: number; year: number }[]): ArchiveMonth[] {
  const monthMap = new Map<string, ArchiveMonth>();
  for (const row of rows) {
    const monthKey = `${row.year}-${row.month}`;
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, { year: row.year, month: row.month, weeks: [] });
    }
    const monthEntry = monthMap.get(monthKey)!;
    const weekKey = row.weekOf.getTime();
    const existingWeek = monthEntry.weeks.find((w) => w.weekOf.getTime() === weekKey);
    if (existingWeek) {
      existingWeek.count += 1;
    } else {
      monthEntry.weeks.push({ weekOf: row.weekOf, count: 1 });
    }
  }

  for (const m of monthMap.values()) {
    m.weeks.sort((a, b) => b.weekOf.getTime() - a.weekOf.getTime());
  }

  return [...monthMap.values()].sort((a, b) => (a.year !== b.year ? b.year - a.year : b.month - a.month));
}

export async function getArchiveTree(): Promise<ArchiveMonth[]> {
  const rows = await db.article.findMany({
    where: { status: { in: ["PUBLISHED", "ARCHIVED"] } },
    select: { weekOf: true, month: true, year: true },
    orderBy: { weekOf: "desc" },
  });
  return buildArchiveTree(rows);
}

export async function getArticlesForWeek(weekOf: Date) {
  const rows = await db.article.findMany({
    where: { weekOf },
    orderBy: { region: "asc" },
  });
  return rows.map(toCard);
}
