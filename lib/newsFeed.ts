import "server-only";
import Parser from "rss-parser";

export type NewsFeedItem = {
  title: string;
  link: string;
  sourceName: string;
  publishedAt: Date | null;
  contentSnippet: string | null;
  imageUrl: string | null;
};

type FeedSourceDef = {
  name: string;
  /** Candidate feed URLs to try in order — the first one that parses and returns items wins. */
  feedUrls: string[];
};

/**
 * A dedicated source list for the "News Feeds" tab — general international
 * news outlets, distinct from lib/sources.ts's defence-trade-press list used
 * by the article-generation pipeline. Reuters and AP no longer publish a
 * working native RSS feed (Reuters retired theirs in 2020; AP's broke in
 * 2024) — both fall back to a Google News search scoped to that outlet's own
 * domain via `site:`, which still surfaces their actual stories, just
 * through Google's feed rather than the publisher's own.
 */
const NEWS_FEED_SOURCES: FeedSourceDef[] = [
  {
    name: "Channel News Asia",
    feedUrls: [
      "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6511",
      "https://www.channelnewsasia.com/rssfeeds/8395986",
    ],
  },
  {
    name: "The Straits Times",
    feedUrls: [
      "https://www.straitstimes.com/news/singapore/rss.xml",
      "https://www.straitstimes.com/news/asia/rss.xml",
      "https://www.straitstimes.com/rss.xml",
    ],
  },
  {
    name: "Al Jazeera English",
    feedUrls: ["https://www.aljazeera.com/xml/rss/all.xml"],
  },
  {
    name: "Reuters",
    feedUrls: ["https://news.google.com/rss/search?q=site:reuters.com+when:2d&hl=en-US&gl=US&ceid=US:en"],
  },
  {
    name: "ANTARA News",
    feedUrls: ["https://en.antaranews.com/rss/news.xml", "https://en.antaranews.com/rss/news"],
  },
  {
    name: "Astro AWANI",
    feedUrls: [
      "https://www.astroawani.com/rss.xml",
      "https://www.astroawani.com/feed",
      "https://www.astroawani.com/rss",
    ],
  },
  {
    name: "The Jerusalem Post",
    feedUrls: ["https://www.jpost.com/rss/rssfeedsfrontpage.aspx"],
  },
  {
    name: "Associated Press",
    feedUrls: ["https://news.google.com/rss/search?q=site:apnews.com+when:2d&hl=en-US&gl=US&ceid=US:en"],
  },
];

const parser = new Parser({
  timeout: 10_000,
  // Several of these outlets 403 the parser's default request (no User-Agent)
  // even though the same URL works fine from a browser or curl — send a
  // normal browser UA so the feed request isn't treated as a bot.
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: true }],
    ],
  },
});

type RawItem = Parser.Item & {
  mediaContent?: { $?: { url?: string; medium?: string; type?: string } }[];
  mediaThumbnail?: { $?: { url?: string } }[];
};

// Markers outlets use to flag a story as breaking/urgent/developing, checked
// against the title and any RSS category tags to pick the most newsworthy
// item per source rather than just whichever happened to publish last.
const BREAKING_KEYWORDS = ["breaking", "live updates", "live:", "developing", "urgent", "just in", "alert"];

function isBreaking(title: string, categories: string[] | undefined): boolean {
  const haystack = `${title} ${categories?.join(" ") ?? ""}`.toLowerCase();
  return BREAKING_KEYWORDS.some((k) => haystack.includes(k));
}

function extractImage(item: RawItem): string | null {
  const media = item.mediaContent?.find((m) => m.$?.medium === "image" || m.$?.type?.startsWith("image/"));
  if (media?.$?.url) return media.$.url;
  if (item.mediaContent?.[0]?.$?.url) return item.mediaContent[0].$.url;
  if (item.mediaThumbnail?.[0]?.$?.url) return item.mediaThumbnail[0].$.url;
  if (item.enclosure?.url && (!item.enclosure.type || item.enclosure.type.startsWith("image/"))) {
    return item.enclosure.url;
  }
  // Several outlets (e.g. Jerusalem Post, ANTARA) don't use RSS media
  // extensions at all — they embed the lead image as a plain <img> inside
  // the item's HTML content instead.
  const imgMatch = item.content?.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];
  return null;
}

async function fetchOneFeedSource(source: FeedSourceDef, cutoff: Date): Promise<NewsFeedItem[]> {
  for (const feedUrl of source.feedUrls) {
    try {
      const feed = await parser.parseURL(feedUrl);
      const items = (feed.items as RawItem[])
        .filter((item) => item.title && item.link)
        .map((item) => ({
          title: item.title!.trim(),
          link: item.link!,
          sourceName: source.name,
          publishedAt: item.isoDate ? new Date(item.isoDate) : null,
          contentSnippet: item.contentSnippet?.slice(0, 300) ?? null,
          imageUrl: extractImage(item),
        }))
        .filter((item) => !item.publishedAt || item.publishedAt >= cutoff);
      if (items.length > 0) {
        const rawByLink = new Map((feed.items as RawItem[]).map((raw) => [raw.link, raw]));
        items.sort((a, b) => {
          const aBreaking = isBreaking(a.title, rawByLink.get(a.link)?.categories);
          const bBreaking = isBreaking(b.title, rawByLink.get(b.link)?.categories);
          if (aBreaking !== bBreaking) return aBreaking ? -1 : 1;
          return (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0);
        });
        return items.slice(0, 1);
      }
    } catch {
      // try the next candidate URL for this source
    }
  }
  return [];
}

/**
 * Pulls a single item (with an image, where the feed provides one) from each
 * outlet in the curated News Feeds source list — preferring a story flagged
 * breaking/developing over the outlet's plain most-recent item, if one
 * exists in the window. Best-effort per source — one dead/changed feed
 * doesn't take down the rest.
 */
export async function fetchAllNewsFeedItems(cutoffDays = 3): Promise<NewsFeedItem[]> {
  const cutoff = new Date(Date.now() - cutoffDays * 24 * 60 * 60 * 1000);

  const results = await Promise.allSettled(NEWS_FEED_SOURCES.map((s) => fetchOneFeedSource(s, cutoff)));
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
