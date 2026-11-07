import "server-only";
import { SOURCES, type SourceDef } from "@/lib/sources";
import { fetchOneSource, type Candidate } from "@/lib/fetchCandidates";

export type NewsFeedItem = Candidate;

/** The curated source list is per-region and overlaps heavily (e.g. "Defence Security Asia" appears under four regions) — collapse to one fetch per unique URL. */
function uniqueSources(): SourceDef[] {
  const byUrl = new Map<string, SourceDef>();
  for (const sources of Object.values(SOURCES)) {
    for (const source of sources) {
      if (!byUrl.has(source.url)) byUrl.set(source.url, source);
    }
  }
  return [...byUrl.values()];
}

/**
 * Pulls recent, relevance-filtered headlines across every curated source in
 * lib/sources.ts — the same best-effort RSS discovery and keyword filtering
 * the article-generation pipeline already uses (fetchCandidates.ts), just
 * applied across all sources at once instead of one region's subset. No
 * third-party account, API key, or OAuth — these are the outlets' own public
 * RSS feeds.
 */
export async function fetchAllNewsFeedItems(cutoffDays = 14): Promise<NewsFeedItem[]> {
  const cutoff = new Date(Date.now() - cutoffDays * 24 * 60 * 60 * 1000);
  const sources = uniqueSources();

  const results = await Promise.allSettled(sources.map((s) => fetchOneSource(s.name, s.url, cutoff)));
  const items = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  const seenLinks = new Set<string>();
  const deduped = items.filter((item) => {
    if (seenLinks.has(item.link)) return false;
    seenLinks.add(item.link);
    return true;
  });

  deduped.sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0));
  return deduped;
}
