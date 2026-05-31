"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import {
  getActiveSubscription,
  hasPremiumAccess,
} from "../lib/subscription";

const ranks = [
  { name: "Ny sjåfør", minXp: 0 },
  { name: "Lærling", minXp: 100 },
  { name: "Trafikkhelt", minXp: 250 },
  { name: "Veimester", minXp: 500 },
  { name: "TeoriNinja", minXp: 1000 },
  { name: "TeoriBoss", minXp: 2500 },
  { name: "TeoriMaster", minXp: 5000 },
  { name: "TeoriLegend", minXp: 10000 },
  { name: "TeoriGud", minXp: 25000 },
];
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

type TestResult = {
  id: string;
  score: number;
  total_questions: number;
  xp_earned: number;
  created_at: string;
};

type WrongAnswer = {
  id: string;
  category: string | null;
};

type WeakCategory = {
  category: string;
  count: number;
};

type Achievement = {
  
  id: string;
  unlocked_at: string;
  achievements: {
    title: string;
    description: string;
    icon: string;
    xp_reward: number;
  } | null;
};
type AchievementWithProgress = {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  requirement_type: string;
  requirement_value: number;
  progress: number;
  unlocked: boolean;
};

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [theoryType, setTheoryType] = useState<string | null>(null);
  const [plan, setPlan] = useState("Ingen plan");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [weakCategories, setWeakCategories] = useState<WeakCategory[]>([]);
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState("");
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [allAchievements, setAllAchievements] = useState<any[]>([]);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    getUserData();
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

    setTimeUntilNext(
      `${hours.toString().padStart(2, "0")}t ${minutes
        .toString()
        .padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`
    );
  }

  function getRank(currentXp: number) {
    let currentRank = ranks[0];
    let nextRank = ranks[1];

    for (let i = 0; i < ranks.length; i++) {
      if (currentXp >= ranks[i].minXp) {
        currentRank = ranks[i];
        nextRank = ranks[i + 1];
      }
    }

    return { currentRank, nextRank };
  }

  function getProgressPercent(currentXp: number) {
    const { currentRank, nextRank } = getRank(currentXp);

    if (!nextRank) return 100;

    const progress =
      ((currentXp - currentRank.minXp) /
        (nextRank.minXp - currentRank.minXp)) *
      100;

    return Math.min(Math.max(progress, 0), 100);
  }
