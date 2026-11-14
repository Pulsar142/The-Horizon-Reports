import type { ArticleSource } from "@/lib/types";

export function SourcesList({ sources, label = "Sources" }: { sources: ArticleSource[]; label?: string }) {
  if (sources.length === 0) return null;
  return (
    <div className="border-t border-border pt-4">
      <p className="stencil mb-2 text-xs tracking-widest text-muted">{label}</p>
      <ul className="flex flex-col gap-1 font-mono text-xs">
        {sources.map((s, i) => (
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
  );
}
