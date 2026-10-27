import { notFound } from "next/navigation";
import { getAviationSafetyArticleBySlug } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { SiteHeader } from "@/app/components/SiteHeader";
import { QuickBrief } from "@/app/components/QuickBrief";
import { ReliabilityBadge } from "@/app/components/ReliabilityBadge";
import { VoiceoverButton, type VoiceoverSegment } from "@/app/components/VoiceoverButton";
import { AVIATION_SAFETY_REGION_LABELS } from "@/lib/aviationSafety";
import { proxiedImageUrl } from "@/lib/imageProxy";
import { format } from "date-fns";

export default async function AviationSafetyArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [article, session] = await Promise.all([getAviationSafetyArticleBySlug(slug), getSession()]);

  if (!article || article.status === "DRAFT") notFound();

  const voiceoverSegments: VoiceoverSegment[] = [
    { label: "Headline", text: article.title },
    {
      label: "Summary",
      text: [article.summaryP1, article.summaryP2, article.summaryP3].filter(Boolean).join(" "),
    },
    { label: "Safety Analysis", text: `Safety Analysis. ${article.safetyAnalysis}` },
    { label: "Preventative Measures", text: `Preventative Measures. ${article.preventativeMeasures}` },
    ...(article.hfacsAnalysis
      ? [{ label: "HFACS Categorisation", text: `HFACS Categorisation. ${article.hfacsAnalysis}` }]
      : []),
  ];

  return (
    <>
      <SiteHeader role={session?.role ?? null} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <p className="stencil mb-2 text-xs tracking-widest text-gold">
          {AVIATION_SAFETY_REGION_LABELS[article.region]}
          {article.country ? ` · ${article.country}` : ""} —{" "}
          {format(article.incidentDate ?? article.publishedAt ?? article.weekOf, "d MMM yyyy")}
        </p>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-danger">
          {article.incidentCategory}
        </p>
        <h1 className="stencil mb-3 text-2xl leading-tight text-foreground sm:text-3xl">
          {article.title}
        </h1>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <ReliabilityBadge score={article.reliabilityScore} />
          <QuickBrief bullets={article.bullets} />
          <VoiceoverButton segments={voiceoverSegments} />
          {article.aircraftInfo && (
            <span className="font-mono text-[10px] text-muted">{article.aircraftInfo}</span>
          )}
        </div>

        {article.images.length > 0 && (
          <figure className="mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element -- external source images */}
            <img
              src={proxiedImageUrl(article.images[0].url)}
              alt={article.images[0].caption}
              className="w-full rounded border border-border object-cover"
            />
            {article.images[0].caption && (
              <figcaption className="mt-1 font-mono text-[10px] text-muted">
                {article.images[0].caption}
              </figcaption>
            )}
          </figure>
        )}

        <article className="flex flex-col gap-4 text-[15px] leading-relaxed text-foreground">
          <p>{article.summaryP1}</p>
          <p>{article.summaryP2}</p>
          <p>{article.summaryP3}</p>
        </article>

        <div className="mt-6 rounded border border-danger/40 bg-panel p-4">
          <p className="stencil mb-2 text-xs tracking-widest text-danger">Safety Analysis</p>
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
            {article.safetyAnalysis}
          </p>
        </div>

        <div className="mt-4 rounded border border-accent/40 bg-panel p-4">
          <p className="stencil mb-2 text-xs tracking-widest text-accent-strong">Preventative Measures</p>
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
            {article.preventativeMeasures}
          </p>
        </div>

        {article.hfacsAnalysis && (
          <div className="mt-4 rounded border border-gold/40 bg-panel p-4">
            <p className="stencil mb-2 text-xs tracking-widest text-gold">
              HFACS Categorisation
            </p>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
              {article.hfacsAnalysis}
            </p>
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
