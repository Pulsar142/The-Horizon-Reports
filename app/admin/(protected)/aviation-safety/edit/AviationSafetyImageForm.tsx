"use client";

import { useActionState } from "react";
import { replaceAviationSafetyImageAction } from "@/app/actions/admin";
import type { ArticleImage, ArticleSource } from "@/lib/types";
import { proxiedImageUrl } from "@/lib/imageProxy";

export function AviationSafetyImageForm({
  id,
  image,
  sources,
}: {
  id: string;
  image: ArticleImage | null;
  sources: ArticleSource[];
}) {
  const [state, formAction, pending] = useActionState(replaceAviationSafetyImageAction, undefined);
  const isPlaceholder = !image || image.url === "/placeholder-briefing.svg";

  const field =
    "rounded border border-border bg-panel-2 px-3 py-2 text-foreground outline-none focus:border-accent";
  const label = "font-mono text-xs uppercase tracking-widest text-muted";

  return (
    <div className="flex flex-col gap-3 rounded border border-border bg-panel p-4">
      <p className="stencil text-xs tracking-widest text-foreground">Incident Image</p>

      {isPlaceholder && (
        <p className="rounded border border-gold/40 bg-gold/10 px-3 py-2 font-mono text-xs text-gold">
          No verified real image on file — this briefing is currently using the placeholder. Open a
          source link below, save a real photo of the incident/aircraft, then upload it here before
          publishing.
        </p>
      )}

      <div className="aspect-video w-full max-w-sm overflow-hidden rounded border border-border bg-panel-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- external/uploaded image, arbitrary source */}
        <img
          src={proxiedImageUrl(image?.url)}
          alt={image?.caption ?? "Current briefing image"}
          className="h-full w-full object-cover"
        />
      </div>

      {sources.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className={label}>Source links (open one to save its image)</span>
          <div className="flex flex-wrap gap-2 font-mono text-xs">
            {sources.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="rounded border border-accent/50 px-2 py-1 text-accent-strong hover:bg-accent hover:text-background transition-colors"
              >
                {s.name} ↗
              </a>
            ))}
          </div>
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-2 border-t border-border pt-3">
        <input type="hidden" name="id" value={id} />

        <label className="flex flex-col gap-2">
          <span className={label}>Upload a saved image</span>
          <input type="file" name="image" accept="image/*" className={field} />
        </label>

        <label className="flex flex-col gap-2">
          <span className={label}>…or paste an image URL instead</span>
          <input type="url" name="imageUrl" placeholder="https://…" className={field} />
        </label>

        <label className="flex flex-col gap-2">
          <span className={label}>Caption (optional)</span>
          <input type="text" name="caption" defaultValue={image?.caption ?? ""} className={field} />
        </label>

        {state?.error && <p className="font-mono text-xs text-danger">{state.error}</p>}
        {state?.ok && <p className="font-mono text-xs text-accent-strong">Image updated.</p>}

        <button
          type="submit"
          disabled={pending}
          className="stencil mt-1 self-start rounded border border-accent px-4 py-2 text-xs font-semibold tracking-widest text-accent-strong hover:bg-accent hover:text-background transition-colors disabled:opacity-60"
        >
          {pending ? "Uploading…" : "Replace Image"}
        </button>
      </form>
    </div>
  );
}
