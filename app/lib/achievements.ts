import { supabase } from "./supabase";

export type AchievementRule = {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  requirement_type: string;
  requirement_value: number;
};

export type MasteryAnswer = {
  category: string | null;
  isCorrect: boolean;
};

export async function updateCategoryMastery(
  userId: string,
  answers: MasteryAnswer[]
) {
  const validAnswers = answers.filter((answer) => answer.category);

  if (validAnswers.length === 0) return;

  const grouped: Record<
    string,
    {
      correct: number;
      wrong: number;
      total: number;
    }
  > = {};

  for (const answer of validAnswers) {
    const category = answer.category as string;

    if (!grouped[category]) {
      grouped[category] = {
        correct: 0,
        wrong: 0,
        total: 0,
      };
    }

    grouped[category].total += 1;

    if (answer.isCorrect) {
      grouped[category].correct += 1;
    } else {
      grouped[category].wrong += 1;
    }
  }

  for (const [category, stats] of Object.entries(grouped)) {
    const { data: existing } = await supabase
      .from("category_mastery")
      .select(
        "id, correct_answers, wrong_answers, total_attempts"
      )
      .eq("user_id", userId)
      .eq("category", category)
      .maybeSingle();

    const previousCorrect = existing?.correct_answers ?? 0;
    const previousWrong = existing?.wrong_answers ?? 0;
    const previousTotal = existing?.total_attempts ?? 0;

    const newCorrect = previousCorrect + stats.correct;
    const newWrong = previousWrong + stats.wrong;
    const newTotal = previousTotal + stats.total;

    const masteryScore =
      newTotal > 0
        ? Math.round((newCorrect / newTotal) * 100)
        : 0;

    if (existing) {
      await supabase
        .from("category_mastery")
        .update({
          correct_answers: newCorrect,
          wrong_answers: newWrong,
          total_attempts: newTotal,
          mastery_score: masteryScore,
          last_activity: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("category_mastery").insert({
        user_id: userId,
        category,
        correct_answers: newCorrect,
        wrong_answers: newWrong,
        total_attempts: newTotal,
        mastery_score: masteryScore,
        last_activity: new Date().toISOString(),
      });
    }
  }
}

export async function checkAndUnlockAchievements(userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, streak")
    .eq("id", userId)
    .single();

  const { data: testResults } = await supabase
    .from("test_results")
    .select("id, score, total_questions")
    .eq("user_id", userId);

  const { data: unlocked } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId);

  const { data: achievements } = await supabase
    .from("achievements")
    .select(
      "id, key, title, description, icon, xp_reward, requirement_type, requirement_value"
    );

  if (!profile || !achievements) return [];

  const unlockedIds = new Set(
    (unlocked ?? []).map((item) => item.achievement_id)
  );

  const testsCompleted = testResults?.length ?? 0;

  const examsPassed =
    testResults?.filter(
      (result) =>
        result.total_questions === 45 && result.score >= 38
    ).length ?? 0;

  const newlyUnlocked: AchievementRule[] = [];

  for (const achievement of achievements as AchievementRule[]) {
    if (unlockedIds.has(achievement.id)) continue;

    let shouldUnlock = false;

    if (achievement.requirement_type === "xp") {
      shouldUnlock =
        (profile.xp ?? 0) >= achievement.requirement_value;
    }

    if (achievement.requirement_type === "streak") {
      shouldUnlock =
        (profile.streak ?? 0) >= achievement.requirement_value;
    }

    if (achievement.requirement_type === "tests_completed") {
      shouldUnlock =
        testsCompleted >= achievement.requirement_value;
    }

    if (achievement.requirement_type === "exam_passed") {
      shouldUnlock =
        examsPassed >= achievement.requirement_value;
    }

    if (shouldUnlock) {
      newlyUnlocked.push(achievement);
    }
  }

  if (newlyUnlocked.length === 0) return [];

  await supabase.from("user_achievements").insert(
    newlyUnlocked.map((achievement) => ({
      user_id: userId,
      achievement_id: achievement.id,
    }))
  );

  const totalReward = newlyUnlocked.reduce(
    (sum, achievement) =>
      sum + (achievement.xp_reward ?? 0),
    0
  );

  if (totalReward > 0) {
    await supabase
      .from("profiles")
      .update({
        xp: (profile.xp ?? 0) + totalReward,
      })
      .eq("id", userId);
  }

  return newlyUnlocked;
}