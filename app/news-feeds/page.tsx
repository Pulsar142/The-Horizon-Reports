import { getSession } from "@/lib/session";
import { SiteHeader } from "@/app/components/SiteHeader";
import { fetchAllNewsFeedItems, type NewsFeedItem } from "@/lib/newsFeed";
import { format } from "date-fns";

// Regenerated in the background at most once an hour (Vercel ISR) rather
// than on every request — these are live RSS fetches across 8 outlets, no
// need to re-run that for every page view.
export const revalidate = 3600;

async function loadFeedItems(): Promise<{ items: NewsFeedItem[]; error: string | null }> {
  try {
    const items = await fetchAllNewsFeedItems();
    return { items, error: null };
  } catch (error) {
    return { items: [], error: error instanceof Error ? error.message : String(error) };
  }
}

export default async function NewsFeedsPage() {
  const [{ items, error }, session] = await Promise.all([loadFeedItems(), getSession()]);

  return (
    <>
      <SiteHeader role={session?.role ?? null} />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6">
        <div>
          <h1 className="stencil text-2xl text-foreground">News Feeds</h1>
          <p className="mt-2 max-w-2xl font-mono text-xs text-muted">
            A live, unedited roundup from Channel News Asia, The Straits Times, Al Jazeera
            English, Reuters, ANTARA News, Astro AWANI, The Jerusalem Post, and Associated
            Press — refreshed automatically roughly every hour.
          </p>
        </div>

        {error ? (
          <p className="rounded border border-danger/40 bg-danger/10 p-6 text-center text-sm text-danger">
            Couldn&apos;t load the feed right now ({error}).
          </p>
        ) : items.length === 0 ? (
          <p className="rounded border border-border bg-panel p-6 text-center text-sm text-muted">
            No recent items found across these sources right now — check back later.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <a
                key={item.link}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 rounded border border-border bg-panel p-4 transition-colors hover:border-accent"
              >
                {item.imageUrl && (
                  <div className="hidden w-28 shrink-0 overflow-hidden rounded border border-border bg-panel-2 sm:block">
                    {/* eslint-disable-next-line @next/next/no-img-element -- external, arbitrary-host thumbnail, live-fetched and not stored in our DB so not proxied */}
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="aspect-video h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-gold">
                    {item.sourceName}
                    {item.publishedAt ? ` · ${format(item.publishedAt, "d MMM yyyy, HH:mm")}` : ""}
                  </p>
                  <h2 className="mt-1 text-sm font-semibold leading-snug text-foreground">{item.title}</h2>
                  {item.contentSnippet && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted">{item.contentSnippet}</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
