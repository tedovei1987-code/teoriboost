"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";
import { getActiveSubscription } from "../lib/subscription";
import {
  AchievementRule,
  checkAndUnlockAchievements,
  MasteryAnswer,
  updateCategoryMastery,
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
  is_active: boolean | null;
  exam_relevant: boolean | null;
  theory_type: string | null;
};

type WrongAnswer = {
  category: string | null;
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

type DifficultyLevel = "easy" | "medium" | "hard";

const QUESTION_LIMIT = 15;

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

export default function WeakTestPage() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [current, setCurrent] = useState(0);
  const [xp, setXp] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [weakCategory, setWeakCategory] = useState<string | null>(null);
  const [weakCategories, setWeakCategories] = useState<WeakCategory[]>([]);
  const [difficultyLevel, setDifficultyLevel] =
    useState<DifficultyLevel>("medium");
  const [comboStreak, setComboStreak] = useState(0);
  const [peakCombo, setPeakCombo] = useState(0);
  const [masteryAnswers, setMasteryAnswers] = useState<MasteryAnswer[]>([]);
  const [retryMode, setRetryMode] = useState(false);
  const [theoryType, setTheoryType] = useState<string | null>(null);

  const [newAchievements, setNewAchievements] = useState<AchievementRule[]>([]);
  const [showAchievementToast, setShowAchievementToast] = useState(false);

  useEffect(() => {
    loadWeakTest();
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

    if (value === "easy" || value === "lett" || value === "enkel") {
      return "easy";
    }

    if (value === "hard" || value === "vanskelig" || value === "høy") {
      return "hard";
    }

    return "medium";
  }

  function getXpReward(difficulty: string | null) {
    const normalized = normalizeDifficulty(difficulty);

    if (normalized === "easy") return 10;
    if (normalized === "hard") return 25;

    return 15;
  }

  function getDifficultyLabel(level: DifficultyLevel) {
    if (level === "easy") return "Lett";
    if (level === "hard") return "Vanskelig";
    return "Medium";
  }

  function getWeakCategoryList(wrongAnswers: WrongAnswer[]) {
    const counts: Record<string, number> = {};

    wrongAnswers.forEach((item) => {
      const category = item.category || "Ukjent kategori";
      counts[category] = (counts[category] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([category, count]) => ({
        category,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }

  function buildSmartQuestionSet(
    allQuestions: Question[],
    focusCategories: WeakCategory[]
  ) {
    const usedIds = new Set<string>();

    const primary = focusCategories[0]?.category;
    const secondary = focusCategories[1]?.category;
    const tertiary = focusCategories[2]?.category;

    const primaryQuestions = allQuestions.filter(
      (question) => question.category === primary
    );

    const secondaryQuestions = allQuestions.filter(
      (question) => question.category === secondary
    );

    const tertiaryQuestions = allQuestions.filter(
      (question) => question.category === tertiary
    );

    const hardQuestions = allQuestions.filter(
      (question) => normalizeDifficulty(question.difficulty) === "hard"
    );

    const mediumQuestions = allQuestions.filter(
      (question) => normalizeDifficulty(question.difficulty) === "medium"
    );

    const easyQuestions = allQuestions.filter(
      (question) => normalizeDifficulty(question.difficulty) === "easy"
    );

    function take(source: Question[], amount: number) {
      const picked: Question[] = [];

      for (const question of shuffleArray(source)) {
        if (picked.length >= amount) break;
        if (usedIds.has(question.id)) continue;

        picked.push(question);
        usedIds.add(question.id);
      }

      return picked;
    }

    const selectedQuestions = [
      ...take(primaryQuestions, 7),
      ...take(secondaryQuestions, 4),
      ...take(tertiaryQuestions, 2),
      ...take(hardQuestions, 2),
      ...take(mediumQuestions, 2),
      ...take(easyQuestions, 1),
    ];

    if (selectedQuestions.length < QUESTION_LIMIT) {
      selectedQuestions.push(
        ...take(allQuestions, QUESTION_LIMIT - selectedQuestions.length)
      );
    }

    return shuffleArray(selectedQuestions).slice(0, QUESTION_LIMIT);
  }

  async function loadWeakTest() {
    try {
      setLoading(true);

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
        console.log("WEAK TEST PROFILE ERROR:", profileError);
      }

      if (!profile?.theory_type) {
        window.location.href = "/choose-theory";
        return;
      }

      setTheoryType(profile.theory_type);

      const subscription = await getActiveSubscription(user.id);

      if (!subscription) {
        setHasAccess(false);
        return;
      }

      setHasAccess(true);

      const { data: wrongAnswers, error: wrongAnswersError } = await supabase
  .from("wrong_answers")
  .select("category")
  .eq("user_id", user.id);

      if (wrongAnswersError) {
        console.log("WEAK TEST WRONG ANSWERS ERROR:", wrongAnswersError);
        setQuestions([]);
        return;
      }

      const weakList = getWeakCategoryList(
        (wrongAnswers ?? []) as WrongAnswer[]
      );

      if (categoryParam) {
        setWeakCategory(categoryParam);
        setWeakCategories([{ category: categoryParam, count: 1 }]);
      } else {
        setWeakCategory(weakList[0]?.category ?? null);
        setWeakCategories(weakList);
      }

      const focusCategories = categoryParam
        ? [{ category: categoryParam, count: 1 }]
        : weakList;

      if (focusCategories.length === 0) {
        setQuestions([]);
        return;
      }

      const focusNames = focusCategories.map((item) => item.category);

      const { data: questionData, error } = await supabase
        .from("questions")
        .select(`
          id,
          question,
          answers,
          correct_answer,
          category,
          difficulty,
          image_url,
          is_active,
          exam_relevant,
          theory_type
        `)
        .in("category", focusNames)
        .eq("is_active", true)
        .eq("theory_type", profile.theory_type);

      if (error) {
        console.log("WEAK TEST QUESTION ERROR:", error);
        setQuestions([]);
      } else {
        const smartQuestions = buildSmartQuestionSet(
          (questionData ?? []) as Question[],
          focusCategories
        );

        setQuestions(smartQuestions);
      }
    } catch (error) {
      console.log("WEAK TEST LOAD ERROR:", error);
      setQuestions([]);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  }

  async function saveResult(finalScore: number, finalXp: number) {
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
      theory_type: theoryType,
    });

    await updateCategoryMastery(user.id, masteryAnswers);

    const unlocked = await checkAndUnlockAchievements(user.id);

    setNewAchievements(unlocked);
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
      theory_type: theoryType,
    });
  }

  const question = questions[current];

  async function handleAnswer(answer: string) {
    if (selected || !question) return;

    setSelected(answer);

    const isCorrect = answer === question.correct_answer;

    setAnswers((prev) => [
      ...prev,
      {
        question,
        selectedAnswer: answer,
        isCorrect,
      },
    ]);

    setMasteryAnswers((prev) => [
      ...prev,
      {
        category: question.category,
        isCorrect,
      },
    ]);

    const baseXp = getXpReward(question.difficulty);

    if (isCorrect) {
      const newCombo = comboStreak + 1;

      setComboStreak(newCombo);
      setPeakCombo((prev) => Math.max(prev, newCombo));

      let comboBonus = 0;

      if (newCombo >= 5) {
        comboBonus = 15;
      } else if (newCombo >= 3) {
        comboBonus = 8;
      }

      const totalXp = baseXp + comboBonus;

      setXp((prev) => prev + totalXp);
      setScore((prev) => prev + 1);

      if (newCombo >= 4) {
        setDifficultyLevel("hard");
      } else if (newCombo >= 2) {
        setDifficultyLevel("medium");
      }
    } else {
      setComboStreak(0);
      setDifficultyLevel("easy");

      await saveWrongAnswer(question, answer);
    }
  }

  async function nextQuestion() {
    if (current + 1 < questions.length) {
      setCurrent((prev) => prev + 1);
      setSelected(null);
    } else {
      await saveResult(score, xp);
      setFinished(true);
    }
  }

  function startRetryIncorrect() {
    const wrongQuestions = answers
      .filter((item) => !item.isCorrect)
      .map((item) => item.question);

    if (wrongQuestions.length === 0) return;

    setQuestions(wrongQuestions);
    setAnswers([]);
    setCurrent(0);
    setSelected(null);
    setFinished(false);
    setScore(0);
    setXp(0);
    setComboStreak(0);
    setPeakCombo(0);
    setMasteryAnswers([]);
    setRetryMode(true);
  }

  const activeTheoryLabel = theoryType
    ? theoryLabels[theoryType] ?? theoryType
    : "Valgt teori";

  const masteryPercent =
    questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  const wrongAnswers = answers.filter((item) => !item.isCorrect);

  const confidenceScore = Math.max(
    0,
    Math.min(100, masteryPercent - wrongAnswers.length * 3 + peakCombo * 2)
  );

  const progressPercent =
    questions.length > 0
      ? Math.round(((current + 1) / questions.length) * 100)
      : 0;

  const masteryLabel =
    masteryPercent >= 90
      ? "Mastered"
      : masteryPercent >= 75
      ? "Strong"
      : masteryPercent >= 50
      ? "Improving"
      : "Beginner";

  const masteryText =
    masteryPercent >= 90
      ? "Du har veldig god kontroll på dette området."
      : masteryPercent >= 75
      ? "Du er sterk her, men bør stabilisere litt mer."
      : masteryPercent >= 50
      ? "Du er på vei, men bør trene mer målrettet."
      : "Dette er fortsatt et tydelig svakt område.";

  const focusText =
    weakCategories.length > 0
      ? weakCategories.map((item) => item.category).join(", ")
      : weakCategory ?? "Svake områder";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030712] text-white">
        Laster Test på svake områder...
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
            Kjøp tilgang for å øve på svake områder
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

  if (questions.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030712] px-6 text-white">
        <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#3EE6B0]">
            Ingen svake områder
          </p>

          <h1 className="mt-4 text-4xl font-extrabold">
            Du har ingen registrerte feil for {activeTheoryLabel}
          </h1>

          <p className="mt-4 text-white/60">
            Ta en vanlig test først, så bygger TeoriBoost en personlig
            svakhetstest for valgt teori.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href="/test"
              className="inline-block rounded-2xl bg-[#3EE6B0] px-8 py-4 font-bold text-[#03120F]"
            >
              Start vanlig test
            </a>

            <a
              href="/choose-theory"
              className="inline-block rounded-2xl border border-white/10 px-8 py-4 font-bold text-white hover:bg-white/5"
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
      <main className="relative flex min-h-screen items-center justify-center bg-[#030712] px-6 py-12 text-white">
        <AchievementToast
          achievements={newAchievements}
          visible={showAchievementToast}
          onClose={() => setShowAchievementToast(false)}
        />

        <div className="w-full max-w-4xl rounded-3xl border border-[#3EE6B0]/20 bg-white/5 p-10 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#3EE6B0]">
            Svakhetstest fullført
          </p>

          <p className="mt-2 text-white/50">{activeTheoryLabel}</p>

          <h1 className="mt-4 text-5xl font-black">
            {score} / {questions.length} riktige
          </h1>

          <p className="mt-4 text-2xl font-bold text-[#3EE6B0]">
            Du fikk {xp} XP
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-white/50">Mastery</p>
              <p className="mt-2 text-3xl font-black text-[#3EE6B0]">
                {masteryPercent}%
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-white/50">Nivå</p>
              <p className="mt-2 text-2xl font-black">{masteryLabel}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-white/50">Confidence</p>
              <p className="mt-2 text-3xl font-black text-cyan-300">
                {confidenceScore}%
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-white/50">Peak combo</p>
              <p className="mt-2 text-3xl font-black text-yellow-300">
                {peakCombo}
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6 text-left">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-300">
              AI-lignende analyse
            </p>

            <h2 className="mt-3 text-3xl font-black">Fokus: {focusText}</h2>

            <p className="mt-4 text-white/70">{masteryText}</p>

            {retryMode && (
              <p className="mt-3 text-yellow-300">
                Dette var en retry-test med kun tidligere feil.
              </p>
            )}
          </div>

          {wrongAnswers.length > 0 && (
            <div className="mt-8 rounded-3xl border border-red-400/20 bg-red-400/10 p-6 text-left">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-300">
                Feil du bør repetere
              </p>

              <div className="mt-5 space-y-4">
                {wrongAnswers.map((item, index) => (
                  <div
                    key={`${item.question.id}-${index}`}
                    className="rounded-2xl border border-white/10 bg-black/20 p-5"
                  >
                    <p className="text-sm text-white/40">
                      {item.question.category ?? "Ukjent kategori"}{" "}
                      {item.question.difficulty
                        ? `• ${item.question.difficulty}`
                        : ""}
                    </p>

                    <h3 className="mt-2 font-bold">{item.question.question}</h3>

                    <p className="mt-3 text-sm text-red-200">
                      Ditt svar: {item.selectedAnswer}
                    </p>

                    <p className="mt-1 text-sm text-[#3EE6B0]">
                      Riktig svar: {item.question.correct_answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {newAchievements.length > 0 && (
            <div className="mt-8 rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-6 text-left">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-300">
                Nye achievements
              </p>

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
            {wrongAnswers.length > 0 && (
              <button
                onClick={startRetryIncorrect}
                className="rounded-2xl border border-red-400/20 bg-red-400/10 px-8 py-4 font-bold text-red-200"
              >
                Tren kun feil svar
              </button>
            )}

            <a
              href="/weak-test"
              className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-8 py-4 font-bold text-cyan-200"
            >
              Ny svakhetstest
            </a>

            <a
              href="/dashboard"
              className="rounded-2xl bg-[#3EE6B0] px-8 py-4 font-bold text-[#03120F]"
            >
              Til dashboard
            </a>
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
              Svakhetstest
            </p>

            <h1 className="mt-2 text-4xl font-black">
              Spørsmål {current + 1} / {questions.length}
            </h1>

            <p className="mt-2 text-sm font-bold text-[#3EE6B0]">
              {activeTheoryLabel}
            </p>

            <div className="mt-4 h-3 rounded-full bg-white/10">
              <div
                className="h-3 rounded-full bg-[#3EE6B0]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p className="mt-3 text-sm text-white/50">
              Fokusområde: {focusText}
            </p>

            {retryMode && (
              <p className="mt-2 text-sm text-yellow-300">
                Retry-modus: kun feil svar
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-[#3EE6B0]/20 bg-white/5 px-6 py-4">
            <p className="text-sm text-white/60">XP</p>

            <p className="text-3xl font-black text-[#3EE6B0]">{xp}</p>

            <p className="mt-2 text-xs text-white/40">
              {getDifficultyLabel(difficultyLevel)}
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
              alt="Spørsmål bilde"
              className="mb-8 w-full rounded-2xl border border-white/10 object-cover"
            />
          )}

          {(question.category || question.difficulty) && (
            <p className="mb-4 text-sm text-white/40">
              {question.category}{" "}
              {question.difficulty ? `• ${question.difficulty}` : ""}
            </p>
          )}

          <h2 className="text-3xl font-bold leading-tight">
            {question.question}
          </h2>

          <div className="mt-8 grid gap-4">
            {question.answers.map((answer) => {
              const isCorrect = answer === question.correct_answer;
              const isSelected = selected === answer;

              return (
                <button
                  key={answer}
                  onClick={() => handleAnswer(answer)}
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

          {selected && (
            <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5">
              {selected === question.correct_answer ? (
                <p className="font-bold text-[#3EE6B0]">
                  Riktig. Dette styrker mastery på området.
                </p>
              ) : (
                <div>
                  <p className="font-bold text-red-300">
                    Feil svar registrert som svakhet.
                  </p>

                  <p className="mt-2 text-white/70">
                    Riktig svar:{" "}
                    <span className="font-bold text-[#3EE6B0]">
                      {question.correct_answer}
                    </span>
                  </p>
                </div>
              )}

              <button
                onClick={nextQuestion}
                className="mt-6 w-full rounded-2xl bg-[#3EE6B0] py-4 text-lg font-bold text-[#03120F]"
              >
                Neste spørsmål
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}