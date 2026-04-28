import { LANGS, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ value, onChange }: { value: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-full bg-muted/70 p-1 shadow-soft">
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => onChange(l.code)}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-semibold transition",
            value === l.code
              ? "bg-primary text-primary-foreground shadow-warm"
              : "text-foreground/70 hover:text-foreground"
          )}
        >
          {l.native}
        </button>
      ))}
    </div>
  );
}