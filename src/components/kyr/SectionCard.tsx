import { Volume2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone = "problem" | "decision" | "why" | "law" | "next";
const toneClass: Record<Tone, string> = {
  problem: "bg-section-problem",
  decision: "bg-section-decision",
  why: "bg-section-why",
  law: "bg-section-law",
  next: "bg-section-next",
};

export function SectionCard({
  id,
  tone,
  icon,
  title,
  voiceText,
  children,
  lang,
  onSpeak,
  isSpeaking,
  onStop,
  delay = 0,
}: {
  id: string;
  tone: Tone;
  icon: ReactNode;
  title: string;
  voiceText: string;
  children: ReactNode;
  lang: Lang;
  onSpeak: () => void;
  isSpeaking: boolean;
  onStop: () => void;
  delay?: number;
}) {
  return (
    <div
      className="animate-fade-up rounded-3xl border border-border/60 bg-card p-1 shadow-soft"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-stretch gap-3 rounded-[20px] bg-card p-4 sm:p-5">
        <div className={cn("section-bar", toneClass[tone])} />
        <div className="flex-1">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground", toneClass[tone])}>
                {icon}
              </span>
              <h3 className="text-base font-bold leading-tight sm:text-lg">{title}</h3>
            </div>
            <Button
              size="sm"
              variant={isSpeaking ? "destructive" : "outline"}
              onClick={isSpeaking ? onStop : onSpeak}
              className="shrink-0 rounded-full"
              aria-label={isSpeaking ? t.stop[lang] : t.play[lang]}
            >
              {isSpeaking ? <Square className="mr-1 h-4 w-4" /> : <Volume2 className="mr-1 h-4 w-4" />}
              <span className="hidden sm:inline">{isSpeaking ? t.stop[lang] : t.play[lang]}</span>
            </Button>
          </div>
          <div className="text-base leading-relaxed text-foreground/90 sm:text-[17px]">{children}</div>
        </div>
      </div>
    </div>
  );
}