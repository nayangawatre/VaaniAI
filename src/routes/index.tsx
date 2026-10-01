import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Download, Loader2, Mic, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const LANGUAGES = [
  { code: "hi", label: "हिन्दी / Hindi" },
  { code: "en", label: "English" },
  { code: "mr", label: "मराठी / Marathi" },
] as const;

const PRESETS = [
  { value: "classic", label: "Classic lead", detail: "Deep & assured" },
  { value: "romantic", label: "Romantic lead", detail: "Soft & charming" },
  { value: "action", label: "Action lead", detail: "Bold & energetic" },
  { value: "storyteller", label: "Epic storyteller", detail: "Rich & theatrical" },
] as const;

const EMOTIONS = [
  { value: "natural", label: "Natural" },
  { value: "joyful", label: "Joyful" },
  { value: "heartfelt", label: "Heartfelt" },
  { value: "dramatic", label: "Dramatic" },
  { value: "suspenseful", label: "Suspenseful" },
] as const;

type HistoryItem = {
  id: string;
  text: string;
  language: string;
  gender: string;
  preset: string;
  emotion: string;
  url: string;
  createdAt: string;
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VaaniAI — Hindi AI Text to Speech" },
      {
        name: "description",
        content:
          "Type Hindi, English or Marathi text and generate realistic AI speech with a male or female voice. Listen instantly and download the MP3.",
      },
      { property: "og:title", content: "VaaniAI — Hindi AI Text to Speech" },
      {
        property: "og:description",
        content: "Realistic Hindi AI voice generation with instant playback and MP3 download.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [text, setText] = useState(
    "नमस्ते! यह एक आर्टिफ़िशियल इंटेलिजेंस से बनी हिंदी आवाज़ है।",
  );
  const [language, setLanguage] = useState<string>("hi");
  const [gender, setGender] = useState<string>("male");
  const [preset, setPreset] = useState<(typeof PRESETS)[number]["value"]>("classic");
  const [emotion, setEmotion] = useState<(typeof EMOTIONS)[number]["value"]>("natural");
  const [speed, setSpeed] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const urlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const generate = async () => {
    if (!text.trim()) {
      setError("Please enter some text first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), language, gender, preset, emotion, speed }),
      });
      if (!res.ok) {
        let message = "Voice generation failed. Please try again.";
        try {
          const data = (await res.json()) as { error?: string };
          if (data?.error) message = data.error;
        } catch {
          /* keep default */
        }
        if (res.status === 402) message = "AI credits are used up. Please top up to keep generating.";
        if (res.status === 429) message = "Too many requests right now — try again in a moment.";
        throw new Error(message);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      urlsRef.current.push(url);
      setAudioUrl(url);
      setHistory((prev) => [
        {
          id: crypto.randomUUID(),
          text: text.trim(),
          language,
          gender,
          preset,
          emotion,
          url,
          createdAt: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
      requestAnimationFrame(() => void audioRef.current?.play().catch(() => undefined));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12 md:py-16">
      <header className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          <Mic className="size-3.5 text-primary" /> AI Voice Studio
        </span>
        <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
          VaaniAI — बोलती हुई <span className="text-primary">AI आवाज़</span>
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
          Write in Hindi, English or Marathi. Shape the voice and emotion, then listen or download your performance.
        </p>
      </header>

      <section className="panel mt-10 p-5 md:p-8">
        <label htmlFor="text" className="text-sm font-medium text-foreground">
          Your text
        </label>
        <textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          maxLength={4000}
          placeholder="अपना टेक्स्ट यहाँ लिखें..."
          className="mt-2 w-full resize-y rounded-xl border border-input bg-background/60 p-4 text-base leading-relaxed text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/40"
        />
        <div className="mt-1 text-right text-xs text-muted-foreground">{text.length} / 4000</div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label="Language">
            <Select value={language} onChange={setLanguage}>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Voice">
            <div className="flex gap-2">
              {(["male", "female"] as const).map((g) => (
                <Button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  variant={gender === g ? "default" : "outline"}
                  aria-pressed={gender === g}
                  className={`h-11 flex-1 capitalize ${
                    gender === g
                      ? "shadow-[var(--shadow-glow)]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {g}
                </Button>
              ))}
            </div>
          </Field>

          <Field label={`Speed — ${speed.toFixed(2)}x`}>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.05}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="mt-3 w-full accent-[var(--primary)]"
            />
          </Field>
        </div>

        <div className="mt-7">
          <h2 className="text-sm font-medium text-foreground">Cinematic voice</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4" role="group" aria-label="Cinematic voice">
            {PRESETS.map((item) => (
              <Button
                key={item.value}
                type="button"
                variant={preset === item.value ? "default" : "outline"}
                aria-pressed={preset === item.value}
                onClick={() => setPreset(item.value)}
                className="h-auto min-h-16 flex-col items-start gap-0.5 whitespace-normal px-3 py-2.5 text-left"
              >
                <span className="font-semibold">{item.label}</span>
                <span className={preset === item.value ? "text-primary-foreground/80 text-xs" : "text-muted-foreground text-xs"}>{item.detail}</span>
              </Button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Original cinematic voices, not impressions of real actors.</p>
        </div>

        <Field label="Emotion">
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Emotion">
            {EMOTIONS.map((item) => (
              <Button
                key={item.value}
                type="button"
                variant={emotion === item.value ? "default" : "outline"}
                aria-pressed={emotion === item.value}
                onClick={() => setEmotion(item.value)}
                className="min-h-10"
              >
                {item.label}
              </Button>
            ))}
          </div>
        </Field>

        <Button
          type="button"
          onClick={generate}
          disabled={loading}
          className="mt-8 h-12 w-full px-6 text-base font-semibold shadow-[var(--shadow-glow)] md:w-auto"
        >
          {loading ? <Loader2 className="size-5 animate-spin" /> : <Play className="size-5" />}
          {loading ? "Generating voice…" : "Generate voice"}
        </Button>

        {error && (
          <p className="mt-4 rounded-xl border border-destructive/40 bg-destructive/15 px-4 py-3 text-sm text-foreground">
            {error}
          </p>
        )}

        {audioUrl && (
          <div className="mt-6 rounded-xl border border-border bg-secondary/40 p-4">
            <audio ref={audioRef} src={audioUrl} controls className="w-full" />
            <a
              href={audioUrl}
              download="vaaniai-speech.mp3"
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-accent/60 px-4 py-2 text-sm font-medium text-accent transition hover:bg-accent/10"
            >
              <Download className="size-4" /> Download MP3
            </a>
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">History</h2>
          {history.length > 0 && (
            <Button
              type="button"
              onClick={() => setHistory([])}
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
            >
              <Trash2 className="size-4" /> Clear
            </Button>
          )}
        </div>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Generated clips from this session will appear here.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {history.map((item) => (
              <li key={item.id} className="panel p-4">
                <p className="line-clamp-2 text-sm text-foreground">{item.text}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                  {item.language} · {item.gender} · {item.preset} · {item.emotion} · {item.createdAt}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <audio src={item.url} controls className="h-9 min-w-56 flex-1" />
                  <a
                    href={item.url}
                    download="vaaniai-speech.mp3"
                    className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                  >
                    <Download className="size-4" /> MP3
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-input bg-background/60 px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/40"
    >
      {children}
    </select>
  );
}
