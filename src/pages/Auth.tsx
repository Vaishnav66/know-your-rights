import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Scale, Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { LanguageSwitcher } from "@/components/kyr/LanguageSwitcher";
import { t, type Lang } from "@/lib/i18n";

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("kyr-lang") as Lang) || "en");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    localStorage.setItem("kyr-lang", lang);
  }, [lang]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-cream">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (user) return <Navigate to="/app" replace />;

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/app` },
        });
        if (error) throw error;
        toast({ title: "Welcome!", description: "Account created." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate("/app");
    } catch (err: any) {
      toast({ title: t.errorTitle[lang], description: err?.message ?? "Try again", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/app`,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate("/app");
    } catch (err: any) {
      toast({ title: t.errorTitle[lang], description: err?.message ?? "Try again", variant: "destructive" });
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-cream">
      <header className="border-b border-border/40 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-hero shadow-warm">
              <Scale className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="font-display text-base font-bold sm:text-lg">{t.appName[lang]}</h1>
          </div>
          <LanguageSwitcher value={lang} onChange={setLang} />
        </div>
      </header>

      <div className="mx-auto grid max-w-2xl gap-5 px-4 pt-8">
        <section className="overflow-hidden rounded-3xl bg-gradient-hero p-6 text-primary-foreground shadow-warm">
          <h2 className="font-display text-2xl font-bold leading-tight sm:text-3xl">{t.appName[lang]}</h2>
          <p className="mt-2 text-sm text-primary-foreground/90 sm:text-base">{t.authTagline[lang]}</p>
        </section>

        <section className="rounded-3xl border border-border/40 bg-card p-6 shadow-soft">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={busy}
            onClick={handleGoogle}
            className="press-btn w-full rounded-2xl py-6 text-base font-semibold"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.45.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            {t.continueGoogle[lang]}
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t.email[lang]}</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 py-6" autoComplete="email" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.password[lang]}</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 py-6" autoComplete={mode === "signup" ? "new-password" : "current-password"} />
              </div>
            </div>
            <Button type="submit" size="lg" disabled={busy} className="press-btn w-full rounded-2xl bg-gradient-hero py-6 text-base font-bold text-primary-foreground shadow-warm">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {mode === "signup" ? t.signUp[lang] : t.signIn[lang]}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {mode === "signin" ? t.noAccount[lang] : t.haveAccount[lang]}
          </button>
        </section>

        <p className="px-2 pb-8 text-center text-[11px] text-muted-foreground">
          ⚖️ AI guidance — not a substitute for a qualified lawyer.
        </p>
      </div>
    </main>
  );
}