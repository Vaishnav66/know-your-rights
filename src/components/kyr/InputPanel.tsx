import { Mic, Keyboard, Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { t, type Lang } from "@/lib/i18n";

type Mode = "voice" | "text";

export function InputPanel({
  lang,
  mode,
  onModeChange,
  text,
  onTextChange,
  listening,
  voiceSupported,
  onMicStart,
  onMicStop,
  onSubmit,
  loading,
}: {
  lang: Lang;
  mode: Mode;
  onModeChange: (m: Mode) => void;
  text: string;
  onTextChange: (s: string) => void;
  listening: boolean;
  voiceSupported: boolean;
  onMicStart: () => void;
  onMicStop: () => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft">
      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => onModeChange("voice")}
          className={cn(
            "press-btn flex items-center justify-center gap-2 rounded-2xl py-3 text-base font-bold transition",
            mode === "voice"
              ? "bg-gradient-hero text-primary-foreground shadow-warm"
              : "bg-muted text-foreground/70 hover:text-foreground"
          )}
        >
          <Mic className="h-5 w-5" /> {t.speak[lang]}
        </button>
        <button
          onClick={() => onModeChange("text")}
          className={cn(
            "press-btn flex items-center justify-center gap-2 rounded-2xl py-3 text-base font-bold transition",
            mode === "text"
              ? "bg-gradient-green text-primary-foreground shadow-warm"
              : "bg-muted text-foreground/70 hover:text-foreground"
          )}
        >
          <Keyboard className="h-5 w-5" /> {t.type[lang]}
        </button>
      </div>

      {mode === "voice" ? (
        <div className="flex flex-col items-center gap-3 py-4">
          {!voiceSupported && (
            <p className="text-center text-sm text-destructive">{t.voiceUnsupported[lang]}</p>
          )}
          <button
            onClick={listening ? onMicStop : onMicStart}
            disabled={!voiceSupported}
            className={cn(
              "relative flex h-28 w-28 items-center justify-center rounded-full text-primary-foreground transition disabled:opacity-40",
              listening
                ? "bg-destructive pulse-mic"
                : "bg-gradient-hero shadow-warm hover:scale-105"
            )}
            aria-label={listening ? t.stop[lang] : t.tapToSpeak[lang]}
          >
            {listening ? <Square className="h-10 w-10" /> : <Mic className="h-12 w-12" />}
          </button>
          <p className="text-center text-sm font-semibold text-muted-foreground">
            {listening ? t.listening[lang] : t.tapToSpeak[lang]}
          </p>
          {text && (
            <div className="w-full rounded-2xl bg-muted/60 p-3 text-base">
              {text}
            </div>
          )}
        </div>
      ) : (
        <Textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={t.placeholder[lang]}
          className="min-h-[120px] resize-none rounded-2xl border-border/60 bg-background text-base"
        />
      )}

      <Button
        onClick={onSubmit}
        disabled={loading || text.trim().length < 3}
        size="lg"
        className="press-btn mt-4 w-full rounded-2xl bg-gradient-hero py-6 text-lg font-bold text-primary-foreground shadow-warm hover:opacity-95 disabled:opacity-50"
      >
        {loading ? t.thinking[lang] : (<><Send className="mr-2 h-5 w-5" /> {t.getAdvice[lang]}</>)}
      </Button>
    </div>
  );
}