import Link from "next/link";
import { db } from "@/lib/db";
import { AviationSafetyForm } from "@/app/admin/(protected)/aviation-safety/AviationSafetyForm";
import { AVIATION_SAFETY_REGION_LABELS } from "@/lib/aviationSafety";
import { weekLabel } from "@/lib/weeks";
import {
  cancelAviationSafetyRequestAction,
  publishAviationSafetyAction,
  archiveAviationSafetyAction,
  deleteAviationSafetyAction,
} from "@/app/actions/admin";
import type { ArticleImage } from "@/lib/types";
import { proxiedImageUrl } from "@/lib/imageProxy";

const STATUS_STYLE: Record<string, string> = {
  PENDING: "text-gold",
  FULFILLED: "text-accent-strong",
  FAILED: "text-danger",
};

export default async function AviationSafetyAdminPage() {
  const requests = await db.aviationSafetyRequest.findMany({
    orderBy: { requestedAt: "desc" },
    take: 10,
  });
  const articles = await db.aviationSafetyArticle.findMany({
    orderBy: { generatedAt: "desc" },
    take: 30,
  });

  const drafts = articles.filter((a) => a.status === "DRAFT");
  const published = articles.filter((a) => a.status === "PUBLISHED");
  const archived = articles.filter((a) => a.status === "ARCHIVED");

  const Row = ({
    a,
    actions,
  }: {
    a: (typeof articles)[number];
    actions: React.ReactNode;
  }) => {
    const image = (JSON.parse(a.images) as ArticleImage[])[0] ?? null;
    return (
      <div className="flex gap-3 rounded border border-border bg-panel p-4">
        <div className="hidden w-32 shrink-0 sm:block">
          <div className="aspect-video overflow-hidden rounded border border-border bg-panel-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- external, arbitrary-host photo URLs */}
            <img
              src={proxiedImageUrl(image?.url)}
              alt={image?.caption ?? a.title}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="stencil text-xs tracking-widest text-gold">
              {AVIATION_SAFETY_REGION_LABELS[a.region]}
              {a.country ? ` · ${a.country}` : ""} — {weekLabel(a.weekOf)}
            </p>
            <span className="font-mono text-[10px] uppercase tracking-widest text-danger">
              {a.incidentCategory}
            </span>
          </div>
          <h2 className="mb-1 text-lg font-semibold text-foreground">{a.title}</h2>
          <p className="mb-3 text-sm text-muted line-clamp-2">{a.summaryP1}</p>
          <div className="flex flex-wrap gap-2 font-mono text-xs">{actions}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="stencil text-xl text-foreground">Aviation Safety</h1>
      <p className="max-w-xl font-mono text-xs text-muted">
        Grounded, ICAO SMS-scoped incident briefings for aviation personnel. Auto-generates as
        drafts (Asia + Global) every Monday 09:00 SGT — review and publish here, same as news
        articles.
      </p>

      <AviationSafetyForm />

      {requests.length > 0 && (
        <details className="mt-2" open>
          <summary className="stencil mb-2 cursor-pointer text-sm tracking-widest text-foreground">
            Aviation Safety Requests ({requests.length})
          </summary>
          <div className="mt-2 flex flex-col gap-2">
            {requests.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-border bg-panel p-3 font-mono text-xs"
              >
                <span>
                  {AVIATION_SAFETY_REGION_LABELS[r.region]}
                  {r.country ? ` · ${r.country}` : ""} —{" "}
                  <span className={STATUS_STYLE[r.status]}>{r.status}</span>
                  {r.note ? ` (${r.note})` : ""}
                </span>
                {r.status === "PENDING" && (
                  <form action={cancelAviationSafetyRequestAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="rounded border border-border px-2 py-1 text-muted hover:border-danger hover:text-danger transition-colors">
                      Cancel
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </details>
      )}

      <section className="mt-2">
        <h2 className="stencil mb-2 text-sm tracking-widest text-foreground">
          Pending Review ({drafts.length})
        </h2>
        {drafts.length === 0 ? (
          <p className="rounded border border-border bg-panel p-4 text-center font-mono text-xs text-muted">
            Nothing waiting on review.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {drafts.map((a) => (
              <Row
                key={a.id}
                a={a}
                actions={
                  <>
                    <Link
                      href={`/admin/aviation-safety/edit/${a.id}`}
                      className="rounded border border-border px-3 py-1.5 text-foreground hover:border-accent transition-colors"
                    >
                      Edit
                    </Link>
                    <form action={publishAviationSafetyAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className="rounded bg-accent px-3 py-1.5 font-semibold text-background hover:bg-accent-strong transition-colors">
                        Publish
                      </button>
                    </form>
                    <form action={deleteAviationSafetyAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className="rounded border border-border px-3 py-1.5 text-muted hover:border-danger hover:text-danger transition-colors">
                        Discard
                      </button>
                    </form>
                  </>
                }
              />
            ))}
          </div>
        )}
      </section>

      {published.length > 0 && (
        <section className="mt-2">
          <h2 className="stencil mb-2 text-sm tracking-widest text-foreground">
            Published ({published.length})
          </h2>
          <div className="flex flex-col gap-3">
            {published.map((a) => (
              <Row
                key={a.id}
                a={a}
                actions={
                  <>
                    <Link
                      href={`/admin/aviation-safety/edit/${a.id}`}
                      className="rounded border border-border px-3 py-1.5 text-foreground hover:border-accent transition-colors"
                    >
                      Edit
                    </Link>
                    <form action={archiveAviationSafetyAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className="rounded border border-border px-3 py-1.5 text-muted hover:border-gold hover:text-gold transition-colors">
                        Archive
                      </button>
                    </form>
                    <form action={deleteAviationSafetyAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className="rounded border border-border px-3 py-1.5 text-muted hover:border-danger hover:text-danger transition-colors">
                        Delete
                      </button>
                    </form>
                  </>
                }
              />
            ))}
          </div>
        </section>
      )}

      {archived.length > 0 && (
        <details className="mt-2">
          <summary className="stencil cursor-pointer text-sm tracking-widest text-muted">
            Archived ({archived.length})
          </summary>
          <div className="mt-2 flex flex-col gap-3">
            {archived.map((a) => (
              <Row
                key={a.id}
                a={a}
                actions={
                  <>
                    <Link
                      href={`/admin/aviation-safety/edit/${a.id}`}
                      className="rounded border border-border px-3 py-1.5 text-foreground hover:border-accent transition-colors"
                    >
                      Edit
                    </Link>
                    <form action={publishAviationSafetyAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className="rounded border border-gold px-3 py-1.5 text-gold hover:bg-gold hover:text-background transition-colors">
                        Republish
                      </button>
                    </form>
                    <form action={deleteAviationSafetyAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className="rounded border border-border px-3 py-1.5 text-muted hover:border-danger hover:text-danger transition-colors">
                        Delete
                      </button>
                    </form>
                  </>
                }
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
