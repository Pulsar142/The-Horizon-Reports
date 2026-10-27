import type { AircraftRecognition as AircraftRecognitionCard } from "@/generated/prisma/client";
import { proxiedImageUrl } from "@/lib/imageProxy";

const CATEGORY_LABELS: Record<string, string> = {
  FIGHTER_JET: "Fighter Jet",
  HELICOPTER: "Helicopter",
  UAV: "UAV/UAS",
  COMMERCIAL_AIRLINER: "Commercial Airliner",
};

function Card({ card }: { card: AircraftRecognitionCard }) {
  return (
    <div className="flex flex-col gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- external, arbitrary-host photo URLs */}
      <img
        src={proxiedImageUrl(card.imageUrl)}
        alt={card.aircraftName}
        className="w-full rounded border border-border object-cover"
      />
      <div className="border-l border-border pl-3">
        <p className="text-sm font-semibold text-foreground">{card.aircraftName}</p>
        <p className="font-mono text-[10px] text-muted">
          {CATEGORY_LABELS[card.category] ?? card.category}
          {card.operator ? ` · ${card.operator}` : ""}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-foreground">{card.description}</p>
        {card.imageSourceUrl && (
          <a
            href={card.imageSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block font-mono text-[10px] text-accent hover:text-accent-strong hover:underline"
          >
            {card.imageSourceName ?? "Source"} ↗
          </a>
        )}
      </div>
    </div>
  );
}

/** Shows the single currently-published Aircraft Recognition card — nothing renders when none is published. */
export function AircraftRecognition({ card }: { card: AircraftRecognitionCard | null }) {
  if (!card) return null;

  return (
    <>
      <details className="mb-4 rounded border border-gold/40 bg-panel lg:hidden">
        <summary className="stencil cursor-pointer px-4 py-3 text-sm tracking-widest text-gold">
          Aircraft Recognition
        </summary>
        <div className="border-t border-border p-4">
          <Card card={card} />
        </div>
      </details>
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="rounded border border-gold/40 bg-panel p-4">
          <p className="stencil mb-3 text-sm tracking-widest text-gold">Aircraft Recognition</p>
          <Card card={card} />
        </div>
      </aside>
    </>
  );
}
