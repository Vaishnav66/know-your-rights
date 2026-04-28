import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Scale, Sparkles, Clock, LogOut, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/kyr/LanguageSwitcher";
import { EmergencyBar } from "@/components/kyr/EmergencyBar";
import { CategoryGrid } from "@/components/kyr/CategoryGrid";
import { InputPanel } from "@/components/kyr/InputPanel";
import { ResultView, type Decision } from "@/components/kyr/ResultView";
import { useSpeechRecognition } from "@/hooks/useSpeech";
import { t, type Lang } from "@/lib/i18n";

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("kyr-lang") as Lang) || "en");
  const [mode, setMode] = useState<"voice" | "text">("text");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [lastSituation, setLastSituation] = useState("");
  const { toast } = useToast();

  const { listening, transcript, supported, start, stop } = useSpeechRecognition(lang);

  useEffect(() => {
    if (transcript) setText(transcript);
  }, [transcript]);

  useEffect(() => {
    localStorage.setItem("kyr-lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  if (authLoading) {
    return <div className="grid min-h-screen place-items-center bg-gradient-cream"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!user) return <Navigate to="/" replace />;

  const handleSubmit = async () => {
    if (!text.trim()) return;
    const situation = text.trim();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("legal-decision", {
        body: { situation, language: lang },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const d = (data as any).decision as Decision;
      setDecision(d);
      setLastSituation(situation);
      // Save to history (best effort)
      supabase.from("search_history").insert({
        user_id: user.id,
        situation,
        language: lang,
        category: d.category ?? null,
        urgency: d.urgency ?? null,
        decision: d as any,
      }).then(({ error: e }) => { if (e) console.warn("history save failed", e); });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      toast({
        title: t.errorTitle[lang],
        description: e?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setDecision(null);
    setText("");
  };

  return (
    <main className="min-h-screen bg-gradient-cream pb-12">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/40 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-hero shadow-warm">
              <Scale className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <h1 className="font-display text-base font-bold sm:text-lg">{t.appName[lang]}</h1>
              <p className="text-[11px] text-muted-foreground">India · Free · Multilingual</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="icon" className="rounded-full" title={t.history[lang]}>
              <Link to="/history"><Clock className="h-5 w-5" /></Link>
            </Button>
            <LanguageSwitcher value={lang} onChange={setLang} />
            <Button variant="ghost" size="icon" className="rounded-full" onClick={signOut} title={t.signOut[lang]}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-5 px-4 pt-5">
        {decision ? (
          <ResultView decision={decision} lang={lang} situation={lastSituation} onBack={reset} onAskAnother={reset} />
        ) : (
          <>
            {/* Hero */}
            <section className="overflow-hidden rounded-3xl bg-gradient-hero p-6 text-primary-foreground shadow-warm">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-1 h-6 w-6 shrink-0" />
                <div>
                  <h2 className="font-display text-2xl font-bold leading-tight sm:text-3xl">
                    {t.describe[lang]}
                  </h2>
                  <p className="mt-2 text-sm text-primary-foreground/90 sm:text-base">
                    {t.tagline[lang]}
                  </p>
                </div>
              </div>
            </section>

            <InputPanel
              lang={lang}
              mode={mode}
              onModeChange={(m) => { setMode(m); if (m !== "voice" && listening) stop(); }}
              text={text}
              onTextChange={setText}
              listening={listening}
              voiceSupported={supported}
              onMicStart={start}
              onMicStop={stop}
              onSubmit={handleSubmit}
              loading={loading}
            />

            <CategoryGrid lang={lang} onPick={(ex) => { setMode("text"); setText(ex); }} />

            {/* Emergency */}
            <section className="rounded-3xl border border-destructive/20 bg-card p-4 shadow-soft">
              <div className="mb-3">
                <h2 className="text-base font-bold text-destructive">{t.emergency[lang]}</h2>
                <p className="text-xs text-muted-foreground">{t.emergencyDesc[lang]}</p>
              </div>
              <EmergencyBar lang={lang} />
            </section>

            <p className="px-2 text-center text-[11px] leading-relaxed text-muted-foreground">
              ⚖️ AI guidance — not a substitute for a qualified lawyer.
            </p>
          </>
        )}
      </div>
    </main>
  );
};

export default Index;
