import Link from "next/link";
import type { ArticleCard } from "@/lib/queries";
import { REGION_LABELS } from "@/lib/sources";
import { storyDateLabel } from "@/lib/weeks";
import { proxiedImageUrl } from "@/lib/imageProxy";
import { ReliabilityBadge } from "@/app/components/ReliabilityBadge";

export function ArticleCardView({ article }: { article: ArticleCard }) {
  return (
    <Link
      href={`/article/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded border border-border bg-panel transition-colors hover:border-accent"
    >
      <div className="relative aspect-video w-full overflow-hidden border-b border-border bg-panel-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- images come from arbitrary bot-selected source domains */}
        <img
          src={proxiedImageUrl(article.image?.url)}
          alt={article.image?.caption ?? article.title}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
        <span className="stencil absolute left-2 top-2 rounded bg-background/80 px-2 py-0.5 text-[10px] tracking-widest text-gold">
          {REGION_LABELS[article.region]}
          {article.country ? ` · ${article.country}` : ""}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="stencil text-base leading-tight text-foreground group-hover:text-accent-strong">
          {article.title}
        </h3>
        <p className="text-sm text-muted line-clamp-3">{article.teaser}</p>
        <div className="mt-auto flex items-center justify-between pt-2 font-mono text-[10px] text-muted">
          <span>{storyDateLabel(article.articleDate, article.publishedAt, article.weekOf)}</span>
          <ReliabilityBadge score={article.reliabilityScore} />
        </div>
      </div>
    </Link>
  );
}