function getAchievementProgress(achievement: any) {
  if (achievement.requirement_type === "xp") {
    return Math.min(Math.round((xp / achievement.requirement_value) * 100), 100);
  }

  if (achievement.requirement_type === "streak") {
    return Math.min(
      Math.round((streak / achievement.requirement_value) * 100),
      100
    );
  }

  if (achievement.requirement_type === "tests_completed") {
    return Math.min(
      Math.round((testResults.length / achievement.requirement_value) * 100),
      100
    );
  }
if (achievement.requirement_type === "exam_passed") {
  const passedExams = testResults.filter(
    (result) =>
      result.total_questions === 45 &&
      result.score >= 38
  ).length;

  return Math.min(
    Math.round(
      (passedExams / achievement.requirement_value) * 100
    ),
    100
  );
}
  return 0;
}
  function formatDate(date: string | null) {
    if (!date) return "Ingen aktiv utløpsdato";

    return new Date(date).toLocaleDateString("no-NO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function buildWeakCategories(wrongAnswers: WrongAnswer[]) {
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
      .slice(0, 5);
  }

  function getAverageScore(results: TestResult[]) {
    if (results.length === 0) return 0;

    const totalPercent = results.reduce((sum, result) => {
      if (result.total_questions === 0) return sum;

      return sum + (result.score / result.total_questions) * 100;
    }, 0);

    return Math.round(totalPercent / results.length);
  }

  function getExamReadiness() {
    const averageScore = getAverageScore(testResults);
    const weakPenalty = Math.min(weakCategories.length * 5, 25);
    const streakBonus = Math.min(streak * 2, 10);
    const resultVolumeBonus = Math.min(testResults.length * 3, 15);

    const readiness =
      averageScore + streakBonus + resultVolumeBonus - weakPenalty;

    return Math.min(Math.max(Math.round(readiness), 0), 100);
  }

  function getReadinessLabel(readiness: number) {
    if (readiness >= 85) return "Klar for eksamenstest";
    if (readiness >= 65) return "Nærmer deg klar";
    if (readiness >= 40) return "Trenger mer målrettet trening";

    return "Start med grunntrening";
  }

  function getReadinessColor(readiness: number) {
    if (readiness >= 85) return "text-[#39FFB6]";
    if (readiness >= 65) return "text-yellow-300";
    if (readiness >= 40) return "text-orange-300";

    return "text-[#FF4D6D]";
  }

  function getSmartRecommendation() {
    const currentTheory = theoryType
      ? theoryLabels[theoryType] ?? theoryType
      : "valgt teori";

    if (testResults.length === 0) {
      return `Start med en vanlig test for ${currentTheory}. Etterpå kan TeoriBoost analysere feilene dine og lage en smartere treningsplan.`;
    }

    if (weakCategories.length > 0) {
      return `Neste beste steg er å trene på ${weakCategories[0].category}. Dette er området som går mest igjen i feilene dine for ${currentTheory}.`;
    }

    if (getExamReadiness() >= 85) {
      return "Du ser klar ut for eksamenstrening. Kjør en eksamenstest for å sjekke stabiliteten under press.";
    }

    return "Fortsett med adaptive tester for å bygge mer stabil progresjon før eksamenstest.";
  }

  async function getUserData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    setEmail(user.email || "");

    let { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      const { data: newProfile } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          xp: 0,
          streak: 0,
          theory_type: null,
        })
        .select()
        .single();

      profile = newProfile;
    }

    if (!profile?.theory_type) {
      window.location.href = "/choose-theory";
      return;
    }

    setTheoryType(profile.theory_type);
    setXp(profile.xp ?? 0);
    setStreak(profile.streak ?? 0);

    const subscription = await getActiveSubscription(user.id);

    if (subscription) {
  setPlan(subscription.plan);
  setExpiresAt(subscription.expires_at);
  setIsPremium(hasPremiumAccess(subscription.plan));
} else {
  setPlan("Ingen plan");
  setExpiresAt(null);
  setIsPremium(false);
}

    const { data: results, error: resultsError } = await supabase
      .from("test_results")
      .select("id, score, total_questions, xp_earned, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (resultsError) {
      console.log("TEST RESULTS ERROR:", resultsError);
      setTestResults([]);
    } else {
      setTestResults(results ?? []);
    }

    const { data: wrongAnswers, error: wrongAnswersError } = await supabase
      .from("wrong_answers")
      .select("id, category")
      .eq("user_id", user.id);

    if (wrongAnswersError) {
      console.log("WRONG ANSWERS ERROR:", wrongAnswersError);
      setWeakCategories([]);
    } else {
      setWeakCategories(buildWeakCategories(wrongAnswers ?? []));
    }

    const today = new Date().toISOString().split("T")[0];

    const { data: dailyResult } = await supabase
      .from("daily_challenge_results")
      .select("id")
      .eq("user_id", user.id)
      .eq("challenge_date", today)
      .maybeSingle();

    setDailyCompleted(!!dailyResult);

    const { data: unlockedAchievements, error: achievementsError } =
      await supabase
        .from("user_achievements")
        .select(`
          id,
          unlocked_at,
          achievements (
            title,
            description,
            icon,
            xp_reward
          )
        `)
        .eq("user_id", user.id)
        .order("unlocked_at", { ascending: false });

    if (achievementsError) {
      console.log("ACHIEVEMENTS ERROR:", achievementsError);
      setAchievements([]);
    } else {
      const normalizedAchievements = (unlockedAchievements ?? []).map(
        (item: any) => ({
          id: item.id,
          unlocked_at: item.unlocked_at,
          achievements: Array.isArray(item.achievements)
            ? item.achievements[0] ?? null
            : item.achievements,
        })
      );

      setAchievements(normalizedAchievements);
      const { data: allAchievementsData, error: allAchievementsError } =
  await supabase
    .from("achievements")
    .select("*")
    .order("requirement_value", { ascending: true });

if (allAchievementsError) {
  console.log("ALL ACHIEVEMENTS ERROR:", allAchievementsError);
  setAllAchievements([]);
} else {
  setAllAchievements(allAchievementsData ?? []);
}
    }

    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

