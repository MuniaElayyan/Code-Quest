import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Code Quest — Neon Web Dev Quiz Game" },
      {
        name: "description",
        content:
          "Play Code Quest: a fast 10-question quiz on HTML, CSS, JavaScript, Tailwind and Git, with scores, levels and a leaderboard.",
      },
      { property: "og:title", content: "Code Quest — Neon Web Dev Quiz Game" },
      {
        property: "og:description",
        content:
          "Answer 10 timed questions on HTML, CSS, JavaScript, Tailwind and Git. Earn points, unlock levels, top the leaderboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

type Question = {
  question: string;
  choices: string[];
  answer: number;
};
type Score = {
  name: string;
  score: number;
  correctAnswers: number;
  time: number;
  level: string;
  icon: string;
};

const questions: Question[] = [
  { question: "Which HTML tag creates a hyperlink?", choices: ["<link>", "<a>", "<href>", "<url>"], answer: 2 },
  { question: "Which HTML tag is used to display an image?", choices: ["<img>", "<picture>", "<image>", "<src>"], answer: 1 },
  { question: "Which CSS property changes text color?", choices: ["font-color", "text-style", "color", "text-color"], answer: 3 },
  { question: "Which CSS property makes a Flexbox container?", choices: ["display:flex", "position:flex", "flex-container", "display:block"], answer: 1 },
  { question: "Which JavaScript keyword creates a block-scoped variable?", choices: ["var", "const", "let", "value"], answer: 3 },
  { question: "What does a JavaScript function do?", choices: ["Stores images", "Groups reusable code", "Creates CSS", "Creates HTML"], answer: 2 },
  { question: "Which Bootstrap class creates a primary button?", choices: ["button-primary", "primary-btn", "btn-primary", "btn-blue"], answer: 3 },
  { question: "Tailwind CSS is based on...", choices: ["Utility Classes", "Database Queries", "Java Packages", "PHP"], answer: 1 },
  { question: "Which Git command sends commits to GitHub?", choices: ["git upload", "git push", "git commit", "git clone"], answer: 2 },
  { question: "Which Git command copies a repository?", choices: ["git clone", "git fork", "git copy", "git pull"], answer: 1 },
];

const cn = (...x: (string | false | undefined)[]) => x.filter(Boolean).join(" ");
const readScores = (): Score[] => {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("highScores") || "[]");
};

function levelFor(correct: number) {
  if (correct === 10) return { name: "👑 Code Master", icon: "👑" };
  if (correct >= 8) return { name: "💎 Front-End Pro", icon: "💎" };
  if (correct >= 6) return { name: "⭐ Code Explorer", icon: "⭐" };
  if (correct >= 4) return { name: "🌸 Rising Developer", icon: "🌸" };
  return { name: "🌱 Beginner", icon: "🌱" };
}
function sortScores(scores: Score[]) {
  return [...scores]
    .sort((a, b) => b.correctAnswers - a.correctAnswers || a.time - b.time)
    .slice(0, 10);
}

function Aurora() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-24 -top-28 h-[420px] w-[420px] animate-float-slow rounded-full bg-magenta opacity-30 blur-[110px]" />
      <div className="absolute -bottom-32 -right-24 h-[460px] w-[460px] animate-float-slow rounded-full bg-cyan opacity-25 blur-[120px] [animation-delay:-3s]" />
      <div className="absolute left-1/2 top-1/3 h-[320px] w-[320px] -translate-x-1/2 animate-float-slow rounded-full bg-gold opacity-20 blur-[120px] [animation-delay:-6s]" />
    </div>
  );
}

