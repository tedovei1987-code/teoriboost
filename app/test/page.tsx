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
  image_url: string | null;
};

type WrongAnswer = {
  category: string | null;
};

type DifficultyLevel = "easy" | "medium" | "hard";

const TEST_QUESTION_LIMIT = 20;

export default function TestPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answerOptions, setAnswerOptions] = useState<
  Record<string, string[]>
>({});
  const [current, setCurrent] = useState(0);
  const [xp, setXp] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [adaptiveMode, setAdaptiveMode] = useState(false);
  const [weakFocus, setWeakFocus] = useState<string[]>([]);
  const [comboStreak, setComboStreak] = useState(0);
  const [peakCombo, setPeakCombo] = useState(0);
  const [difficultyLevel, setDifficultyLevel] =
    useState<DifficultyLevel>("medium");
  const [earnedXp, setEarnedXp] = useState<number[]>([]);
  const [aiExplanation, setAiExplanation] = useState("");
  const [aiExplanationLoading, setAiExplanationLoading] = useState(false);

  const [newAchievements, setNewAchievements] = useState<
    AchievementRule[]
  >([]);

  const [showAchievementToast, setShowAchievementToast] =
    useState(false);
    const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    checkAccessAndLoadQuestions();
  }, []);

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

  function normalizeDifficulty(difficulty: string | null): DifficultyLevel {
    const value = difficulty?.toLowerCase().trim();

    if (
      value === "easy" ||
      value === "lett" ||
      value === "enkel"
    ) {
      return "easy";
    }

    if (
      value === "hard" ||
      value === "vanskelig" ||
      value === "høy"
    ) {
      return "hard";
    }

    return "medium";
  }

  function getXpReward(difficulty: string | null) {
    const normalized = normalizeDifficulty(difficulty);

    if (normalized === "easy") {
      return 10;
    }

    if (normalized === "hard") {
      return 25;
    }

    return 15;
  }

  function getDifficultyLabel(level: DifficultyLevel) {
    if (level === "easy") return "Lett";
    if (level === "hard") return "Vanskelig";
    return "Medium";
  }

  function getTopWeakCategories(wrongAnswers: WrongAnswer[]) {
    const counts: Record<string, number> = {};

    wrongAnswers.forEach((item) => {
      if (!item.category) return;

      counts[item.category] =
        (counts[item.category] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);
  }

  function takeQuestions(
    source: Question[],
    amount: number,
    usedIds: Set<string>
  ) {
    const picked: Question[] = [];

    for (const question of shuffleArray(source)) {
      if (picked.length >= amount) break;

      if (usedIds.has(question.id)) continue;

      picked.push(question);
      usedIds.add(question.id);
    }

    return picked;
  }

  function buildAdaptiveQuestionSet(
    allQuestions: Question[],
    weakCategories: string[]
  ) {
    const usedIds = new Set<string>();

    const weakQuestions = allQuestions.filter(
      (question) =>
        question.category &&
        weakCategories.includes(question.category)
    );

    const easyQuestions = allQuestions.filter(
      (question) =>
        normalizeDifficulty(question.difficulty) === "easy"
    );

    const mediumQuestions = allQuestions.filter(
      (question) =>
        normalizeDifficulty(question.difficulty) === "medium"
    );

    const hardQuestions = allQuestions.filter(
      (question) =>
        normalizeDifficulty(question.difficulty) === "hard"
    );

    const selectedQuestions = [
      ...takeQuestions(weakQuestions, 8, usedIds),
      ...takeQuestions(mediumQuestions, 6, usedIds),
      ...takeQuestions(hardQuestions, 4, usedIds),
      ...takeQuestions(easyQuestions, 2, usedIds),
    ];

    if (selectedQuestions.length < TEST_QUESTION_LIMIT) {
      selectedQuestions.push(
        ...takeQuestions(
          allQuestions,
          TEST_QUESTION_LIMIT - selectedQuestions.length,
          usedIds
        )
      );
    }

    return shuffleArray(selectedQuestions).slice(
      0,
      TEST_QUESTION_LIMIT
    );
  }

  async function checkAccessAndLoadQuestions() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const subscription = await getActiveSubscription(user.id);

    if (!subscription) {
  setHasAccess(true);
  setActivePlan("free");
} else {
  setHasAccess(true);
  setActivePlan(subscription.plan);
}

    const { data: questionData, error: questionError } =
      await supabase
        .from("questions")
        .select(
          "id, question, answers, correct_answer, category, difficulty, image_url"
        )
        .eq("is_active", true)
        .eq("license_class", "B");

    if (questionError) {
      console.log("QUESTION ERROR:", questionError);
      setQuestions([]);
      setLoading(false);
      return;
    }

    const { data: wrongAnswers, error: wrongAnswerError } =
      await supabase
        .from("wrong_answers")
        .select("category")
        .eq("user_id", user.id);

    if (wrongAnswerError) {
      console.log("WRONG ANSWERS ERROR:", wrongAnswerError);
    }

    const weakCategories = getTopWeakCategories(
      (wrongAnswers ?? []) as WrongAnswer[]
    );

    setWeakFocus(weakCategories);
    setAdaptiveMode(weakCategories.length > 0);

    const typedQuestions = (questionData ?? []) as Question[];

const finalQuestions =
  weakCategories.length > 0
    ? buildAdaptiveQuestionSet(
        typedQuestions,
        weakCategories
      )
    : shuffleArray(typedQuestions).slice(
        0,
        TEST_QUESTION_LIMIT
      );

    const shuffledAnswerOptions = finalQuestions.reduce<Record<string, string[]>>(
  (acc, item) => {
    acc[item.id] = shuffleArray(item.answers);
    return acc;
  },
  {}
);

setQuestions(finalQuestions);
setAnswerOptions(shuffledAnswerOptions);
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
    });
  }

  async function saveResult(
    finalScore: number,
    finalXp: number
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
      total_questions: questions.length,
      xp_earned: finalXp,
    });

    const unlocked = await checkAndUnlockAchievements(user.id);

    setNewAchievements(unlocked);
  }

  const question = questions[current];
  const currentAnswerOptions = question
  ? answerOptions[question.id] ?? question.answers
  : [];

  async function handleAnswer(answer: string) {
    if (selected || !question) return;

    setSelected(answer);

    const isCorrect =
      answer === question.correct_answer;

    const questionXp = getXpReward(
      question.difficulty
    );

    if (isCorrect) {
      const newCombo = comboStreak + 1;

      setComboStreak(newCombo);
      setPeakCombo((prev) => Math.max(prev, newCombo));

      let comboBonus = 0;

      if (newCombo >= 5) {
        comboBonus = 10;
      } else if (newCombo >= 3) {
        comboBonus = 5;
      }

      const totalXp =
        questionXp + comboBonus;

      setXp((prev) => prev + totalXp);

      setEarnedXp((prev) => [
        ...prev,
        totalXp,
      ]);

      setScore((prev) => prev + 1);

      if (newCombo >= 4) {
        setDifficultyLevel("hard");
      } else if (newCombo >= 2) {
        setDifficultyLevel("medium");
      }
    } else {
      setComboStreak(0);
      setDifficultyLevel("easy");
      setEarnedXp((prev) => [...prev, 0]);

      await saveWrongAnswer(question, answer);
    }
  }