const { currentRank, nextRank } = getRank(xp);
const progressPercent = getProgressPercent(xp);


  const latestResult = testResults[0];
  const recentResults = testResults.slice(0, 5);
  const maxWeakCount = weakCategories[0]?.count ?? 1;
  const weakestCategory = weakCategories[0];
  const averageScore = getAverageScore(testResults);
  const examReadiness = getExamReadiness();
  const unlockedAchievementTitles = new Set(
  achievements
    .map((item) => item.achievements?.title)
    .filter(Boolean)
);

const achievementProgress = allAchievements.map((achievement) => ({
  ...achievement,
  progress: getAchievementProgress(achievement),
  unlocked: unlockedAchievementTitles.has(achievement.title),
}));

  const activeTheoryLabel = theoryType
    ? theoryLabels[theoryType] ?? theoryType
    : "Ikke valgt";

  const weakTrainingUrl = weakestCategory
  ? `/weak-test?category=${encodeURIComponent(
      weakestCategory.category
    )}`
  : "/weak-test";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        Laster dashboard...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] p-6 text-white md:p-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="mb-2 font-bold uppercase tracking-[0.3em] text-[#39FFB6]">
              Dashboard
            </p>

            <h1 className="text-4xl font-black leading-tight md:text-5xl">
              Velkommen til TeoriBoost
            </h1>

            <p className="mt-4 text-lg text-white/70">
              Innlogget som: {email}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-[#39FFB6]/30 bg-[#39FFB6]/10 px-5 py-3">
                <p className="text-xs font-bold uppercase tracking-widest text-[#39FFB6]">
                  Valgt teori
                </p>
                <p className="mt-1 text-xl font-black">{activeTheoryLabel}</p>
              </div>

              <a
                href="/choose-theory"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white hover:border-[#39FFB6]/50"
              >
                Bytt teori
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="/ai-coach"
              className="rounded-2xl bg-[#39FFB6] px-6 py-4 text-center font-bold text-[#03120F] hover:bg-[#2edfa3]"
            >
              Åpne AI-Malin
            </a>

            <button
              onClick={logout}
              className="rounded-2xl border border-white/10 px-6 py-4 font-bold text-[#FF4D6D] hover:bg-white/5"
            >
              Logg ut
            </button>
          </div>
        </div>

        <div className="mb-8 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-[#39FFB6]/20 bg-gradient-to-br from-[#39FFB6]/10 to-cyan-500/10 p-8">
            <p className="font-bold uppercase tracking-widest text-[#39FFB6]">
              Smart anbefaling
            </p>

            <h2 className="mt-4 text-4xl font-black">
              {weakestCategory
                ? `Tren ${weakestCategory.category} nå`
                : `Start første test for ${activeTheoryLabel}`}
            </h2>

            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/70">
              {getSmartRecommendation()}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <a
                href={isPremium ? weakTrainingUrl : "/pricing?reason=premium-required"}
                className="rounded-2xl bg-[#39FFB6] px-6 py-4 text-center font-black text-[#03120F] hover:bg-[#2edfa3]"
              >
                {weakestCategory ? "Tren svakeste område" : "Start test"}
              </a>

              <a
                href={isPremium ? "/exam" : "/pricing?reason=premium-required"}
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center font-bold text-white hover:border-pink-400/50"
              >
                Eksamenstest
              </a>

              <a
                href={isPremium ? "/ai-coach" : "/pricing?reason=premium-required"}
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center font-bold text-white hover:border-[#39FFB6]/50"
              >
                AI-Malin
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-400/20 bg-[#071028] p-8">
            <p className="text-white/60">Eksamensklar</p>

            <h2 className={`mt-4 text-6xl font-black ${getReadinessColor(examReadiness)}`}>
              {examReadiness}%
            </h2>

            <p className="mt-3 text-white/60">
              {getReadinessLabel(examReadiness)}
            </p>

            <div className="mt-6 h-3 rounded-full bg-white/10">
              <div
                className="h-3 rounded-full bg-[#39FFB6]"
                style={{ width: `${examReadiness}%` }}
              />
            </div>

            <p className="mt-4 text-sm text-white/40">
              Basert på score, testmengde, streak og svake områder.
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-[#39FFB6]/20 bg-gradient-to-br from-[#39FFB6]/10 to-cyan-500/10 p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-bold uppercase tracking-widest text-[#39FFB6]">
                Daily Challenge
              </p>

              <h2 className="mt-4 text-4xl font-black">
                {dailyCompleted
                  ? "Du har fullført dagens challenge 🔥"
                  : "Klar for dagens challenge?"}
              </h2>

              <p className="mt-4 max-w-2xl text-lg text-white/70">
                Fullfør 5 spørsmål hver dag for bonus XP, streaks og raskere
                progresjon.
              </p>

              <div className="mt-6 flex flex-wrap gap-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-3">
                  <p className="text-sm text-white/50">Bonus</p>
                  <p className="mt-1 text-2xl font-black text-[#39FFB6]">
                    +50 XP
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-3">
                  <p className="text-sm text-white/50">Neste challenge</p>
                  <p className="mt-1 text-2xl font-black">{timeUntilNext}</p>
                </div>
              </div>
            </div>

            <a
              href="/daily-challenge"
              className="inline-flex items-center justify-center rounded-3xl bg-[#39FFB6] px-10 py-6 text-xl font-black text-[#03120F] transition hover:scale-[1.03]"
            >
              {dailyCompleted
                ? "Se dagens challenge"
                : "Start Daily Challenge"}
            </a>
          </div>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-[#39FFB6]/20 bg-[#071028] p-8">
  <p className="text-white/60">Rank</p>

  <h2 className="mt-4 text-4xl font-black text-[#39FFB6]">
    {currentRank.name}
  </h2>

  <div className="mt-5 h-3 rounded-full bg-white/10">
    <div
      className="h-3 rounded-full bg-[#39FFB6]"
      style={{ width: `${progressPercent}%` }}
    />
  </div>

  <p className="mt-3 text-sm text-white/50">
    {nextRank
      ? `${xp} XP · Neste Rank: ${nextRank.name}`
      : `${xp} XP · Maks Rank nådd`}
  </p>
</div>

          <div className="rounded-3xl border border-purple-400/20 bg-[#071028] p-8">
            <p className="text-white/60">Aktiv plan</p>

            <h2 className="mt-4 text-5xl font-black">{plan}</h2>

            <p className="mt-4 text-sm text-white/50">
              Utløper: {formatDate(expiresAt)}
            </p>
          </div>

          <div className="rounded-3xl border border-orange-400/20 bg-[#071028] p-8">
            <p className="text-white/60">Streak</p>

            <h2 className="mt-4 text-5xl font-black">🔥 {streak}</h2>

            <p className="mt-3 text-sm text-white/40">Dager på rad.</p>
          </div>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-[#071028] p-8">
            <p className="text-white/60">Tester fullført</p>

            <h2 className="mt-4 text-5xl font-black text-[#39FFB6]">
              {testResults.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#071028] p-8">
            <p className="text-white/60">Snittscore</p>

            <h2 className="mt-4 text-5xl font-black">
              {averageScore}%
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#071028] p-8">
            <p className="text-white/60">Siste score</p>

            <h2 className="mt-4 text-5xl font-black">
              {latestResult
                ? `${latestResult.score} / ${latestResult.total_questions}`
                : "—"}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#071028] p-8">
            <p className="text-white/60">Siste XP</p>

            <h2 className="mt-4 text-5xl font-black text-[#39FFB6]">
              {latestResult ? `${latestResult.xp_earned} XP` : "—"}
            </h2>
          </div>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-[#FF4D6D]/20 bg-[#071028] p-8">
            <div className="mb-6">
              <p className="text-white/60">Analyse</p>

              <h2 className="mt-2 text-3xl font-black">Svake områder</h2>

              <p className="mt-2 text-sm text-white/50">
                Klikk på en kategori for å trene på svake områder.
              </p>
            </div>

            {weakCategories.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="font-bold text-[#39FFB6]">
                  Ingen svake områder registrert
                </p>

                <p className="mt-2 text-white/50">
                  Når du svarer feil på spørsmål, dukker kategoriene opp her.
                </p>

                <a
                  href="/test"
                  className="mt-5 inline-block rounded-2xl bg-[#39FFB6] px-6 py-3 font-bold text-[#03120F]"
                >
                  Start første test
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {weakCategories.map((item) => (
                  <a
                    key={item.category}
                    href={`/test?category=${encodeURIComponent(
                      item.category
                    )}&adaptive=true`}
                    className="block rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-[#FF4D6D]/50 hover:bg-[#FF4D6D]/10"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-lg font-black">{item.category}</p>

                        <p className="mt-1 text-sm text-white/50">
                          {item.count} feil registrert
                        </p>
                      </div>

                      <div className="text-2xl">⚠️</div>
                    </div>

                    <div className="mt-4 h-3 rounded-full bg-white/10">
                      <div
                        className="h-3 rounded-full bg-[#FF4D6D]"
                        style={{
                          width: `${Math.max(
                            (item.count / maxWeakCount) * 100,
                            12
                          )}%`,
                        }}
                      />
                    </div>

                    <p className="mt-3 text-sm font-bold text-red-200">
                      Tren denne kategorien
                    </p>
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#071028] p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-white/60">Historikk</p>

                <h2 className="mt-2 text-3xl font-black">Siste tester</h2>
              </div>

              <div className="rounded-2xl bg-white/5 px-4 py-2 text-sm text-white/50">
                {recentResults.length} resultater
              </div>
            </div>

            {recentResults.length === 0 ? (
              <p className="text-white/50">Ingen tester fullført ennå.</p>
            ) : (
              <div className="space-y-4">
                {recentResults.map((result, index) => {
                  const percent =
                    result.total_questions > 0
                      ? Math.round(
                          (result.score / result.total_questions) * 100
                        )
                      : 0;

                  return (
                    <div
                      key={result.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-5"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-[#39FFB6]">
                            Test #{testResults.length - index}
                          </p>

                          <p className="mt-1 text-white/60">
                            {formatDate(result.created_at)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-black">
                            {result.score} / {result.total_questions}
                          </p>

                          <p className="mt-1 text-[#39FFB6]">
                            +{result.xp_earned} XP
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 h-3 rounded-full bg-white/10">
                        <div
                          className="h-3 rounded-full bg-[#39FFB6]"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-yellow-400/20 bg-gradient-to-br from-yellow-400/10 to-orange-500/10 p-8">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-bold uppercase tracking-widest text-yellow-300">
                Achievements
              </p>

              <h2 className="mt-2 text-3xl font-black">Badges & Rewards</h2>

              <p className="mt-2 text-white/60">
                Lås opp badges ved å fullføre tester, bygge streaks og tjene XP.
              </p>
            </div>

            <div className="rounded-2xl border border-yellow-400/20 bg-black/20 px-5 py-3">
              <p className="text-sm text-white/50">Unlocked</p>

              <p className="mt-1 text-3xl font-black text-yellow-300">
                {achievements.length}
              </p>
            </div>
          </div>

          {achievements.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
              <p className="text-xl font-black text-yellow-300">
                Ingen badges unlocked ennå
              </p>

              <p className="mt-2 text-white/60">
                Fullfør din første test eller Daily Challenge for å begynne å
                samle achievements.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {achievementProgress.slice(0, 6).map((achievement) => (
                <div
                  key={achievement.id}
                  className="rounded-3xl border border-yellow-400/20 bg-black/20 p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="text-5xl">
                      <div className="text-5xl">
  {achievement.icon ?? "🏅"}
</div>
                    </div>

                    <div className="rounded-2xl bg-yellow-400/10 px-4 py-2 text-sm font-bold text-yellow-300">
                      +{achievement.xp_reward ?? 0} XP
                    </div>
                  </div>

                  <h3 className="mt-6 text-2xl font-black">
                    {achievement.title}
                  </h3>

                  <p className="mt-3 text-white/60">
                    {achievement.description}
                  </p>
<div className="mt-4">
  <div className="h-2 rounded-full bg-white/10">
    <div
      className={`h-2 rounded-full ${
        achievement.unlocked
          ? "bg-yellow-300"
          : "bg-[#39FFB6]"
      }`}
      style={{ width: `${achievement.progress}%` }}
    />
  </div>

  <p className="mt-2 text-xs text-white/50">
    {achievement.unlocked
      ? "Achievement unlocked"
      : `${achievement.progress}% fullført`}
  </p>
</div>

                </div>
              ))}
            </div>
          )}
        </div>

        {plan === "Ingen plan" && (
          <div className="mb-8 rounded-3xl border border-[#39FFB6]/20 bg-[#39FFB6]/10 p-8">
            <h2 className="text-3xl font-black">Du har ingen aktiv plan</h2>

            <p className="mt-3 text-white/70">
              Kjøp tilgang for å åpne teoritesten.
            </p>

            <a
              href="/pricing"
              className="mt-6 inline-block rounded-2xl bg-[#39FFB6] px-8 py-4 font-bold text-[#03120F]"
            >
              Velg tilgang
            </a>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <a
            href="/test"
            className="group rounded-3xl border border-cyan-400/20 bg-[#071028] p-10 text-left transition hover:scale-[1.02] hover:border-cyan-400/50"
          >
            <div className="text-5xl transition group-hover:scale-110">⚡</div>

            <h3 className="mt-6 text-3xl font-black">Start test</h3>

            <p className="mt-3 text-white/60">
              Start en ny teoriprøve for {activeTheoryLabel}.
            </p>

            <div className="mt-6 inline-flex rounded-2xl bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-300">
              Tren nå
            </div>
          </a>

          <a
            href={isPremium ? weakTrainingUrl : "/pricing?reason=premium-required"}
            className="group rounded-3xl border border-[#FF4D6D]/20 bg-[#071028] p-10 text-left transition hover:scale-[1.02] hover:border-[#FF4D6D]/50"
          >
            <div className="text-5xl transition group-hover:scale-110">🎯</div>

            <h3 className="mt-6 text-3xl font-black">Test på svake områder</h3>

            <p className="mt-3 text-white/60">
              {weakestCategory
                ? `Fokuser på ${weakestCategory.category} for å forbedre resultatene dine.`
                : "Starter en smart test til vi finner områder du bør fokusere på."}
              </p>

            <div className="mt-6 inline-flex rounded-2xl bg-red-400/10 px-4 py-2 text-sm font-bold text-red-300">
              Smart fokus
            </div>
          </a>

          <a
            href="/exam"
            className="group rounded-3xl border border-pink-400/20 bg-[#071028] p-10 text-left transition hover:scale-[1.02] hover:border-pink-400/50"
          >
            <div className="text-5xl transition group-hover:scale-110">🧪</div>

            <h3 className="mt-6 text-3xl font-black">Eksamenstest</h3>

            <p className="mt-3 text-white/60">
              Simuler ekte teoriprøve med press og full scoreanalyse.
            </p>

            <div className="mt-6 inline-flex rounded-2xl bg-pink-400/10 px-4 py-2 text-sm font-bold text-pink-300">
              Eksamensmodus
            </div>
          </a>

          <a
            href="/daily-challenge"
            className="group rounded-3xl border border-[#39FFB6]/20 bg-gradient-to-br from-[#39FFB6]/10 to-cyan-500/10 p-10 text-left transition hover:scale-[1.02] hover:border-[#39FFB6]/60"
          >
            <div className="text-5xl transition group-hover:scale-110">🔥</div>

            <h3 className="mt-6 text-3xl font-black">Daily Challenge</h3>

            <p className="mt-3 text-white/60">
              Fullfør dagens challenge for bonus XP og streak.
            </p>

            <div className="mt-6 inline-flex rounded-2xl bg-[#39FFB6]/10 px-4 py-2 text-sm font-bold text-[#39FFB6]">
              +50 XP bonus
            </div>
          </a>

          <a
            href="/leaderboard"
            className="group rounded-3xl border border-yellow-400/20 bg-[#071028] p-10 text-left transition hover:scale-[1.02] hover:border-yellow-400/50"
          >
            <div className="text-5xl transition group-hover:scale-110">🏆</div>

            <h3 className="mt-6 text-3xl font-black">Leaderboard</h3>

            <p className="mt-3 text-white/60">
              Se hvem som leder TeoriBoost-rankingene.
            </p>

            <div className="mt-6 inline-flex rounded-2xl bg-yellow-400/10 px-4 py-2 text-sm font-bold text-yellow-300">
              Konkurrer nasjonalt
            </div>
          </a>

          <a
            href={isPremium ? "/ai-coach" : "/pricing?reason=premium-required"}
            className="group rounded-3xl border border-[#39FFB6]/20 bg-[#39FFB6]/10 p-10 text-left transition hover:scale-[1.02] hover:border-[#39FFB6]/60"
          >
            <div className="text-5xl transition group-hover:scale-110">🧠</div>

            <h3 className="mt-6 text-3xl font-black">AI-Malin</h3>

            <p className="mt-3 text-white/60">
              {weakestCategory
                ? `Fokus: ${weakestCategory.category}`
                : "Analyserer feilene dine"}
            </p>

            <div className="mt-6 inline-flex rounded-2xl bg-[#39FFB6]/10 px-4 py-2 text-sm font-bold text-[#39FFB6]">
              Smart analyse
            </div>
          </a>
        </div>
      </section>
    </main>
  );
}