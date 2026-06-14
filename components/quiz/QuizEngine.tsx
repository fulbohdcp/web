"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildFlow,
  SCALE_DESC,
  SECTION_META,
  type Answers,
  type Question,
  type Section,
} from "@/lib/questions";

const STORAGE_KEY = "hdcp-onboarding";

export function QuizEngine({ onComplete }: { onComplete: (answers: Answers) => void }) {
  const [answers, setAnswers] = useState<Answers>({});
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [hydrated, setHydrated] = useState(false);

  // restore in-progress onboarding
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved?.answers) setAnswers(saved.answers);
        if (typeof saved?.index === "number") setIndex(saved.index);
      }
    } catch {}
    setHydrated(true);
  }, []);

  const flow = useMemo(() => buildFlow(answers), [answers]);
  const safeIndex = Math.min(index, flow.length - 1);
  const q = flow[safeIndex];
  const total = flow.length;

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, index: safeIndex }));
    } catch {}
  }, [answers, safeIndex, hydrated]);

  const isAnswered = useCallback(
    (question: Question): boolean => {
      const v = answers[question.id];
      if (question.kind === "multi") return Array.isArray(v) && v.length >= (question.min ?? 1);
      if (question.kind === "text") return typeof v === "string" && v.trim().length > 0;
      return v !== undefined && v !== "";
    },
    [answers],
  );

  const goNext = useCallback(() => {
    if (!q || !isAnswered(q)) return;
    setDir(1);
    if (safeIndex >= total - 1) {
      onComplete(answers);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      return;
    }
    setIndex(safeIndex + 1);
  }, [q, isAnswered, safeIndex, total, answers, onComplete]);

  const goBack = useCallback(() => {
    if (safeIndex === 0) return;
    setDir(-1);
    setIndex(safeIndex - 1);
  }, [safeIndex]);

  const setAnswer = useCallback((id: string, value: Answers[string]) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }, []);

  // keep refs so the deferred advance sees fresh state without
  // reading/updating state inside a render-phase updater
  const answersRef = useRef<Answers>(answers);
  const indexRef = useRef(safeIndex);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  useEffect(() => {
    indexRef.current = safeIndex;
  }, [safeIndex]);

  // auto-advance for single-tap question types
  const pickAndAdvance = useCallback(
    (id: string, value: Answers[string]) => {
      setAnswers((prev) => ({ ...prev, [id]: value }));
      setDir(1);
      window.setTimeout(() => {
        const ans = answersRef.current;
        const cur = indexRef.current;
        const nextFlow = buildFlow(ans);
        if (cur >= nextFlow.length - 1) {
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch {}
          onComplete(ans);
        } else {
          setIndex(cur + 1);
        }
      }, 220);
    },
    [onComplete],
  );

  if (!hydrated || !q) {
    return <div className="min-h-[60vh]" />;
  }

  const progress = total > 1 ? safeIndex / (total - 1) : 0;

  return (
    <div className="mx-auto flex min-h-[100svh] w-full max-w-[460px] flex-col px-5">
      <ProgressHeader section={q.section} step={safeIndex + 1} total={total} progress={progress} onBack={goBack} canBack={safeIndex > 0} />

      <div className="relative flex flex-1 flex-col justify-center py-6">
        <div key={`${q.id}-${safeIndex}`} className={dir === 1 ? "anim-in-right" : "anim-in-left"}>
          <QuestionView
            q={q}
            value={answers[q.id]}
            onSet={setAnswer}
            onPick={pickAndAdvance}
            onEnter={goNext}
          />
        </div>
      </div>

      <Footer
        q={q}
        answered={isAnswered(q)}
        isLast={safeIndex >= total - 1}
        onNext={goNext}
      />

      <style>{`
        @keyframes inRight { from { opacity:0; transform: translateX(26px) } to { opacity:1; transform:none } }
        @keyframes inLeft  { from { opacity:0; transform: translateX(-26px) } to { opacity:1; transform:none } }
        .anim-in-right { animation: inRight .34s cubic-bezier(0.16,1,0.3,1) both }
        .anim-in-left  { animation: inLeft  .34s cubic-bezier(0.16,1,0.3,1) both }
      `}</style>
    </div>
  );
}

