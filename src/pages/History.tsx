import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Bookmark, Clock, Loader2, Trash2, FileText, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ResultView, type Decision } from "@/components/kyr/ResultView";
import { t, type Lang } from "@/lib/i18n";

type Row = {
  id: string;
  situation: string;
  language: Lang;
  category: string | null;
  urgency: string | null;
  decision: Decision;
  created_at: string;
};

export default function History() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lang] = useState<Lang>(() => (localStorage.getItem("kyr-lang") as Lang) || "en");
  const [tab, setTab] = useState<"history" | "bookmarks">("history");
  const [history, setHistory] = useState<Row[]>([]);
  const [bookmarks, setBookmarks] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Row | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [h, b] = await Promise.all([
        supabase.from("search_history").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("bookmarks").select("*").order("created_at", { ascending: false }).limit(100),
      ]);
      if (h.data) setHistory(h.data as any);
      if (b.data) setBookmarks(b.data as any);
      setLoading(false);
    })();
  }, [user]);

  if (authLoading) {
    return <div className="grid min-h-screen place-items-center bg-gradient-cream"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!user) return <Navigate to="/" replace />;

  const removeRow = async (table: "search_history" | "bookmarks", id: string) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) { toast({ title: t.errorTitle[lang], description: error.message, variant: "destructive" }); return; }
    if (table === "search_history") setHistory((r) => r.filter((x) => x.id !== id));
    else setBookmarks((r) => r.filter((x) => x.id !== id));
  };

  const renderList = (rows: Row[], table: "search_history" | "bookmarks") => {
    if (loading) return <div className="grid place-items-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
    if (rows.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {table === "search_history" ? t.noHistory[lang] : t.noBookmarks[lang]}
        </div>
      );
    }
    return (
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="mb-2 flex items-center gap-2">
              {r.category && <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">{r.category}</span>}
              {r.urgency && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase text-muted-foreground">{r.urgency}</span>}
              <span className="ml-auto text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
            </div>
            <p className="line-clamp-2 text-sm">{r.situation}</p>
            <p className="mt-1 line-clamp-2 text-sm font-semibold text-section-decision">{r.decision?.decision}</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="default" className="rounded-full" onClick={() => setOpen(r)}>
                <FileText className="mr-1 h-4 w-4" /> {t.open[lang]}
              </Button>
              <Button size="sm" variant="ghost" className="rounded-full text-destructive hover:text-destructive" onClick={() => removeRow(table, r.id)}>
                <Trash2 className="mr-1 h-4 w-4" /> {t.delete[lang]}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  if (open) {
    return (
      <main className="min-h-screen bg-gradient-cream pb-12">
        <div className="mx-auto max-w-2xl space-y-5 px-4 pt-5">
          <ResultView decision={open.decision} lang={open.language || lang} onBack={() => setOpen(null)} onAskAnother={() => navigate("/app")} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-cream pb-12">
      <header className="sticky top-0 z-20 border-b border-border/40 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/app" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-hero shadow-warm">
              <Scale className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="font-display text-base font-bold sm:text-lg">{t.appName[lang]}</h1>
          </Link>
          <Button asChild variant="ghost" size="sm" className="rounded-full">
            <Link to="/app"><ArrowLeft className="mr-1 h-4 w-4" />{t.home[lang]}</Link>
          </Button>
        </div>
      </header>
      <div className="mx-auto max-w-2xl space-y-5 px-4 pt-5">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2 rounded-2xl">
            <TabsTrigger value="history" className="rounded-xl"><Clock className="mr-2 h-4 w-4" />{t.history[lang]}</TabsTrigger>
            <TabsTrigger value="bookmarks" className="rounded-xl"><Bookmark className="mr-2 h-4 w-4" />{t.bookmarks[lang]}</TabsTrigger>
          </TabsList>
          <TabsContent value="history" className="mt-4">{renderList(history, "search_history")}</TabsContent>
          <TabsContent value="bookmarks" className="mt-4">{renderList(bookmarks, "bookmarks")}</TabsContent>
        </Tabs>
      </div>
    </main>
  );
}