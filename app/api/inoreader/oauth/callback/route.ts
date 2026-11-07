import type { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { exchangeInoreaderCode } from "@/lib/inoreader";

/** Receives Inoreader's OAuth redirect, exchanges the code for tokens, and stores them. See /api/inoreader/oauth/start. */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (session?.role !== "admin") {
    return new Response("Admin login required.", { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const cookieState = request.cookies.get("inoreader_oauth_state")?.value;

  if (error) {
    return new Response(`Inoreader declined authorization: ${error}`, { status: 400 });
  }
  if (!code || !state || !cookieState || state !== cookieState) {
    return new Response("Missing or mismatched OAuth state — start over at /api/inoreader/oauth/start.", {
      status: 400,
    });
  }

  const redirectUri = new URL("/api/inoreader/oauth/callback", request.url).toString();

  try {
    await exchangeInoreaderCode(code, redirectUri);
  } catch (err) {
    return new Response(`Token exchange failed: ${err instanceof Error ? err.message : String(err)}`, {
      status: 500,
    });
  }

  return new Response(
    "Inoreader connected successfully. The News Feeds tab will populate on the next sync run (/api/cron/news-feeds-sync).",
    { status: 200, headers: { "Content-Type": "text/plain" } }
  );
}
