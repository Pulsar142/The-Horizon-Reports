const PROXY_PATH = "/api/image-proxy";

/**
 * Routes an externally-hosted image URL through our own caching proxy
 * (`/api/image-proxy`) instead of hotlinking it directly from the browser.
 * Source outlets' CDNs can start blocking cross-site requests, rate-limit,
 * or take the image down at any time after we first verified it — none of
 * which we control. Proxying means: (a) the fetch happens server-to-server,
 * so a foreign-Referer hotlink block never triggers, and (b) once fetched
 * successfully, the proxy's Cache-Control header lets Vercel's edge network
 * keep serving that copy for a long time, insulating viewers from a later,
 * transient failure on the source's end.
 *
 * Local assets (starting with "/") and inline `data:` URIs (admin-uploaded
 * images, stored as base64 directly) are already same-origin/self-contained
 * — pass those through untouched.
 */
export function proxiedImageUrl(url: string | null | undefined): string {
  if (!url) return "/placeholder-briefing.svg";
  if (url.startsWith("/") || url.startsWith("data:")) return url;
  return `${PROXY_PATH}?url=${encodeURIComponent(url)}`;
}
