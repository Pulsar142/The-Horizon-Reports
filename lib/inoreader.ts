import "server-only";
import { db } from "@/lib/db";

const AUTH_URL = "https://www.inoreader.com/oauth2/auth";
const TOKEN_URL = "https://www.inoreader.com/oauth2/token";
const API_BASE = "https://www.inoreader.com/reader/api/0";
const TOKEN_ROW_ID = "default";

export function inoreaderAuthorizeUrl(redirectUri: string, state: string): string {
  const appId = process.env.INOREADER_APP_ID;
  if (!appId) throw new Error("INOREADER_APP_ID is not set.");
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "read",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number; // seconds
};

/** Exchanges a one-time OAuth authorization code for the first access/refresh token pair, and stores it. Only used during the one-time setup flow. */
export async function exchangeInoreaderCode(code: string, redirectUri: string): Promise<void> {
  const appId = process.env.INOREADER_APP_ID;
  const appKey = process.env.INOREADER_APP_KEY;
  if (!appId || !appKey) throw new Error("INOREADER_APP_ID / INOREADER_APP_KEY are not set.");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      redirect_uri: redirectUri,
      client_id: appId,
      client_secret: appKey,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new Error(`Inoreader token exchange failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as TokenResponse;
  if (!data.refresh_token) {
    throw new Error("Inoreader did not return a refresh_token on the initial authorization — re-check the requested scope.");
  }
  await db.inoreaderAuth.upsert({
    where: { id: TOKEN_ROW_ID },
    create: {
      id: TOKEN_ROW_ID,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    },
    update: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    },
  });
}

/** Returns a currently-valid access token, refreshing it first if it's expired or close to expiring. Throws if no token has ever been set up (run the one-time OAuth flow first). */
export async function getValidInoreaderAccessToken(): Promise<string> {
  const row = await db.inoreaderAuth.findUnique({ where: { id: TOKEN_ROW_ID } });
  if (!row) {
    throw new Error(
      "No Inoreader authorization on file — complete the one-time OAuth setup at /api/inoreader/oauth/start first."
    );
  }

  const needsRefresh = row.expiresAt.getTime() - Date.now() < 60_000; // refresh if <1 min left
  if (!needsRefresh) return row.accessToken;

  const appId = process.env.INOREADER_APP_ID;
  const appKey = process.env.INOREADER_APP_KEY;
  if (!appId || !appKey) throw new Error("INOREADER_APP_ID / INOREADER_APP_KEY are not set.");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: row.refreshToken,
      client_id: appId,
      client_secret: appKey,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`Inoreader token refresh failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as TokenResponse;
  await db.inoreaderAuth.update({
    where: { id: TOKEN_ROW_ID },
    data: {
      accessToken: data.access_token,
      // Inoreader may or may not rotate the refresh token on each refresh — keep the old one if a new one wasn't returned.
      refreshToken: data.refresh_token ?? row.refreshToken,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    },
  });
  return data.access_token;
}

export type InoreaderItem = {
  inoreaderId: string;
  title: string;
  url: string;
  summary: string | null;
  sourceName: string | null;
  imageUrl: string | null;
  publishedAt: Date;
};

type RawStreamItem = {
  id: string;
  title?: string;
  canonical?: { href: string }[];
  alternate?: { href: string }[];
  published?: number; // unix seconds
  summary?: { content?: string };
  origin?: { title?: string };
  enclosure?: { href: string; type?: string }[];
};

/** Fetches the most recent items from the configured Inoreader folder/tag stream (INOREADER_STREAM_ID, e.g. "user/-/label/Defence"). */
export async function fetchInoreaderStreamItems(limit = 50): Promise<InoreaderItem[]> {
  const streamId = process.env.INOREADER_STREAM_ID;
  const appId = process.env.INOREADER_APP_ID;
  const appKey = process.env.INOREADER_APP_KEY;
  if (!streamId) throw new Error("INOREADER_STREAM_ID is not set — this picks which folder/tag to pull.");

  const accessToken = await getValidInoreaderAccessToken();

  const url = `${API_BASE}/stream/contents/${encodeURIComponent(streamId)}?n=${limit}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(appId ? { AppId: appId } : {}),
      ...(appKey ? { AppKey: appKey } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Inoreader stream fetch failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { items?: RawStreamItem[] };

  return (data.items ?? [])
    .filter((item): item is RawStreamItem & { title: string } => Boolean(item.title))
    .map((item) => {
      const link = item.canonical?.[0]?.href ?? item.alternate?.[0]?.href ?? "";
      const image = item.enclosure?.find((e) => e.type?.startsWith("image/"))?.href ?? null;
      return {
        inoreaderId: item.id,
        title: item.title,
        url: link,
        summary: item.summary?.content ? stripHtml(item.summary.content).slice(0, 500) : null,
        sourceName: item.origin?.title ?? null,
        imageUrl: image,
        publishedAt: item.published ? new Date(item.published * 1000) : new Date(),
      };
    })
    .filter((item) => item.url);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
