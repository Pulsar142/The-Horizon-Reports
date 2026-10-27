import Link from "next/link";
import { db } from "@/lib/db";
import { REGION_LABELS } from "@/lib/sources";
import { weekLabel } from "@/lib/weeks";
import { ReliabilityBadge } from "@/app/components/ReliabilityBadge";
import { publishAction, discardDraftAction } from "@/app/actions/admin";
import { RegenerateButtons } from "@/app/admin/(protected)/pending/RegenerateButtons";
import { HideAnalysisButton } from "@/app/admin/(protected)/edit/HideAnalysisButton";
import { HideSingaporeImpactButton } from "@/app/admin/(protected)/edit/HideSingaporeImpactButton";
import type { ArticleImage } from "@/lib/types";
import { proxiedImageUrl } from "@/lib/imageProxy";

export default async function PendingReviewPage() {
  const drafts = await db.article.findMany({
    where: { status: "DRAFT" },
    orderBy: { generatedAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="stencil text-xl text-foreground">Pending Review</h1>
      <p className="font-mono text-xs text-muted">
        Bot-generated (or admin-triggered) drafts awaiting verification before they go live.
      </p>

      {drafts.length === 0 ? (
        <p className="rounded border border-border bg-panel p-6 text-center text-sm text-muted">
          Nothing waiting on review. Use the Generate tab to draft a new briefing.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {drafts.map((d) => {
            const image = (JSON.parse(d.images) as ArticleImage[])[0] ?? null;
            const isPlaceholder = !image || image.url === "/placeholder-briefing.svg";
            return (
            <div key={d.id} className="flex gap-3 rounded border border-border bg-panel p-4">
              <div className="hidden w-32 shrink-0 sm:block">
                <div className="aspect-video overflow-hidden rounded border border-border bg-panel-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- external/uploaded image, arbitrary source */}
                  <img
                    src={proxiedImageUrl(image?.url)}
                    alt={image?.caption ?? d.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                {isPlaceholder && (
                  <p className="mt-1 font-mono text-[10px] text-gold">No verified image — edit before publishing.</p>
                )}
              </div>
              <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="stencil text-xs tracking-widest text-gold">
                  {REGION_LABELS[d.region]}
                  {d.country ? ` · ${d.country}` : ""} — {weekLabel(d.weekOf)}
                </p>
                <ReliabilityBadge score={d.reliabilityScore} />
              </div>
              <h2 className="mb-1 text-lg font-semibold text-foreground">{d.title}</h2>
              <p className="mb-3 text-sm text-muted line-clamp-2">{d.summaryP1}</p>
              <div className="flex flex-wrap gap-2 font-mono text-xs">
                <form action={publishAction}>
                  <input type="hidden" name="articleId" value={d.id} />
                  <button className="rounded bg-accent px-3 py-1.5 font-semibold text-background hover:bg-accent-strong transition-colors">
                    Publish
                  </button>
                </form>
                <Link
                  href={`/admin/edit/${d.id}`}
                  className="rounded border border-border px-3 py-1.5 text-foreground hover:border-accent transition-colors"
                >
                  Edit
                </Link>
                <RegenerateButtons articleId={d.id} region={d.region} country={d.country} />
                <HideAnalysisButton articleId={d.id} hidden={d.analysisHidden} />
                <HideSingaporeImpactButton articleId={d.id} hidden={d.singaporeImpactHidden} />
                <form action={discardDraftAction}>
                  <input type="hidden" name="articleId" value={d.id} />
                  <button className="rounded border border-border px-3 py-1.5 text-muted hover:border-danger hover:text-danger transition-colors">
                    Discard
                  </button>
                </form>
              </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
