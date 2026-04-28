import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/i18n";

const LOCALE: Record<Lang, string> = {
  en: "en-IN",
  hi: "hi-IN",
  kn: "kn-IN",
  te: "te-IN",
};

// Ordered fallback locales per language. If no voice matches the primary,
// we walk the list. For kn/te we accept hi/en as last-resort so the user
// always hears SOMETHING rather than silence.
const LOCALE_FALLBACKS: Record<Lang, string[]> = {
  en: ["en-IN", "en-US", "en-GB", "en"],
  hi: ["hi-IN", "hi", "en-IN"],
  kn: ["kn-IN", "kn", "hi-IN", "en-IN"],
  te: ["te-IN", "te", "hi-IN", "en-IN"],
};

// ----- Speech to text -----
export function useSpeechRecognition(lang: Lang) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const r = new SR();
    r.continuous = false;
    r.interimResults = true;
    r.lang = LOCALE[lang];
    r.onresult = (e: any) => {
      let txt = "";
      for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
      setTranscript(txt);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recognitionRef.current = r;
    return () => {
      try { r.abort(); } catch {}
    };
  }, [lang]);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript("");
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch {}
  }, []);

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch {}
    setListening(false);
  }, []);

  return { listening, transcript, supported, start, stop, setTranscript };
}

// ----- Text to speech -----

// Voices load asynchronously in Chrome. Resolve once they are available.
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) return resolve([]);
    const synth = window.speechSynthesis;
    const existing = synth.getVoices();
    if (existing && existing.length) return resolve(existing);
    let done = false;
    const handler = () => {
      if (done) return;
      done = true;
      synth.removeEventListener?.("voiceschanged", handler as any);
      resolve(synth.getVoices());
    };
    synth.addEventListener?.("voiceschanged", handler as any);
    // Safety: some browsers never fire the event; resolve after a short wait.
    setTimeout(() => {
      if (done) return;
      done = true;
      resolve(synth.getVoices());
    }, 1200);
  });
}

function pickVoice(
  voices: SpeechSynthesisVoice[],
  lang: Lang,
): { voice: SpeechSynthesisVoice | null; usedLocale: string } {
  const candidates = LOCALE_FALLBACKS[lang];
  for (const loc of candidates) {
    const exact = voices.find((v) => v.lang?.toLowerCase() === loc.toLowerCase());
    if (exact) return { voice: exact, usedLocale: loc };
    const prefix = loc.split("-")[0].toLowerCase();
    const partial = voices.find((v) => v.lang?.toLowerCase().startsWith(prefix));
    if (partial) return { voice: partial, usedLocale: partial.lang };
  }
  return { voice: null, usedLocale: LOCALE[lang] };
}

// Split long text into chunks at sentence boundaries; many TTS engines
// (notably Chrome) cut off utterances longer than ~200 chars.
function chunkText(text: string, max = 180): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return [clean];
  const parts: string[] = [];
  // Split on sentence-ish punctuation but keep delimiters when possible.
  const sentences = clean.split(/(?<=[.!?।])\s+/);
  let buf = "";
  for (const s of sentences) {
    if ((buf + " " + s).trim().length > max && buf) {
      parts.push(buf.trim());
      buf = s;
    } else {
      buf = buf ? `${buf} ${s}` : s;
    }
  }
  if (buf.trim()) parts.push(buf.trim());
  // Hard-wrap any still-too-long chunk.
  const out: string[] = [];
  for (const p of parts) {
    if (p.length <= max) out.push(p);
    else for (let i = 0; i < p.length; i += max) out.push(p.slice(i, i + max));
  }
  return out;
}

export function useTextToSpeech() {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const queueRef = useRef<{ cancelled: boolean }>({ cancelled: false });
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Warm up voice list on mount.
  useEffect(() => {
    let mounted = true;
    loadVoices().then((v) => {
      if (mounted) voicesRef.current = v;
    });
    return () => {
      mounted = false;
      try { window.speechSynthesis?.cancel(); } catch {}
    };
  }, []);

  const stop = useCallback(() => {
    queueRef.current.cancelled = true;
    try { window.speechSynthesis?.cancel(); } catch {}
    setSpeakingId(null);
  }, []);

  const speak = useCallback(
    async (id: string, text: string, lang: Lang) => {
      if (!("speechSynthesis" in window) || !text?.trim()) return;
      // Cancel any previous run.
      try { window.speechSynthesis.cancel(); } catch {}
      const ticket = { cancelled: false };
      queueRef.current = ticket;

      // Make sure voices are loaded (especially first click on Chrome).
      let voices = voicesRef.current;
      if (!voices.length) {
        voices = await loadVoices();
        voicesRef.current = voices;
      }

      const { voice, usedLocale } = pickVoice(voices, lang);
      const chunks = chunkText(text);
      setSpeakingId(id);

      for (let i = 0; i < chunks.length; i++) {
        if (ticket.cancelled) return;
        await new Promise<void>((resolve) => {
          const u = new SpeechSynthesisUtterance(chunks[i]);
          // Always set lang — browsers without a matching voice often still
          // try the OS speech engine which may know the locale.
          u.lang = usedLocale || LOCALE[lang];
          if (voice) u.voice = voice;
          u.rate = 0.92;
          u.pitch = 1;
          u.volume = 1;
          u.onend = () => resolve();
          u.onerror = () => resolve();
          try {
            window.speechSynthesis.speak(u);
          } catch {
            resolve();
          }
        });
      }
      if (!ticket.cancelled) setSpeakingId(null);
    },
    [],
  );

  return { speak, stop, speakingId };
}