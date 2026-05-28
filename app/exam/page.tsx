"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getActiveSubscription } from "../lib/subscription";
import {
  AchievementRule,
  checkAndUnlockAchievements,
} from "../lib/achievements";
import AchievementToast from "../components/AchievementToast";

type Question = {
  id: string;
  question: string;
  answers: string[];
  correct_answer: string;
  category: string | null;
  difficulty: string | null;
  license_class: string | null;
  explanation: string | null;
  image_url: string | null;
  exam_relevant: boolean | null;
  source_topic: string | null;
  is_active: boolean | null;
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

const LICENSE_CLASS = "B";
const EXAM_QUESTION_LIMIT = 45;
const PASS_PERCENT = 85;
const EXAM_TIME_SECONDS = 45 * 60;

export default function ExamPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answerOptions, setAnswerOptions] = useState<Record<string, string[]>>(
    {}
  );
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState(EXAM_TIME_SECONDS);
  const [autoFinished, setAutoFinished] = useState(false);

  const [newAchievements, setNewAchievements] = useState<AchievementRule[]>([]);
  const [showAchievementToast, setShowAchievementToast] = useState(false);

  useEffect(() => {
    checkAccessAndLoadQuestions();
  }, []);

  useEffect(() => {
    if (finished || loading || !hasAccess) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishExamByTime();
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [finished, loading, hasAccess, questions, answers, current, selected]);

  useEffect(() => {
    if (newAchievements.length === 0) return;

    setShowAchievementToast(true);

    const timer = setTimeout(() => {
      setShowAchievementToast(false);
    }, 6000);

    return () => clearTimeout(timer);
  }, [newAchievements]);

  function shuffleArray<T>(array: T[]) {
    return [...array].sort(() => Math.random() - 0.5);
  }

  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const restSeconds = seconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${restSeconds
      .toString()
      .padStart(2, "0")}`;
  }

  function getTimeColor() {
    if (timeLeft <= 300) return "text-[#FF4D6D]";
    if (timeLeft <= 600) return "text-yellow-300";
    return "text-[#3EE6B0]";
  }

  function getProgressPercent() {
    if (questions.length === 0) return 0;

    return Math.round(((current + 1) / questions.length) * 100);
  }

  function getAnswerPercent(score: number, total: number) {
    if (total === 0) return 0;

    return Math.round((score / total) * 100);
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
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  function getResultMessage(passed: boolean, percent: number) {
    if (passed) {
      if (percent >= 95) {
        return "Veldig sterkt resultat. Du ligger svært godt an.";
      }

      return "Bestått. Nå gjelder det å holde nivået stabilt.";
    }

    if (percent >= 75) {
      return "Du er nær. Tren svake områder og prøv igjen.";
    }

    return "Du bør trene mer målrettet før neste eksamenstest.";
  }

  async function checkAccessAndLoadQuestions() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.log("EXAM USER ERROR:", userError);
        setHasAccess(false);
        return;
      }

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const subscription = await getActiveSubscription(user.id);

      if (!subscription) {
        setHasAccess(false);
        return;
      }

      setHasAccess(true);
      setActivePlan(subscription.plan);

      const { data, error } = await supabase
        .from("questions")
        .select(
          `
          id,
          question,
          answers,
          correct_answer,
          category,
          difficulty,
          license_class,
          explanation,
          image_url,
          exam_relevant,
          source_topic,
          is_active
        `
        )
        .eq("license_class", LICENSE_CLASS)
        .eq("is_active", true)
        .eq("exam_relevant", true);

      if (error) {
        console.log("EXAM QUESTION ERROR:", error);
        setQuestions([]);
      } else {
        const shuffled = shuffleArray((data ?? []) as Question[]);
        const examQuestions = shuffled.slice(0, EXAM_QUESTION_LIMIT);

        const shuffledAnswerOptions = examQuestions.reduce<
          Record<string, string[]>
        >((acc, item) => {
          acc[item.id] = shuffleArray(item.answers);
          return acc;
        }, {});

        setQuestions(examQuestions);
        setAnswerOptions(shuffledAnswerOptions);
      }
    } catch (error) {
      console.log("EXAM LOAD ERROR:", error);
      setQuestions([]);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  }

  async function saveWrongAnswer(question: Question, selectedAnswer: string) {
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
    });
  }

  async function saveResult(
    finalScore: number,
    finalXp: number,
    totalQuestions: number
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("xp")
      .eq("id", user.id)
      .single();

    const currentXp = profile?.xp ?? 0;

    await supabase
      .from("profiles")
      .update({
        xp: currentXp + finalXp,
      })
      .eq("id", user.id);

    await supabase.from("test_results").insert({
      user_id: user.id,
      score: finalScore,
      total_questions: totalQuestions,
      xp_earned: finalXp,
    });

    const unlocked = await checkAndUnlockAchievements(user.id);
    setNewAchievements(unlocked);
  }

  const question = questions[current];

  const currentAnswerOptions = question
    ? answerOptions[question.id] ?? question.answers
    : [];

  function handleAnswer(answer: string) {
    if (!question || saving) return;

    setSelected(answer);
  }

  async function completeExam(finalAnswers: AnswerRecord[]) {
    if (saving || finished) return;

    setSaving(true);

    const finalScore = finalAnswers.filter((item) => item.isCorrect).length;
    const finalXp = finalScore * 15;

    await saveResult(finalScore, finalXp, finalAnswers.length);

    setSaving(false);
    setFinished(true);
  }

  async function nextQuestion() {
    if (!question || !selected || saving) return;

    const isCorrect = selected === question.correct_answer;

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

    await completeExam(finalAnswers);
  }

  async function finishExamByTime() {
    if (finished || saving || questions.length === 0) return;

    setAutoFinished(true);

    const finalAnswers = [...answers];

    if (question && selected) {
      const isCorrect = selected === question.correct_answer;

      const lastAnswer: AnswerRecord = {
        question,
        selectedAnswer: selected,
        isCorrect,
      };

      finalAnswers.push(lastAnswer);

      if (!isCorrect) {
        await saveWrongAnswer(question, selected);
      }
    }

    await completeExam(finalAnswers);
  }

  const finalScore = answers.filter((item) => item.isCorrect).length;
  const finalXp = finalScore * 15;
  const passLimit = Math.ceil(questions.length * (PASS_PERCENT / 100));
  const passed = questions.length > 0 && finalScore >= passLimit;
  const resultPercent = getAnswerPercent(finalScore, questions.length);
  const weakCategories = getWeakCategories(answers);
  const weakestCategory = weakCategories[0];
  const progressPercent = getProgressPercent();

  const weakTrainingUrl = weakestCategory
    ? `/test?category=${encodeURIComponent(
        weakestCategory.category
      )}&adaptive=true`
    : "/test";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030712] text-white">
        Laster eksamenstest...
      </main>
    );
  }

  if (!hasAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030712] px-6 text-white">
        <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#3EE6B0]">
            Tilgang kreves
          </p>

          <h1 className="mt-4 text-4xl font-extrabold">
            Kjøp tilgang for å starte eksamenstest
          </h1>

          <p className="mt-4 text-white/60">
            Eksamenstest er kun tilgjengelig for aktive brukere.
          </p>

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

  if (questions.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030712] px-6 text-white">
        <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#3EE6B0]">
            Ingen spørsmål
          </p>

          <h1 className="mt-4 text-4xl font-extrabold">
            Fant ingen aktive klasse B-spørsmål
          </h1>

          <p className="mt-4 text-white/60">
            Sjekk at questions har:
            <br />
            license_class = B
            <br />
            is_active = true
            <br />
            exam_relevant = true
          </p>

          <a
            href="/dashboard"
            className="mt-8 inline-block rounded-2xl bg-[#3EE6B0] px-8 py-4 font-bold text-[#03120F]"
          >
            Til dashboard
          </a>
        </div>
      </main>
    );
  }
    if (finished) {
    return (
      <main className="relative min-h-screen bg-[#030712] px-6 py-12 text-white">
        <AchievementToast
          achievements={newAchievements}
          visible={showAchievementToast}
          onClose={() => setShowAchievementToast(false)}
        />

        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-[#3EE6B0]/20 bg-white/5 p-10 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#3EE6B0]">
              Eksamenstest klasse {LICENSE_CLASS} fullført
            </p>

            {autoFinished && (
              <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-yellow-200">
                Tiden gikk ut. Testen ble automatisk fullført.
              </div>
            )}

            <h1 className="mt-6 text-6xl font-black">
              {finalScore} / {questions.length}
            </h1>

            <p
              className={`mt-4 text-3xl font-black ${
                passed ? "text-[#3EE6B0]" : "text-[#FF4D6D]"
              }`}
            >
              {passed ? "Bestått" : "Ikke bestått"}
            </p>

            <p className="mt-3 text-white/60">
              Grense: {passLimit} riktige av {questions.length}
            </p>

            <p className="mt-4 text-xl text-white/70">
              Du fikk {finalXp} XP
            </p>

            <p className="mx-auto mt-4 max-w-2xl text-white/60">
              {getResultMessage(passed, resultPercent)}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-sm text-white/50">Resultat</p>
                <p className="mt-2 text-3xl font-black">{resultPercent}%</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-sm text-white/50">Riktige</p>
                <p className="mt-2 text-3xl font-black text-[#3EE6B0]">
                  {finalScore}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-sm text-white/50">Feil</p>
                <p className="mt-2 text-3xl font-black text-[#FF4D6D]">
                  {questions.length - finalScore}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-sm text-white/50">XP</p>
                <p className="mt-2 text-3xl font-black text-yellow-300">
                  {finalXp}
                </p>
              </div>
            </div>

            {weakCategories.length > 0 && (
              <div className="mt-8 rounded-3xl border border-[#FF4D6D]/20 bg-[#FF4D6D]/10 p-6 text-left">
                <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#FF4D6D]">
                  Svake områder fra eksamen
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  {weakCategories.map((item) => (
                    <a
                      key={item.category}
                      href={`/test?category=${encodeURIComponent(
                        item.category
                      )}&adaptive=true`}
                      className="rounded-full border border-[#FF4D6D]/20 bg-black/20 px-4 py-2 text-sm font-bold text-red-200 hover:border-[#FF4D6D]/60"
                    >
                      {item.category} · {item.count} feil
                    </a>
                  ))}
                </div>
              </div>
            )}

            {newAchievements.length > 0 && (
              <div className="mt-8 rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-6 text-left">
                <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-300">
                  Nye achievements
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
                        <div className="text-4xl">{achievement.icon}</div>

                        <div>
                          <p className="text-xl font-black">
                            {achievement.title}
                          </p>

                          <p className="mt-1 text-white/60">
                            {achievement.description}
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
                href="/exam"
                className="rounded-2xl bg-[#3EE6B0] px-8 py-4 font-bold text-[#03120F]"
              >
                Ta ny eksamenstest
              </a>

              <a
                href={weakTrainingUrl}
                className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 font-bold text-white hover:border-[#FF4D6D]/40"
              >
                Tren svake områder
              </a>

              <a
                href="/dashboard"
                className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 font-bold text-white"
              >
                Dashboard
              </a>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8">
            <h2 className="text-3xl font-black">Gjennomgang</h2>

            <p className="mt-2 text-white/50">
              Her ser du alle spørsmålene, svarene dine og forklaring der den
              finnes.
            </p>

            <div className="mt-6 space-y-4">
              {answers.map((item, index) => (
                <div
                  key={item.question.id}
                  className={`rounded-2xl border p-5 ${
                    item.isCorrect
                      ? "border-[#3EE6B0]/20 bg-[#3EE6B0]/5"
                      : "border-[#FF4D6D]/20 bg-[#FF4D6D]/5"
                  }`}
                >
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/50">
                      Spørsmål {index + 1}
                    </span>

                    {item.question.category && (
                      <span className="rounded-full bg-[#3EE6B0]/10 px-3 py-1 text-xs font-bold text-[#3EE6B0]">
                        {item.question.category}
                      </span>
                    )}

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        item.isCorrect
                          ? "bg-[#3EE6B0]/10 text-[#3EE6B0]"
                          : "bg-[#FF4D6D]/10 text-[#FF4D6D]"
                      }`}
                    >
                      {item.isCorrect ? "Riktig" : "Feil"}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-bold">
                    {item.question.question}
                  </h3>

                  <p className="mt-3 text-white/60">
                    Ditt svar:{" "}
                    <span
                      className={
                        item.isCorrect ? "text-[#3EE6B0]" : "text-[#FF4D6D]"
                      }
                    >
                      {item.selectedAnswer}
                    </span>
                  </p>

                  {!item.isCorrect && (
                    <p className="mt-2 text-white/60">
                      Riktig svar:{" "}
                      <span className="text-[#3EE6B0]">
                        {item.question.correct_answer}
                      </span>
                    </p>
                  )}

                  {item.question.explanation && (
                    <div className="mt-4 rounded-2xl border border-[#3EE6B0]/20 bg-[#3EE6B0]/10 p-4">
                      <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#3EE6B0]">
                        Forklaring
                      </p>

                      <p className="mt-2 text-white/70">
                        {item.question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#030712] px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#3EE6B0]">
              Eksamenstest klasse {LICENSE_CLASS}
            </p>

            <h1 className="mt-2 text-4xl font-black">
              Spørsmål {current + 1} / {questions.length}
            </h1>

            <div className="mt-4 h-3 rounded-full bg-white/10">
              <div
                className="h-3 rounded-full bg-[#3EE6B0]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {activePlan && (
              <p className="mt-2 text-sm text-white/50">
                Aktiv plan: {activePlan}
              </p>
            )}

            <p className="mt-2 text-sm text-white/40">
              Ingen fasit vises før testen er fullført.
            </p>
          </div>

          <div className="rounded-2xl border border-[#3EE6B0]/20 bg-white/5 px-6 py-4 text-right">
            <p className="text-sm text-white/60">Tid igjen</p>

            <p className={`text-3xl font-black ${getTimeColor()}`}>
              {formatTime(timeLeft)}
            </p>

            <p className="mt-2 text-xs text-white/40">
              Besvart: {answers.length}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          {question.image_url && (
            <img
              src={question.image_url}
              alt="Spørsmålsbilde"
              className="mb-6 max-h-[420px] w-full rounded-2xl object-cover"
            />
          )}

          <div className="mb-4 flex flex-wrap gap-2">
            {question.category && (
              <span className="rounded-full bg-[#3EE6B0]/10 px-3 py-1 text-xs font-bold text-[#3EE6B0]">
                {question.category}
              </span>
            )}

            {question.difficulty && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/50">
                {question.difficulty}
              </span>
            )}
          </div>

          <h2 className="text-3xl font-bold leading-tight">
            {question.question}
          </h2>

          <div className="mt-8 grid gap-4">
            {currentAnswerOptions.map((answer) => (
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
              ? "Fullfør eksamenstest"
              : "Neste spørsmål"}
          </button>
        </div>
      </div>
    </main>
  );
}