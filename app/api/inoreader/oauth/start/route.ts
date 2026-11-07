import type { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { inoreaderAuthorizeUrl } from "@/lib/inoreader";

/**
 * One-time, admin-only step: redirects to Inoreader's OAuth consent screen.
 * Run this once (visit it while logged into /admin) after setting
 * INOREADER_APP_ID/INOREADER_APP_KEY — Inoreader redirects back to
 * /api/inoreader/oauth/callback with a code, which gets exchanged for the
 * access/refresh tokens the sync cron job uses from then on.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (session?.role !== "admin") {
    return new Response("Admin login required.", { status: 403 });
  }

  const redirectUri = new URL("/api/inoreader/oauth/callback", request.url).toString();
  const state = crypto.randomUUID();

  let authorizeUrl: string;
  try {
    authorizeUrl = inoreaderAuthorizeUrl(redirectUri, state);
  } catch (error) {
    return new Response(error instanceof Error ? error.message : String(error), { status: 500 });
  }

  const response = Response.redirect(authorizeUrl, 302);
  response.headers.append(
    "Set-Cookie",
    `inoreader_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  );
  return response;
}
