import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, HelpCircle, Scale, Footprints, ArrowLeft, RefreshCw, ShieldCheck, FileText, PhoneCall, AlertTriangle, HeartHandshake, Phone, Download, Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "./SectionCard";
import { t, type Lang } from "@/lib/i18n";
import { useTextToSpeech } from "@/hooks/useSpeech";
import { downloadDecisionPDF } from "@/lib/pdf";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export type Decision = {
  category: string;
  problem: string;
  decision: string;
  reasoning: string;
  law: string;
  rights?: string[];
  nextSteps: string[];
  documents?: string[];
  helplines?: { name: string; number: string }[];
  warnings?: string[];
  freeHelp?: string;
  urgency: "low" | "medium" | "high";
};

export function ResultView({
  decision,
  lang,
  situation,
  onBack,
  onAskAnother,
}: {
  decision: Decision;
  lang: Lang;
  situation?: string;
  onBack: () => void;
  onAskAnother: () => void;
}) {
  const { speak, stop, speakingId } = useTextToSpeech();
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sit = situation ?? decision.problem;

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", user.id)
        .eq("situation", sit)
        .limit(1)
        .maybeSingle();
      if (active && data) setBookmarkId(data.id);
    })();
    return () => { active = false; };
  }, [user, sit]);

  const toggleBookmark = async () => {
    if (!user) return;
    setBusy(true);
    try {
      if (bookmarkId) {
        const { error } = await supabase.from("bookmarks").delete().eq("id", bookmarkId);
        if (error) throw error;
        setBookmarkId(null);
      } else {
        const { data, error } = await supabase.from("bookmarks").insert({
          user_id: user.id,
          situation: sit,
          language: lang,
          category: decision.category ?? null,
          urgency: decision.urgency ?? null,
          decision: decision as any,
        }).select("id").single();
        if (error) throw error;
        setBookmarkId(data.id);
        toast({ title: t.bookmarked[lang] });
      }
    } catch (e: any) {
      toast({ title: t.errorTitle[lang], description: e?.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = () => {
    downloadDecisionPDF(decision, {
      appName: t.appName.en, // header always Latin so it always renders
      category: t.category[lang],
      problem: t.problem[lang],
      decision: t.decision[lang],
      why: t.why[lang],
      law: t.law[lang],
      rights: t.rights[lang],
      next: t.next[lang],
      documents: t.documents[lang],
      helplines: t.helplines[lang],
      warnings: t.warnings[lang],
      freeHelp: t.freeHelp[lang],
      checklist: t.checklist[lang],
      disclaimer: t.disclaimer[lang],
      generated: t.generated[lang],
    });
  };

  const urgencyLabel =
    decision.urgency === "high" ? t.urgencyHigh[lang] :
    decision.urgency === "medium" ? t.urgencyMed[lang] : t.urgencyLow[lang];

  const urgencyClass =
    decision.urgency === "high" ? "bg-destructive text-destructive-foreground" :
    decision.urgency === "medium" ? "bg-primary text-primary-foreground" :
    "bg-secondary text-secondary-foreground";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="rounded-full">
          <ArrowLeft className="mr-1 h-4 w-4" /> {t.back[lang]}
        </Button>
        <div className="flex items-center gap-2">
          {user && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={toggleBookmark}
              className="rounded-full"
            >
              {bookmarkId ? <BookmarkCheck className="mr-1 h-4 w-4 text-accent" /> : <Bookmark className="mr-1 h-4 w-4" />}
              {bookmarkId ? t.bookmarked[lang] : t.bookmark[lang]}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="rounded-full"
          >
            <Download className="mr-1 h-4 w-4" /> {t.download[lang]}
          </Button>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${urgencyClass}`}>
            {urgencyLabel.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="rounded-2xl bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
        {decision.category}
      </div>

      <SectionCard
        id="problem" tone="problem" lang={lang}
        icon={<AlertCircle className="h-5 w-5" />}
        title={t.problem[lang]}
        voiceText={decision.problem}
        isSpeaking={speakingId === "problem"}
        onSpeak={() => speak("problem", decision.problem, lang)}
        onStop={stop}
        delay={0}
      >
        {decision.problem}
      </SectionCard>

      <SectionCard
        id="decision" tone="decision" lang={lang}
        icon={<CheckCircle2 className="h-5 w-5" />}
        title={t.decision[lang]}
        voiceText={decision.decision}
        isSpeaking={speakingId === "decision"}
        onSpeak={() => speak("decision", decision.decision, lang)}
        onStop={stop}
        delay={80}
      >
        <p className="font-semibold">{decision.decision}</p>
      </SectionCard>

      <SectionCard
        id="why" tone="why" lang={lang}
        icon={<HelpCircle className="h-5 w-5" />}
        title={t.why[lang]}
        voiceText={decision.reasoning}
        isSpeaking={speakingId === "why"}
        onSpeak={() => speak("why", decision.reasoning, lang)}
        onStop={stop}
        delay={160}
      >
        {decision.reasoning}
      </SectionCard>

      <SectionCard
        id="law" tone="law" lang={lang}
        icon={<Scale className="h-5 w-5" />}
        title={t.law[lang]}
        voiceText={decision.law}
        isSpeaking={speakingId === "law"}
        onSpeak={() => speak("law", decision.law, lang)}
        onStop={stop}
        delay={240}
      >
        {decision.law}
      </SectionCard>

      {decision.rights && decision.rights.length > 0 && (
        <SectionCard
          id="rights" tone="decision" lang={lang}
          icon={<ShieldCheck className="h-5 w-5" />}
          title={t.rights[lang]}
          voiceText={decision.rights.join(". ")}
          isSpeaking={speakingId === "rights"}
          onSpeak={() => speak("rights", decision.rights!.join(". "), lang)}
          onStop={stop}
          delay={280}
        >
          <ul className="space-y-2">
            {decision.rights.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1 text-section-decision">✓</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      <SectionCard
        id="next" tone="next" lang={lang}
        icon={<Footprints className="h-5 w-5" />}
        title={t.next[lang]}
        voiceText={decision.nextSteps.join(". ")}
        isSpeaking={speakingId === "next"}
        onSpeak={() => speak("next", decision.nextSteps.join(". "), lang)}
        onStop={stop}
        delay={320}
      >
        <ol className="space-y-2">
          {decision.nextSteps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-section-next text-sm font-bold text-primary-foreground">
                {i + 1}
              </span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
      </SectionCard>

      {decision.documents && decision.documents.length > 0 && (
        <SectionCard
          id="docs" tone="why" lang={lang}
          icon={<FileText className="h-5 w-5" />}
          title={t.documents[lang]}
          voiceText={decision.documents.join(". ")}
          isSpeaking={speakingId === "docs"}
          onSpeak={() => speak("docs", decision.documents!.join(". "), lang)}
          onStop={stop}
          delay={360}
        >
          <ul className="grid gap-2 sm:grid-cols-2">
            {decision.documents.map((d, i) => (
              <li key={i} className="flex items-start gap-2 rounded-xl bg-muted/50 px-3 py-2 text-sm">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-section-why" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {decision.helplines && decision.helplines.length > 0 && (
        <SectionCard
          id="lines" tone="problem" lang={lang}
          icon={<PhoneCall className="h-5 w-5" />}
          title={t.helplines[lang]}
          voiceText={decision.helplines.map(h => `${h.name} ${h.number}`).join(". ")}
          isSpeaking={speakingId === "lines"}
          onSpeak={() => speak("lines", decision.helplines!.map(h => `${h.name} ${h.number}`).join(". "), lang)}
          onStop={stop}
          delay={400}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {decision.helplines.map((h, i) => (
              <a
                key={i}
                href={`tel:${h.number.replace(/\s+/g, "")}`}
                className="press-btn flex items-center justify-between gap-3 rounded-xl border border-section-problem/30 bg-section-problem/10 px-3 py-2.5 text-sm font-semibold transition hover:bg-section-problem/20"
              >
                <span className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-section-problem" />
                  {h.name}
                </span>
                <span className="font-mono text-section-problem">{h.number}</span>
              </a>
            ))}
          </div>
        </SectionCard>
      )}

      {decision.warnings && decision.warnings.length > 0 && (
        <SectionCard
          id="warn" tone="problem" lang={lang}
          icon={<AlertTriangle className="h-5 w-5" />}
          title={t.warnings[lang]}
          voiceText={decision.warnings.join(". ")}
          isSpeaking={speakingId === "warn"}
          onSpeak={() => speak("warn", decision.warnings!.join(". "), lang)}
          onStop={stop}
          delay={440}
        >
          <ul className="space-y-2">
            {decision.warnings.map((w, i) => (
              <li key={i} className="flex gap-2 rounded-xl bg-destructive/5 px-3 py-2 text-sm">
                <span className="mt-0.5 text-destructive">⚠</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {decision.freeHelp && (
        <SectionCard
          id="free" tone="decision" lang={lang}
          icon={<HeartHandshake className="h-5 w-5" />}
          title={t.freeHelp[lang]}
          voiceText={decision.freeHelp}
          isSpeaking={speakingId === "free"}
          onSpeak={() => speak("free", decision.freeHelp!, lang)}
          onStop={stop}
          delay={480}
        >
          <p>{decision.freeHelp}</p>
          <a
            href="tel:15100"
            className="press-btn mt-3 inline-flex items-center gap-2 rounded-xl bg-section-decision px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            <Phone className="h-4 w-4" /> {t.call[lang]} 15100 (DLSA)
          </a>
        </SectionCard>
      )}

      <Button
        onClick={onAskAnother}
        size="lg"
        className="press-btn mt-4 w-full rounded-2xl bg-gradient-hero py-6 text-base font-bold text-primary-foreground shadow-warm"
      >
        <RefreshCw className="mr-2 h-5 w-5" /> {t.ask[lang]}
      </Button>
    </div>
  );
}