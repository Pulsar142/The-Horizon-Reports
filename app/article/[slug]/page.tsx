import { notFound } from "next/navigation";
import { getArticleBySlug } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { SiteHeader } from "@/app/components/SiteHeader";
import { QuickBrief } from "@/app/components/QuickBrief";
import { ReliabilityBadge } from "@/app/components/ReliabilityBadge";
import { VoiceoverButton, type VoiceoverSegment } from "@/app/components/VoiceoverButton";
import { REGION_LABELS } from "@/lib/sources";
import { storyDateLabel } from "@/lib/weeks";
import { proxiedImageUrl } from "@/lib/imageProxy";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [article, session] = await Promise.all([getArticleBySlug(slug), getSession()]);

  if (!article || article.status === "DRAFT") notFound();

  const voiceoverSegments: VoiceoverSegment[] = [
    { label: "Headline", text: article.title },
    {
      label: "Summary",
      text: [article.summaryP1, article.summaryP2, article.summaryP3].filter(Boolean).join(" "),
    },
    { label: "Did You Know?", text: `Did You Know? ${article.didYouKnow}` },
    ...(!article.singaporeImpactHidden && article.singaporeImpact
      ? [{ label: "Impact towards Singapore", text: `Impact towards Singapore. ${article.singaporeImpact}` }]
      : []),
    ...(!article.analysisHidden
      ? [
          {
            label: "Strategic Relevance in South East Asia",
            text: `Strategic Relevance in South East Asia. ${article.strategicRelevance}`,
          },
          {
            label: "Military Perspective in South East Asia",
            text: `Military Perspective in South East Asia. ${article.militaryPerspective}`,
          },
        ]
      : []),
  ];

  return (
    <>
      <SiteHeader role={session?.role ?? null} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <p className="stencil mb-2 text-xs tracking-widest text-gold">
          {REGION_LABELS[article.region]}
          {article.country ? ` · ${article.country}` : ""} —{" "}
          {storyDateLabel(article.articleDate, article.publishedAt, article.weekOf)}
        </p>
        <h1 className="stencil mb-3 text-2xl leading-tight text-foreground sm:text-3xl">
          {article.title}
        </h1>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <ReliabilityBadge score={article.reliabilityScore} />
          <QuickBrief bullets={article.bullets} />
          <VoiceoverButton segments={voiceoverSegments} />
        </div>

        {article.images.length > 0 && (
          <div className={`mb-6 grid gap-3 ${article.images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
            {article.images.slice(0, 2).map((img, i) => (
              <figure key={i}>
                {/* eslint-disable-next-line @next/next/no-img-element -- external source images */}
                <img
                  src={proxiedImageUrl(img.url)}
                  alt={img.caption}
                  className="w-full rounded border border-border object-cover"
                />
                {img.caption && (
                  <figcaption className="mt-1 font-mono text-[10px] text-muted">
                    {img.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}

        <article className="flex flex-col gap-4 text-[15px] leading-relaxed text-foreground">
          <p>{article.summaryP1}</p>
          <p>{article.summaryP2}</p>
          {article.summaryP3 && <p>{article.summaryP3}</p>}
        </article>

        <div className="mt-6 rounded border border-border bg-panel p-4">
          <p className="stencil mb-2 text-xs tracking-widest text-accent-strong">Did You Know?</p>
          <p className="text-sm leading-relaxed text-foreground">{article.didYouKnow}</p>
        </div>

        {!article.singaporeImpactHidden && article.singaporeImpact && (
          <div className="mt-4 rounded border border-accent/40 bg-panel p-4">
            <p className="stencil mb-2 text-xs tracking-widest text-accent-strong">
              Impact towards Singapore
            </p>
            <p className="text-sm leading-relaxed text-foreground">{article.singaporeImpact}</p>
          </div>
        )}

        {!article.analysisHidden && (
          <div className="mt-4 flex flex-col gap-4">
            <div className="rounded border border-gold/40 bg-panel p-4">
              <p className="stencil mb-2 text-xs tracking-widest text-gold">
                Strategic Relevance in South East Asia
              </p>
              <p className="text-sm leading-relaxed text-foreground">{article.strategicRelevance}</p>
            </div>
            <div className="rounded border border-gold/40 bg-panel p-4">
              <p className="stencil mb-2 text-xs tracking-widest text-gold">
                Military Perspective in South East Asia
              </p>
              <p className="text-sm leading-relaxed text-foreground">{article.militaryPerspective}</p>
            </div>
          </div>
        )}

        <div className="mt-6 border-t border-border pt-4">
          <p className="stencil mb-2 text-xs tracking-widest text-muted">
            Sources ({article.reliabilityScore} corroborating)
          </p>
          <ul className="flex flex-col gap-1 font-mono text-xs">
            {article.sources.map((s, i) => (
              <li key={i}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-accent-strong hover:underline"
                >
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}