function Home({ go }: { go: (p: Page) => void }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-5">
      <Aurora />
      <div className="w-full max-w-[470px] animate-pop rounded-4xl surface-card p-10 text-center sm:p-12">
        <div className="relative mx-auto mb-8 flex h-[120px] w-[120px] items-center justify-center rounded-full gradient-hero glow animate-glow-pulse">
          <i className="fa-solid fa-graduation-cap text-[52px] text-primary-foreground" />
        </div>
        <p className="mb-3 text-xs font-semibold tracking-[0.4em] text-muted-foreground uppercase">
          Level up your code
        </p>
        <h1 className="mb-3 text-[54px] leading-none font-extrabold text-gradient max-sm:text-[40px]">
          Code Quest
        </h1>
        <p className="mb-10 text-lg text-muted-foreground">Learn • Play • Win ✨</p>
        <button
          onClick={() => go("game")}
          className="mb-4 flex w-full items-center justify-center gap-3 rounded-2xl gradient-gold p-[18px] text-xl font-bold text-gold-foreground transition duration-300 hover:-translate-y-1 hover:glow-gold"
        >
          <i className="fa-solid fa-play" />
          Start Quiz
        </button>
        <button
          onClick={() => go("scores")}
          className="flex w-full items-center justify-center gap-3 rounded-2xl gradient-cool p-[18px] text-xl font-bold text-cyan-foreground transition duration-300 hover:-translate-y-1 hover:glow-cyan"
        >
          <i className="fa-solid fa-trophy" />
          Leaderboard
        </button>
        <div className="mt-9 flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <i className="fa-solid fa-list-ol text-accent" />10 questions
          </span>
          <span className="flex items-center gap-2">
            <i className="fa-solid fa-bolt text-gold" />30s each
          </span>
        </div>
      </div>
    </div>
  );
}