// ───────────────────────────────────────────────
function ProgressHeader({
  section,
  step,
  total,
  progress,
  onBack,
  canBack,
}: {
  section: Section;
  step: number;
  total: number;
  progress: number;
  onBack: () => void;
  canBack: boolean;
}) {
  const meta = SECTION_META[section];
  return (
    <div className="sticky top-0 z-20 -mx-5 bg-bg/85 px-5 pb-3 pt-5 backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={onBack}
          disabled={!canBack}
          className="font-condensed text-xs font-bold uppercase tracking-[0.18em] text-ink-muted transition enabled:hover:text-ink disabled:opacity-0"
          aria-label="Anterior"
        >
          ← Atrás
        </button>
        <span className="font-condensed text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
          {meta.icon} {meta.label}
        </span>
        <span className="font-display text-sm tracking-widest text-ink-muted">
          {step}/{total}
        </span>
      </div>
      <div className="h-[3px] w-full overflow-hidden rounded-full bg-[oklch(1_0_0_/_0.08)]">
        <div
          className="h-full rounded-full bg-green-light transition-[width] duration-500 ease-out"
          style={{ width: `${Math.max(4, progress * 100)}%` }}
        />
      </div>
    </div>
  );
}

function Footer({
  q,
  answered,
  isLast,
  onNext,
}: {
  q: Question;
  answered: boolean;
  isLast: boolean;
  onNext: () => void;
}) {
  // single-tap types (choice, rated, scale) auto-advance; only text and
  // multi-select need a primary button to confirm.
  const showButton = q.kind === "text" || q.kind === "multi";
  if (!showButton) {
    return <div className="pb-8 pt-2 text-center font-condensed text-[11px] uppercase tracking-[0.2em] text-ink-faint">Tocá una opción</div>;
  }
  return (
    <div className="pb-8 pt-2">
      <button
        onClick={onNext}
        disabled={!answered}
        className="w-full rounded-2xl px-5 py-4 font-condensed text-lg font-extrabold uppercase tracking-[0.14em] text-ink shadow-[0_10px_30px_oklch(0.52_0.13_152_/_0.45)] transition-all duration-200 ease-out enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
        style={{ background: answered ? "linear-gradient(135deg, oklch(0.55 0.13 152), oklch(0.38 0.10 152))" : "oklch(0.26 0.016 152)" }}
      >
        {isLast ? "Ver mi figurita →" : "Siguiente →"}
      </button>
    </div>
  );
}

// ───────────────────────────────────────────────
function QuestionView({
  q,
  value,
  onSet,
  onPick,
  onEnter,
}: {
  q: Question;
  value: Answers[string] | undefined;
  onSet: (id: string, v: Answers[string]) => void;
  onPick: (id: string, v: Answers[string]) => void;
  onEnter: () => void;
}) {
  return (
    <div>
      <h1 className="font-condensed text-[30px] font-extrabold leading-[1.05] text-ink">{q.title}</h1>
      {q.sublabel && <p className="mt-2 max-w-[42ch] text-sm leading-relaxed text-ink-muted">{q.sublabel}</p>}

      <div className="mt-7">
        {q.kind === "text" && (
          <TextInput id={q.id} value={(value as string) ?? ""} placeholder={q.placeholder} maxLength={q.maxLength} onSet={onSet} onEnter={onEnter} forceLower={q.id === "usuario"} />
        )}

        {q.kind === "choice" && (
          <div className="flex flex-col gap-2.5">
            {q.options.map((o) => (
              <OptionCard key={o.value} selected={value === o.value} onClick={() => onPick(q.id, o.value)}>
                <span className="font-medium">{o.label}</span>
                {o.hint && <span className="text-sm text-ink-muted">{o.hint}</span>}
              </OptionCard>
            ))}
          </div>
        )}

        {q.kind === "rated" && (
          <div className="flex flex-col gap-2.5">
            {q.options.map((o) => (
              <OptionCard key={o.value} selected={value === o.value} onClick={() => onPick(q.id, o.value)}>
                <span className="text-[15px] leading-snug">{o.label}</span>
              </OptionCard>
            ))}
          </div>
        )}

        {q.kind === "multi" && (
          <MultiSelect
            value={(value as string[]) ?? []}
            options={q.options}
            onChange={(next) => onSet(q.id, next)}
          />
        )}

        {q.kind === "scale" && <ScalePicker value={value as number | undefined} onPick={(v) => onPick(q.id, v)} />}
      </div>
    </div>
  );
}

function OptionCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left text-ink transition-all duration-150 ease-out active:scale-[0.99]"
      style={{
        borderColor: selected ? "oklch(0.64 0.15 152)" : "oklch(1 0 0 / 0.09)",
        background: selected ? "oklch(0.52 0.13 152 / 0.28)" : "oklch(0.21 0.014 152)",
        boxShadow: selected ? "0 0 0 1px oklch(0.64 0.15 152 / 0.4)" : "none",
      }}
    >
      {children}
    </button>
  );
}

function TextInput({
  id,
  value,
  placeholder,
  maxLength,
  onSet,
  onEnter,
  forceLower,
}: {
  id: string;
  value: string;
  placeholder?: string;
  maxLength?: number;
  onSet: (id: string, v: string) => void;
  onEnter: () => void;
  forceLower?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, [id]);
  return (
    <div>
      {forceLower && <span className="pointer-events-none absolute -mt-[2px] ml-4 translate-y-[14px] font-display text-2xl text-ink-faint">@</span>}
      <input
        ref={ref}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onSet(id, forceLower ? e.target.value.toLowerCase().replace(/\s/g, "") : e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onEnter();
        }}
        className="w-full rounded-2xl border border-[oklch(1_0_0_/_0.1)] bg-surface px-4 py-4 font-condensed text-2xl font-semibold text-ink outline-none transition placeholder:text-ink-faint focus:border-green-light"
        style={forceLower ? { paddingLeft: "2.2rem" } : undefined}
        autoComplete="off"
        autoCapitalize={forceLower ? "none" : "words"}
      />
    </div>
  );
}

function MultiSelect({
  value,
  options,
  onChange,
}: {
  value: string[];
  options: { value: string; label: string }[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <OptionCard key={o.value} selected={on} onClick={() => toggle(o.value)}>
            <span className="font-medium">{o.label}</span>
            <span
              className="flex h-5 w-5 items-center justify-center rounded-md border text-xs"
              style={{ borderColor: on ? "oklch(0.64 0.15 152)" : "oklch(1 0 0 / 0.2)", background: on ? "oklch(0.64 0.15 152)" : "transparent" }}
            >
              {on ? "✓" : ""}
            </span>
          </OptionCard>
        );
      })}
    </div>
  );
}

// Perceptual ramp red → amber → green so the scale means the same thing
// to everyone: low numbers read "flojo", high numbers read "élite".
const SCALE_COLORS = [
  "oklch(0.61 0.20 25)", // 1
  "oklch(0.64 0.19 40)", // 2
  "oklch(0.68 0.18 55)", // 3
  "oklch(0.75 0.17 70)", // 4
  "oklch(0.81 0.16 84)", // 5
  "oklch(0.84 0.16 96)", // 6
  "oklch(0.82 0.16 112)", // 7
  "oklch(0.76 0.17 130)", // 8
  "oklch(0.70 0.17 145)", // 9
  "oklch(0.64 0.16 152)", // 10
];

function ScalePicker({ value, onPick }: { value: number | undefined; onPick: (v: number) => void }) {
  const current = value ?? 0;
  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const on = current === n;
          const color = SCALE_COLORS[n - 1];
          return (
            <button
              key={n}
              onClick={() => onPick(n)}
              className="flex aspect-square items-center justify-center rounded-xl border font-display text-2xl transition-all duration-150 active:scale-95"
              style={{
                borderColor: on ? color : "oklch(1 0 0 / 0.10)",
                background: on ? color.replace(")", " / 0.20)") : "oklch(0.21 0.014 152)",
                color,
                boxShadow: on ? `0 0 0 1px ${color}` : "none",
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between font-condensed text-[11px] font-bold uppercase tracking-[0.14em]">
        <span style={{ color: SCALE_COLORS[0] }}>← Flojo</span>
        <span className="text-ink-faint">{current ? SCALE_DESC[current] : "Tocá tu nivel"}</span>
        <span style={{ color: SCALE_COLORS[9] }}>Élite →</span>
      </div>
    </div>
  );
}
