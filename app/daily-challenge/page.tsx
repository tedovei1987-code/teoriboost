"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getActiveSubscription } from "../lib/subscription";
import { checkAndUnlockAchievements } from "../lib/achievements";

type Question = {
  id: string;
  question: string;
  answers: string[];
  correct_answer: string;
  category: string | null;
  difficulty: string | null;
  image_url: string | null;
  theory_type: string | null;
};

type AnswerRecord = {
  question: Question;
  selectedAnswer: string;
  isCorrect: boolean;
};

type WeakCategory = {
  category: string;
  count: number;
};

type NewAchievement = {
  id: string;
  key: string;
  title?: string;
  description?: string;
  icon?: string;
  xp_reward: number;
  requirement_type: string;
  requirement_value: number;
};

const QUESTION_LIMIT = 5;
const XP_PER_CORRECT = 20;
const COMPLETION_BONUS = 25;

const theoryLabels: Record<string, string> = {
  B: "Klasse B",
  BE: "Klasse BE",
  AM: "AM",
  AM147: "AM147",
  A1: "A1",
  A2: "A2",
  A: "A",
  T: "Traktor T",
  S: "Snøscooter S",
  C: "Lastebil C",
  C1: "Lastebil C1",
  C1E: "Lastebil C1E",
  CE: "Lastebil CE",
  D: "Buss D",
  D1: "Buss D1",
  D1E: "Buss D1E",
  YSK_GOODS: "YSK Gods",
  YSK_PASSENGER: "YSK Persontransport",
  ADR_BASIC: "ADR Basic",
  ADR_TANK: "ADR Tank",
  ADR_EXPLOSIVE: "ADR Explosive",
  ADR_RADIOACTIVE: "ADR Radioactive",
};

