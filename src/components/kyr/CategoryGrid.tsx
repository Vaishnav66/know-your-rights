import { CATEGORIES, t, type Lang } from "@/lib/i18n";

export function CategoryGrid({ lang, onPick }: { lang: Lang; onPick: (example: string) => void }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        {t.categories[lang]}
      </h2>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => onPick(c.example[lang])}
            className="press-btn group flex flex-col items-center gap-1.5 rounded-2xl border border-border/60 bg-card p-3 text-center shadow-soft transition hover:border-primary/40 hover:bg-primary/5"
          >
            <span className="text-3xl transition group-hover:scale-110">{c.icon}</span>
            <span className="text-xs font-semibold leading-tight text-foreground/80">
              {c.label[lang]}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}