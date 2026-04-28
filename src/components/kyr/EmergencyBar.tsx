import { Phone } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";

const calls: { key: keyof typeof t; number: string; tone: string }[] = [
  { key: "callPolice", number: "112", tone: "bg-section-next text-primary-foreground" },
  { key: "callWomen", number: "181", tone: "bg-section-law text-primary-foreground" },
  { key: "callChild", number: "1098", tone: "bg-section-decision text-primary-foreground" },
  { key: "callCyber", number: "1930", tone: "bg-section-why text-primary-foreground" },
];

export function EmergencyBar({ lang }: { lang: Lang }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {calls.map((c) => (
        <a
          key={c.number}
          href={`tel:${c.number}`}
          className={`press-btn flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-bold ${c.tone}`}
        >
          <Phone className="h-4 w-4" />
          {t[c.key][lang]}
        </a>
      ))}
    </div>
  );
}