export default function DailyChallengePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newAchievements, setNewAchievements] = useState<NewAchievement[]>([]);
  const [countdown, setCountdown] = useState("");
  const [theoryType, setTheoryType] = useState<string | null>(null);

  useEffect(() => {
    loadDailyChallenge();
  }, []);

  useEffect(() => {
    updateCountdown();

    const interval = setInterval(() => {
      updateCountdown();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  function updateCountdown() {
    const now = new Date();

    const nextMidnight = new Date();
    nextMidnight.setHours(24, 0, 0, 0);

    const diff = nextMidnight.getTime() - now.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setCountdown(
      `${hours.toString().padStart(2, "0")}t ${minutes
        .toString()
        .padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`
    );
  }

  function todayKey() {
    return new Date().toISOString().split("T")[0];
  }

  function shuffleArray<T>(array: T[]) {
    return [...array].sort(() => Math.random() - 0.5);
  }

  function getProgressPercent() {
    if (questions.length === 0) return 0;

    return Math.round(((current + 1) / questions.length) * 100);
  }

  function getWeakCategories(records: AnswerRecord[]) {
    const counts: Record<string, number> = {};

    records.forEach((record) => {
      if (record.isCorrect) return;

      const category = record.question.category || "Ukjent kategori";

      counts[category] = (counts[category] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([category, count]) => ({
        category,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }

  function getGrade(percent: number) {
    if (percent >= 100) return "S";
    if (percent >= 90) return "A";
    if (percent >= 75) return "B";
    if (percent >= 60) return "C";
    return "D";
  }

  function getResultMessage(percent: number) {
    if (percent >= 100) {
      return "Perfekt challenge. Veldig sterkt.";
    }

    if (percent >= 80) {
      return "Bra jobbet. Stabil progresjon.";
    }

    if (percent >= 60) {
      return "Greit resultat, men det finnes tydelige svakheter.";
    }

    return "Du bør fokusere mer på svake områder.";
  }

  async function loadDailyChallenge() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("theory_type")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.log("DAILY PROFILE ERROR:", profileError);
    }

    if (!profile?.theory_type) {
      window.location.href = "/choose-theory";
      return;
    }

    setTheoryType(profile.theory_type);

    const subscription = await getActiveSubscription(user.id);

    if (!subscription) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    setHasAccess(true);

    const today = todayKey();

    const { data: existingResult } = await supabase
      .from("daily_challenge_results")
      .select("id")
      .eq("user_id", user.id)
      .eq("challenge_date", today)
      .eq("theory_type", profile.theory_type)
      .maybeSingle();

    if (existingResult) {
      setAlreadyCompleted(true);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("questions")
      .select(
        "id, question, answers, correct_answer, category, difficulty, image_url, theory_type"
      )
      .eq("theory_type", profile.theory_type)
      .eq("is_active", true)
      .eq("exam_relevant", true);

    if (error) {
      console.log("DAILY CHALLENGE QUESTION ERROR:", error);
      setQuestions([]);
    } else {
      setQuestions(
        shuffleArray((data ?? []) as Question[]).slice(
          0,
          QUESTION_LIMIT
        )
      );
    }

    setLoading(false);
  }

  async function saveWrongAnswer(
    question: Question,
    selectedAnswer: string
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from("wrong_answers").insert({
      user_id: user.id,
      question_id: question.id,
      selected_answer: selectedAnswer,
      correct_answer: question.correct_answer,
      category: question.category,
      theory_type: theoryType,
    });
  }

  async function saveChallengeResult(
    finalAnswers: AnswerRecord[]
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const finalScore = finalAnswers.filter(
      (item) => item.isCorrect
    ).length;

    const finalXp =
      finalScore * XP_PER_CORRECT + COMPLETION_BONUS;

    const { data: profile } = await supabase
      .from("profiles")
      .select("xp, streak")
      .eq("id", user.id)
      .single();

    const currentXp = profile?.xp ?? 0;
    const currentStreak = profile?.streak ?? 0;

    await supabase
      .from("profiles")
      .update({
        xp: currentXp + finalXp,
        streak: currentStreak + 1,
      })
      .eq("id", user.id);

    await supabase.from("daily_challenge_results").insert({
      user_id: user.id,
      score: finalScore,
      xp_earned: finalXp,
      challenge_date: todayKey(),
      theory_type: theoryType,
    });

    await supabase.from("test_results").insert({
      user_id: user.id,
      score: finalScore,
      total_questions: finalAnswers.length,
      xp_earned: finalXp,
      theory_type: theoryType,
    });

    const unlocked = await checkAndUnlockAchievements(
      user.id
    );

    setNewAchievements(unlocked as NewAchievement[]);
  }

  const question = questions[current];

  const score = answers.filter(
    (item) => item.isCorrect
  ).length;

  const finalScore = answers.filter(
    (item) => item.isCorrect
  ).length;

  const finalXp =
    finalScore * XP_PER_CORRECT + COMPLETION_BONUS;

  const resultPercent =
    questions.length > 0
      ? Math.round(
          (finalScore / questions.length) * 100
        )
      : 0;

  const grade = getGrade(resultPercent);

  const weakCategories = getWeakCategories(answers);

  const weakestCategory = weakCategories[0];

  const activeTheoryLabel = theoryType
    ? theoryLabels[theoryType] ?? theoryType
    : "Valgt teori";

  const weakTrainingUrl = weakestCategory
    ? `/test?category=${encodeURIComponent(
        weakestCategory.category
      )}&adaptive=true`
    : "/test";

  function handleAnswer(answer: string) {
    if (!question || selected || saving) return;

    setSelected(answer);
  }

  async function nextQuestion() {
    if (!question || !selected || saving) return;

    const isCorrect =
      selected === question.correct_answer;

    const newAnswer: AnswerRecord = {
      question,
      selectedAnswer: selected,
      isCorrect,
    };

    const finalAnswers = [...answers, newAnswer];

    setAnswers(finalAnswers);

    if (!isCorrect) {
      await saveWrongAnswer(question, selected);
    }

    if (current + 1 < questions.length) {
      setCurrent((prev) => prev + 1);
      setSelected(null);
      return;
    }

    setSaving(true);

    await saveChallengeResult(finalAnswers);

    setSaving(false);
    setFinished(true);
  }
    if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030712] text-white">
        Laster daily challenge...
      </main>
    );
  }

  if (!hasAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030712] px-6 text-white">
        <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#3EE6B0]">
            Premium kreves
          </p>

          <h1 className="mt-4 text-4xl font-extrabold">
            Daily Challenge er kun for premium-brukere
          </h1>

          <a
            href="/pricing"
            className="mt-8 inline-block rounded-2xl bg-[#3EE6B0] px-8 py-4 font-bold text-[#03120F]"
          >
            Velg tilgang
          </a>
        </div>
      </main>
    );
  }

  if (alreadyCompleted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030712] px-6 text-white">
        <div className="max-w-2xl rounded-3xl border border-[#3EE6B0]/20 bg-white/5 p-10 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#3EE6B0]">
            Daily Challenge fullført
          </p>

          <p className="mt-2 text-white/50">{activeTheoryLabel}</p>

          <h1 className="mt-4 text-5xl font-black">
            Du har allerede fullført dagens challenge
          </h1>

          <p className="mt-4 text-lg text-white/60">
            Kom tilbake i morgen for ny bonus XP.
          </p>

          <div className="mt-8 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
              Neste challenge om
            </p>

            <p className="mt-4 text-5xl font-black">{countdown}</p>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <a
              href="/dashboard"
              className="rounded-2xl bg-[#3EE6B0] px-8 py-4 font-bold text-[#03120F]"
            >
              Dashboard
            </a>

            <a
              href="/test"
              className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 font-bold text-white"
            >
              Vanlig test
            </a>
          </div>
        </div>
      </main>
    );
  }

  if (questions.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030712] px-6 text-white">
        <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
          <h1 className="text-4xl font-black">
            Ingen spørsmål funnet
          </h1>

          <p className="mt-4 text-white/60">
            Du trenger aktive eksamensrelevante spørsmål for{" "}
            <span className="font-bold text-[#3EE6B0]">
              {activeTheoryLabel}
            </span>
            .
          </p>

          <p className="mt-4 text-sm text-white/40">
            Sjekk at questions har:
            <br />
            theory_type = {theoryType}
            <br />
            is_active = true
            <br />
            exam_relevant = true
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href="/dashboard"
              className="rounded-2xl bg-[#3EE6B0] px-8 py-4 font-bold text-[#03120F]"
            >
              Dashboard
            </a>

            <a
              href="/choose-theory"
              className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 font-bold text-white"
            >
              Bytt teori
            </a>
          </div>
        </div>
      </main>
    );
  }

  if (finished) {
    return (
      <main className="min-h-screen bg-[#030712] px-6 py-12 text-white">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-[#3EE6B0]/20 bg-white/5 p-10 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#3EE6B0]">
              Daily Challenge fullført
            </p>

            <p className="mt-2 text-white/50">
              {activeTheoryLabel}
            </p>

            <h1 className="mt-4 text-7xl font-black">
              {grade}
            </h1>

            <p className="mt-2 text-white/50">
              Performance grade
            </p>

            <h2 className="mt-6 text-5xl font-black">
              {finalScore} / {questions.length}
            </h2>

            <p className="mt-4 text-2xl font-bold text-[#3EE6B0]">
              +{finalXp} XP
            </p>

            <p className="mt-3 text-white/60">
              Inkluderer {COMPLETION_BONUS} XP bonus.
            </p>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70">
              {getResultMessage(resultPercent)}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-sm text-white/50">
                  Resultat
                </p>

                <p className="mt-2 text-3xl font-black">
                  {resultPercent}%
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-sm text-white/50">
                  Riktige
                </p>

                <p className="mt-2 text-3xl font-black text-[#3EE6B0]">
                  {finalScore}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-sm text-white/50">
                  Bonus XP
                </p>

                <p className="mt-2 text-3xl font-black text-yellow-300">
                  {COMPLETION_BONUS}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-sm text-white/50">
                  Neste challenge
                </p>

                <p className="mt-2 text-xl font-black">
                  {countdown}
                </p>
              </div>
            </div>

            {weakCategories.length > 0 && (
              <div className="mt-8 rounded-3xl border border-[#FF4D6D]/20 bg-[#FF4D6D]/10 p-6 text-left">
                <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#FF4D6D]">
                  Fokusområder
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  {weakCategories.map((item) => (
                    <div
                      key={item.category}
                      className="rounded-full border border-[#FF4D6D]/20 bg-black/20 px-4 py-2 text-sm font-bold text-red-200"
                    >
                      {item.category} · {item.count} feil
                    </div>
                  ))}
                </div>
              </div>
            )}

            {newAchievements.length > 0 && (
              <div className="mt-8 rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-6 text-left">
                <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-300">
                  New Achievements
                </p>

                <h2 className="mt-3 text-3xl font-black">
                  Nye badges låst opp 🔥
                </h2>

                <div className="mt-6 space-y-4">
                  {newAchievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="rounded-2xl border border-yellow-400/20 bg-black/20 p-5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">
                          {achievement.icon ?? "🏅"}
                        </div>

                        <div>
                          <p className="text-xl font-black">
                            {achievement.title ??
                              achievement.key}
                          </p>

                          <p className="mt-1 text-white/60">
                            {achievement.description ??
                              "Achievement unlocked."}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 inline-flex rounded-2xl bg-yellow-400/10 px-4 py-2 text-sm font-bold text-yellow-300">
                        +{achievement.xp_reward} XP reward
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <a
                href="/dashboard"
                className="rounded-2xl bg-[#3EE6B0] px-8 py-4 font-bold text-[#03120F]"
              >
                Dashboard
              </a>

              <a
                href={weakTrainingUrl}
                className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 font-bold text-white"
              >
                Tren svake områder
              </a>

              <a
                href="/ai-coach"
                className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 font-bold text-white"
              >
                AI Coach
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#030712] px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#3EE6B0]">
              Daily Challenge
            </p>

            <h1 className="mt-2 text-4xl font-black">
              Spørsmål {current + 1} / {questions.length}
            </h1>

            <p className="mt-2 text-sm font-bold text-[#3EE6B0]">
              {activeTheoryLabel}
            </p>

            <p className="mt-2 text-sm text-white/50">
              5 spørsmål. Bonus XP. Kun én gang per dag per teori.
            </p>

            <div className="mt-4 h-3 rounded-full bg-white/10">
              <div
                className="h-3 rounded-full bg-[#3EE6B0]"
                style={{
                  width: `${getProgressPercent()}%`,
                }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[#3EE6B0]/20 bg-white/5 px-6 py-4 text-right">
            <p className="text-sm text-white/60">
              Score
            </p>

            <p className="text-3xl font-black text-[#3EE6B0]">
              {score}
            </p>

            <p className="mt-2 text-xs text-white/40">
              +{COMPLETION_BONUS} XP bonus
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          {question.image_url && (
            <img
              src={question.image_url}
              alt="Spørsmålsbilde"
              className="mb-8 max-h-[420px] w-full rounded-3xl object-cover"
            />
          )}

          {(question.category ||
            question.difficulty) && (
            <p className="mb-4 text-sm text-white/40">
              {question.category}{" "}
              {question.difficulty
                ? `• ${question.difficulty}`
                : ""}
            </p>
          )}

          <h2 className="text-3xl font-bold leading-tight">
            {question.question}
          </h2>

          <div className="mt-8 grid gap-4">
            {question.answers.map((answer) => (
              <button
                key={answer}
                onClick={() => handleAnswer(answer)}
                className={`rounded-2xl border px-6 py-5 text-left text-lg font-semibold transition-all ${
                  selected === answer
                    ? "border-[#3EE6B0] bg-[#3EE6B0]/20"
                    : "border-white/10 bg-white/5 hover:border-[#3EE6B0]/50 hover:bg-[#3EE6B0]/10"
                }`}
              >
                {answer}
              </button>
            ))}
          </div>

          <button
            onClick={nextQuestion}
            disabled={!selected || saving}
            className="mt-8 w-full rounded-2xl bg-[#3EE6B0] py-4 text-lg font-bold text-[#03120F] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving
              ? "Lagrer..."
              : current + 1 === questions.length
              ? "Fullfør challenge"
              : "Neste spørsmål"}
          </button>
        </div>
      </div>
    </main>
  );
}