function Game({
  finish,
}: {
  finish: (result: { score: number; correct: number; time: number; level: string; icon: string }) => void;
}) {
  const [available] = useState<Question[]>(() => [...questions].sort(() => Math.random() - 0.5));
  const [index, setIndex] = useState(0),
    [score, setScore] = useState(0),
    [correct, setCorrect] = useState(0),
    [time, setTime] = useState(0),
    [timeLeft, setTimeLeft] = useState(30),
    [accepting, setAccepting] = useState(true),
    [selected, setSelected] = useState<number | null>(null);
  const q = available[index]!;
  useEffect(() => {
    if (!accepting) return;
    const t = setInterval(() => {
      setTime((v) => v + 1);
      setTimeLeft((v) => v - 1);
    }, 1000);
    return () => clearInterval(t);
  }, [accepting, index]);
  useEffect(() => {
    if (timeLeft <= 0 && accepting) choose(-1);
  }, [timeLeft]);
  const choose = (n: number) => {
    if (!accepting) return;
    setAccepting(false);
    setSelected(n);
    const isCorrect = n === q.answer;
    const nextCorrect = correct + (isCorrect ? 1 : 0),
      nextScore = score + (isCorrect ? 100 : 0);
    setCorrect(nextCorrect);
    setScore(nextScore);
    setTimeout(() => {
      if (index + 1 >= 10) {
        const l = levelFor(nextCorrect);
        finish({ score: nextScore, correct: nextCorrect, time, level: l.name, icon: l.icon });
      } else {
        setIndex((v) => v + 1);
        setTimeLeft(30);
        setSelected(null);
        setAccepting(true);
      }
    }, 1000);
  };
  if (!q) return null;
  const stats: [string, string, string][] = [
    ["fa-circle-question", `${index + 1} / 10`, "text-accent"],
    ["fa-clock", String(timeLeft), timeLeft <= 10 ? "text-destructive" : "text-gold"],
    ["fa-star", String(score), "text-magenta"],
  ];
  return (
    <div className="relative flex min-h-screen items-start justify-center p-5 md:p-8">
      <Aurora />
      <div className="w-full max-w-[900px] animate-fade-up rounded-4xl surface-card p-6 md:p-10">
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {stats.map(([icon, text, tone]) => (
            <div key={text + icon} className="rounded-3xl surface-inset p-4 text-center">
              <i className={cn("fa-solid mb-2 text-[26px]", icon, tone)} />
              <p className="text-[22px] font-bold text-foreground">{text}</p>
            </div>
          ))}
        </div>
        <div className="mb-8 h-3.5 w-full overflow-hidden rounded-full surface-inset">
          <div
            className="h-full rounded-full gradient-hero transition-all duration-500"
            style={{ width: `${((index + 1) / 10) * 100}%` }}
          />
        </div>
        <div className="mb-8 rounded-3xl surface-inset p-6 md:p-8">
          <h2 className="text-center text-2xl leading-relaxed font-semibold text-foreground md:text-[30px]">
            {q.question}
          </h2>
        </div>
        <div className="grid gap-4">
          {q.choices.map((choice, i) => {
            const n = i + 1;
            return (
              <button
                key={choice}
                disabled={!accepting}
                onClick={() => choose(n)}
                className={cn(
                  "flex w-full items-center overflow-hidden rounded-3xl border-2 border-border surface-inset text-left transition duration-300",
                  accepting && "cursor-pointer hover:-translate-y-1 hover:border-gold hover:glow-gold",
                  selected === n && n === q.answer && "border-success bg-success/25",
                  selected === n && n !== q.answer && "border-destructive bg-destructive/25",
                )}
              >
                <span className="flex w-[62px] shrink-0 items-center justify-center self-stretch gradient-cool p-5 text-2xl font-extrabold text-cyan-foreground max-sm:w-[52px] max-sm:text-xl">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="w-full p-5 text-lg text-foreground md:text-[21px]">{choice}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function End({
  result,
  go,
}: {
  result: { score: number; correct: number; time: number; level: string; icon: string };
  go: (p: Page) => void;
}) {
  const [name, setName] = useState("");
  const save = () => {
    if (!name.trim()) return;
    localStorage.setItem(
      "highScores",
      JSON.stringify(
        sortScores([
          ...readScores(),
          {
            name: name.trim(),
            score: result.score,
            correctAnswers: result.correct,
            time: result.time,
            level: result.level,
            icon: result.icon,
          },
        ]),
      ),
    );
    go("scores");
  };
  return (
    <div className="relative flex min-h-screen items-start justify-center p-5 md:p-10">
      <Aurora />
      <div className="w-full max-w-[470px] animate-pop rounded-4xl surface-card p-8 text-center md:p-11">
        <div className="mx-auto mb-5 flex h-[110px] w-[110px] items-center justify-center rounded-full gradient-hero text-[44px] glow animate-glow-pulse">
          {result.icon}
        </div>
        <h1 className="mb-2 text-[34px] font-extrabold text-gradient">Congratulations!</h1>
        <p className="text-muted-foreground">Your Quiz Has Finished</p>
        <h2 className="my-6 text-[64px] leading-none font-extrabold text-gradient max-sm:text-5xl">
          {result.score}
        </h2>
        <div className="my-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl surface-inset p-4">
            <h3 className="mb-1 text-sm tracking-wide text-muted-foreground uppercase">Correct</h3>
            <p className="text-[22px] font-bold text-accent">{result.correct} / 10</p>
          </div>
          <div className="rounded-3xl surface-inset p-4">
            <h3 className="mb-1 text-sm tracking-wide text-muted-foreground uppercase">Time</h3>
            <p className="text-[22px] font-bold text-gold">{result.time} s</p>
          </div>
        </div>
        <div className="my-6">
          <span className="inline-block rounded-full gradient-gold px-7 py-3 text-lg font-bold text-gold-foreground glow-gold">
            {result.level}
          </span>
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          placeholder="Enter Your Name"
          className="mb-5 w-full rounded-2xl border-2 border-border bg-input p-4 text-lg text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary"
        />
        <button
          onClick={save}
          disabled={!name.trim()}
          className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-2xl gradient-gold p-4 text-lg font-bold text-gold-foreground transition duration-300 hover:-translate-y-1 hover:glow-gold disabled:cursor-not-allowed disabled:opacity-50"
        >
          <i className="fa-solid fa-floppy-disk" />
          Save Score
        </button>
        <button
          onClick={() => go("home")}
          className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-border surface-inset p-4 text-lg font-semibold text-foreground transition duration-300 hover:-translate-y-1 hover:border-accent"
        >
          <i className="fa-solid fa-house" />
          Back Home
        </button>
      </div>
    </div>
  );
}

function Scores({ go }: { go: (p: Page) => void }) {
  const scores = useMemo(() => sortScores(readScores()), []);
  const medal = (i: number) => (i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`);
  const badge = (s: number) =>
    s >= 900 ? "👑 Master" : s >= 700 ? "💎 Pro" : s >= 400 ? "⭐ Explorer" : "🌱 Beginner";
  return (
    <div className="relative flex min-h-screen items-start justify-center p-5 md:p-8">
      <Aurora />
      <div className="w-full max-w-[680px] animate-fade-up rounded-4xl surface-card p-6 md:p-10">
        <div className="mb-8 text-center">
          <i className="fa-solid fa-trophy text-[58px] text-gold" />
          <h1 className="mt-3 text-[42px] leading-none font-extrabold text-gradient">Code Quest</h1>
          <p className="mt-2 text-lg tracking-[0.3em] text-muted-foreground uppercase">Leaderboard</p>
        </div>
        {scores.length === 0 ? (
          <div className="rounded-3xl surface-inset p-6 text-center">
            <div className="text-[22px] font-bold text-foreground">🌸 No Scores Yet</div>
            <div className="mt-2 text-muted-foreground">Be the first Code Quest Champion!</div>
          </div>
        ) : (
          scores.map((p, i) => (
            <div
              key={`${p.name}-${i}`}
              className={cn(
                "mb-4 flex items-center justify-between gap-4 rounded-3xl border-2 border-border surface-inset p-5 transition duration-300 hover:-translate-y-1 hover:glow",
                i === 0 && "border-gold bg-gold/15 glow-gold",
                i === 1 && "border-accent/60",
                i === 2 && "border-magenta/60",
              )}
            >
              <div className="w-[52px] text-[32px]">{medal(i)}</div>
              <div className="flex-1">
                <div className="text-[21px] font-bold text-foreground">
                  {p.icon || "🌸"} {p.name}
                </div>
                <div className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
                  ✅ Correct Answers: <b className="text-foreground">{p.correctAnswers}/10</b>
                  <br />⏱ Time: <b className="text-foreground">{p.time}s</b>
                  <br />⭐ Level: <b className="text-foreground">{p.level || badge(p.score)}</b>
                </div>
              </div>
              <div className="rounded-full gradient-gold px-4 py-2 font-bold whitespace-nowrap text-gold-foreground">
                {p.score} pts
              </div>
            </div>
          ))
        )}
        <button
          onClick={() => go("home")}
          className="mt-8 flex w-full items-center justify-center gap-2.5 rounded-2xl gradient-cool p-4 text-xl font-bold text-cyan-foreground transition duration-300 hover:-translate-y-1 hover:glow-cyan"
        >
          <i className="fa-solid fa-house" />
          Back Home
        </button>
      </div>
    </div>
  );
}

type Page = "home" | "game" | "end" | "scores";

function App() {
  const [page, setPage] = useState<Page>("home");
  const [result, setResult] = useState<{
    score: number;
    correct: number;
    time: number;
    level: string;
    icon: string;
  } | null>(null);
  const go = (p: Page) => setPage(p);
  return page === "home" ? (
    <Home go={go} />
  ) : page === "game" ? (
    <Game
      finish={(r) => {
        setResult(r);
        setPage("end");
      }}
    />
  ) : page === "end" && result ? (
    <End result={result} go={go} />
  ) : (
    <Scores go={go} />
  );
}
