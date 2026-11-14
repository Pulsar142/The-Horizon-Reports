import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import type { Role } from "@/lib/session";

export function SiteHeader({ role }: { role: Role | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-panel/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-baseline gap-3">
          <span className="stencil text-xl font-bold tracking-widest text-foreground sm:text-2xl">
            Data Driven Combat Readiness
          </span>
          <span className="hidden font-mono text-[10px] tracking-[0.25em] text-gold sm:inline">
            / NEWS UPDATE
          </span>
        </Link>
        <nav className="flex items-center gap-3 font-mono text-xs">
          <Link
            href="/aviation-safety"
            className="rounded border border-danger/60 px-3 py-1.5 text-danger hover:bg-danger hover:text-background transition-colors"
          >
            Aviation Safety
          </Link>
          <Link
            href="/news-feeds"
            className="rounded border border-accent/60 px-3 py-1.5 text-accent hover:bg-accent hover:text-background transition-colors"
          >
            Trending News
          </Link>
          <Link
            href="/regional-knowledge"
            className="rounded border border-gold/60 px-3 py-1.5 text-gold hover:bg-gold hover:text-background transition-colors"
          >
            Regional Knowledge
          </Link>
          {role === "admin" && (
            <Link
              href="/admin"
              className="rounded border border-accent px-3 py-1.5 text-accent-strong hover:bg-accent hover:text-background transition-colors"
            >
              Admin
            </Link>
          )}
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded border border-border px-3 py-1.5 text-muted hover:border-danger hover:text-danger transition-colors"
            >
              Log out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