async function explainWrongAnswer() {
  if (!question || !selected) return;

  setAiExplanationLoading(true);
  setAiExplanation("");

  try {
    const response = await fetch("/api/ai-coach", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
      message: `
Dette er et teoriprøve trafikkspørsmål for bil klasse B.
Forklar hvorfor dette svaret er feil.

Spørsmål:
${question.question}

Svaralternativer:
${question.answers.join(", ")}

Brukeren svarte:
${selected}

Riktig svar:
${question.correct_answer}

Kategori:
${question.category ?? "Ukjent"}

Forklar kort, enkelt og pedagogisk på norsk.
        `,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "AI-feil");
    }

    setAiExplanation(data.reply);
  } catch (error) {
    console.log(error);
    setAiExplanation(
      "Malin klarte ikke forklare akkurat nå 😭 Prøv igjen om litt."
    );
  } finally {
    setAiExplanationLoading(false);
  }
}
  async function nextQuestion() {
  if (
    activePlan === "free" &&
    current >= 19
  ) {
   window.location.href = "/pricing?reason=free-limit";
return;
  }

  if (current + 1 < questions.length) {
      setCurrent((prev) => prev + 1);
      setSelected(null);
    } else {
      setFinished(true);

      await saveResult(score, xp);
    }
  }

  const averageXp =
    earnedXp.length > 0
      ? Math.round(
          earnedXp.reduce((a, b) => a + b, 0) /
            earnedXp.length
        )
      : 0;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030712] text-white">
        Laster adaptiv test...
      </main>
    );
  }

  if (!hasAccess && activePlan !== "free") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030712] px-6 text-white">
        <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#3EE6B0]">
            Tilgang kreves
          </p>

          <h1 className="mt-4 text-4xl font-extrabold">
            Kjøp tilgang for å starte testen
          </h1>

          <p className="mt-4 text-white/60">
            Du trenger et aktivt abonnement for å bruke testen.
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
            Fant ingen spørsmål i databasen
          </h1>

          <p className="mt-4 text-white/60">
            Legg inn spørsmål i Supabase-tabellen questions.
          </p>
        </div>
      </main>
    );
  }

  if (finished) {
    return (
      <main className="relative flex min-h-screen items-center justify-center bg-[#030712] px-6 py-12 text-white">
        <AchievementToast
          achievements={newAchievements}
          visible={showAchievementToast}
          onClose={() =>
            setShowAchievementToast(false)
          }
        />

        <div className="w-full max-w-2xl rounded-3xl border border-[#3EE6B0]/20 bg-white/5 p-10 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#3EE6B0]">
            Test fullført
          </p>

          <h1 className="mt-4 text-5xl font-black">
            {score} / {questions.length} riktige
          </h1>

          <p className="mt-4 text-2xl font-bold text-[#3EE6B0]">
            Du fikk {xp} XP
          </p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5 text-left">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
              Adaptive analytics
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs text-white/40">
                  Combo peak
                </p>

                <p className="mt-2 text-2xl font-black">
                  {peakCombo}
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs text-white/40">
                  Average XP
                </p>

                <p className="mt-2 text-2xl font-black">
                  {averageXp}
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs text-white/40">
                  Difficulty
                </p>

                <p className="mt-2 text-2xl font-black uppercase">
                  {getDifficultyLabel(difficultyLevel)}
                </p>
              </div>
            </div>
          </div>

          {adaptiveMode && weakFocus.length > 0 && (
            <div className="mt-8 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6 text-left">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-300">
                Adaptiv test
              </p>

              <h2 className="mt-3 text-2xl font-black">
                Testen fokuserte på dine svake områder
              </h2>

              <div className="mt-4 flex flex-wrap gap-2">
                {weakFocus.map((category) => (
                  <span
                    key={category}
                    className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-200"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}

          {newAchievements.length > 0 && (
            <div className="mt-10 rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-8 text-left">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-300">
                Nye achievements
              </p>

              <h2 className="mt-3 text-3xl font-black">
                Du låste opp nye badges 🔥
              </h2>

              <div className="mt-6 space-y-4">
                {newAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="rounded-2xl border border-yellow-400/20 bg-black/20 p-5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">
                        {achievement.icon}
                      </div>

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

          <a
            href="/dashboard"
            className="mt-10 inline-block rounded-2xl bg-[#3EE6B0] px-8 py-4 font-bold text-[#03120F]"
          >
            Til dashboard
          </a>
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
              TeoriBoost Test
            </p>

            <h1 className="mt-2 text-4xl font-black">
              Spørsmål {current + 1} / {questions.length}
            </h1>

            {activePlan && (
              <p className="mt-2 text-sm text-white/50">
                Aktiv plan: {activePlan}
              </p>
            )}

            {adaptiveMode && weakFocus.length > 0 && (
              <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                  Adaptiv modus
                </p>

                <p className="mt-2 text-sm text-white/60">
                  Testen prioriterer dine svake områder.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {weakFocus.map((category) => (
                    <span
                      key={category}
                      className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(question.category || question.difficulty) && (
              <p className="mt-4 text-sm text-white/40">
                {question.category}{" "}
                {question.difficulty
                  ? `• ${question.difficulty}`
                  : ""}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-[#3EE6B0]/20 bg-white/5 px-6 py-4">
            <p className="text-sm text-white/60">XP</p>

            <p className="mt-1 text-xs text-white/40">
              {getDifficultyLabel(difficultyLevel)}
            </p>

            <p className="mt-2 text-3xl font-black text-[#3EE6B0]">
              {xp}
            </p>

            {comboStreak >= 2 && (
              <p className="mt-2 text-xs font-bold text-yellow-300">
                🔥 Combo x{comboStreak}
              </p>
            )}
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

          <h2 className="text-3xl font-bold leading-tight">
            {question.question}
          </h2>

          <div className="mt-8 grid gap-4">
            {currentAnswerOptions.map((answer) => {
              const isCorrect =
                answer === question.correct_answer;

              const isSelected = selected === answer;

              return (
                <button
                  key={answer}
                  onClick={() =>
                    handleAnswer(answer)
                  }
                  className={`rounded-2xl border px-6 py-5 text-left text-lg font-semibold transition-all ${
                    selected
                      ? isCorrect
                        ? "border-[#3EE6B0] bg-[#3EE6B0]/20"
                        : isSelected
                        ? "border-red-500 bg-red-500/20"
                        : "border-white/10 bg-white/5"
                      : "border-white/10 bg-white/5 hover:border-[#3EE6B0]/50 hover:bg-[#3EE6B0]/10"
                  }`}
                >
                  {answer}
                </button>
              );
            })}
          </div>
{selected && selected !== question.correct_answer && (
  <div className="mt-6 rounded-2xl border border-[#FF4D6D]/20 bg-[#FF4D6D]/10 p-5">
    <p className="font-bold text-[#FF8FA3]">
      Feil svar
    </p>

    <button
      onClick={explainWrongAnswer}
      disabled={aiExplanationLoading}
      className="mt-4 rounded-2xl bg-[#3EE6B0] px-5 py-3 font-black text-[#03120F] disabled:opacity-50"
    >
      {aiExplanationLoading
        ? "Malin forklarer..."
        : "🤖 Forklar hvorfor"}
    </button>

    {aiExplanation && (
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-white/80">
        {aiExplanation}
      </div>
    )}
  </div>
)}
          {selected && (
            <button
              onClick={nextQuestion}
              className="mt-8 w-full rounded-2xl bg-[#3EE6B0] py-4 text-lg font-bold text-[#03120F]"
            >
              Neste spørsmål
            </button>
          )}
        </div>
      </div>
    </main>
  );
}