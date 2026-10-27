import type { NextRequest } from "next/server";
import { db } from "@/lib/db";

export const maxDuration = 15;

/** Redirects to the placeholder without caching the failure, so the next request still retries the real source instead of being stuck on a transient blip. */
function placeholderRedirect(): Response {
  return new Response(null, {
    status: 307,
    headers: { Location: "/placeholder-briefing.svg", "Cache-Control": "no-store" },
  });
}

/** True once some PUBLISHED or DRAFT content we generated actually cites this exact URL as one of its images — never proxy an arbitrary caller-supplied URL. */
async function isKnownImageUrl(url: string): Promise<boolean> {
  const [article, aviationSafety, aircraft] = await Promise.all([
    db.article.findFirst({ where: { images: { contains: url } }, select: { id: true } }),
    db.aviationSafetyArticle.findFirst({ where: { images: { contains: url } }, select: { id: true } }),
    db.aircraftRecognition.findFirst({ where: { imageUrl: url }, select: { id: true } }),
  ]);
  return Boolean(article || aviationSafety || aircraft);
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url || !/^https?:\/\//i.test(url)) {
    return new Response("Bad request", { status: 400 });
  }

  if (!(await isKnownImageUrl(url))) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(8_000),
    });

    const contentType = upstream.headers.get("content-type") ?? "";
    if (!upstream.ok || !contentType.startsWith("image/")) {
      return placeholderRedirect();
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Fresh for a week, servable stale for up to 30 days while revalidating in
        // the background — once a fetch succeeds, a later transient failure on the
        // source's end (rate-limit, hotlink block, brief outage) doesn't break the
        // image for viewers who already triggered a cache fill.
        "Cache-Control": "public, max-age=604800, stale-while-revalidate=2592000",
      },
    });
  } catch {
    // Network error, timeout, or DNS failure upstream — degrade to the
    // placeholder rather than a broken-image icon, and don't cache this
    // failure so the next request retries the real source.
    return placeholderRedirect();
  }
}
