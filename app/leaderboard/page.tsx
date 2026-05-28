"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { THEORY_LABELS } from "../lib/theoryTypes";

type LeaderboardUser = {
  id: string;
  xp: number;
  streak: number;
  theory_type: string | null;
};

type UserAchievement = {
  user_id: string;
};

type RankedUser = {
  id: string;
  xp: number;
  streak: number;
  theory_type: string | null;
  achievements: number;
  isCurrentUser: boolean;
  rank: number;
};

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<RankedUser[]>([]);
  const [selectedTheory, setSelectedTheory] = useState("ALL");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  async function loadLeaderboard() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setCurrentUserId(user.id);

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, xp, streak, theory_type")
        .order("xp", { ascending: false })
        .limit(100);

      if (profileError) {
        console.log("LEADERBOARD PROFILE ERROR:", profileError);
        setUsers([]);
        setLoading(false);
        return;
      }

      const { data: achievementData, error: achievementError } =
        await supabase
          .from("user_achievements")
          .select("user_id");

      if (achievementError) {
        console.log(
          "LEADERBOARD ACHIEVEMENT ERROR:",
          achievementError
        );
      }

      const achievementCounts: Record<string, number> = {};

      (achievementData as UserAchievement[] | null)?.forEach((item) => {
        achievementCounts[item.user_id] =
          (achievementCounts[item.user_id] || 0) + 1;
      });

      const rankedUsers: RankedUser[] = (
        (profiles as LeaderboardUser[] | null) ?? []
      ).map((profile, index) => ({
        id: profile.id,
        xp: profile.xp ?? 0,
        streak: profile.streak ?? 0,
        theory_type: profile.theory_type,
        achievements: achievementCounts[profile.id] || 0,
        isCurrentUser: profile.id === user.id,
        rank: index + 1,
      }));

      setUsers(rankedUsers);
    } catch (error) {
      console.log("LEADERBOARD ERROR:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = useMemo(() => {
    if (selectedTheory === "ALL") {
      return users;
    }

    return users.filter(
      (user) => user.theory_type === selectedTheory
    );
  }, [users, selectedTheory]);

  const podium = filteredUsers.slice(0, 3);
  const leaderboardList = filteredUsers.slice(3);

  const currentUser = filteredUsers.find(
    (user) => user.isCurrentUser
  );

  function getTheoryLabel(theory: string | null) {
    if (!theory) return "Ingen teori";

    return THEORY_LABELS[theory] ?? theory;
  }

  function getRankColor(rank: number) {
    if (rank === 1) return "text-yellow-300";
    if (rank === 2) return "text-zinc-300";
    if (rank === 3) return "text-orange-300";

    return "text-white";
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        Laster leaderboard...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] px-6 py-10 text-white">
      <section className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-bold uppercase tracking-[0.3em] text-[#39FFB6]">
              Leaderboard
            </p>

            <h1 className="mt-3 text-5xl font-black">
              Toppliste
            </h1>

            <p className="mt-4 max-w-2xl text-lg text-white/60">
              Konkurrer mot andre TeoriBoost-brukere basert på XP,
              streaks og achievements.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={selectedTheory}
              onChange={(e) =>
                setSelectedTheory(e.target.value)
              }
              className="rounded-2xl border border-white/10 bg-[#071028] px-5 py-4 font-bold text-white outline-none"
            >
              <option value="ALL">
                Alle teorier
              </option>

              {Object.entries(THEORY_LABELS).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>

            <a
              href="/dashboard"
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-bold text-white hover:border-[#39FFB6]/50"
            >
              Dashboard
            </a>
          </div>
        </div>

        {currentUser && (
          <div className="mb-10 rounded-3xl border border-[#39FFB6]/20 bg-gradient-to-br from-[#39FFB6]/10 to-cyan-500/10 p-8">
            <p className="font-bold uppercase tracking-[0.25em] text-[#39FFB6]">
              Din plassering
            </p>

            <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-5xl font-black">
                  #{currentUser.rank}
                </h2>

                <p className="mt-3 text-lg text-white/60">
                  {getTheoryLabel(currentUser.theory_type)}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-6 py-5">
                  <p className="text-sm text-white/50">
                    XP
                  </p>

                  <p className="mt-2 text-3xl font-black text-[#39FFB6]">
                    {currentUser.xp}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-6 py-5">
                  <p className="text-sm text-white/50">
                    Streak
                  </p>

                  <p className="mt-2 text-3xl font-black">
                    🔥 {currentUser.streak}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-6 py-5">
                  <p className="text-sm text-white/50">
                    Achievements
                  </p>

                  <p className="mt-2 text-3xl font-black text-yellow-300">
                    {currentUser.achievements}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-10 grid gap-6 lg:grid-cols-3">
          {podium.map((user) => (
            <div
              key={user.id}
              className={`rounded-3xl border p-8 ${
                user.rank === 1
                  ? "border-yellow-400/30 bg-yellow-400/10"
                  : user.rank === 2
                  ? "border-zinc-300/20 bg-zinc-300/10"
                  : "border-orange-400/20 bg-orange-400/10"
              }`}
            >
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-white/50">
                #{user.rank}
              </p>

              <h2
                className={`mt-4 text-5xl font-black ${getRankColor(
                  user.rank
                )}`}
              >
                {user.rank === 1
                  ? "🥇"
                  : user.rank === 2
                  ? "🥈"
                  : "🥉"}
              </h2>

              <p className="mt-5 text-xl font-black">
                {getTheoryLabel(user.theory_type)}
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">
                    XP
                  </span>

                  <span className="font-black text-[#39FFB6]">
                    {user.xp}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-white/60">
                    Streak
                  </span>

                  <span className="font-black">
                    🔥 {user.streak}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-white/60">
                    Achievements
                  </span>

                  <span className="font-black text-yellow-300">
                    {user.achievements}
                  </span>
                </div>
              </div>

              {user.isCurrentUser && (
                <div className="mt-6 inline-flex rounded-2xl bg-[#39FFB6]/10 px-4 py-2 text-sm font-bold text-[#39FFB6]">
                  Dette er deg
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#071028] p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-white/50">
                Global ranking
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Top 100
              </h2>
            </div>

            <div className="rounded-2xl bg-white/5 px-4 py-2 text-sm text-white/50">
              {filteredUsers.length} brukere
            </div>
          </div>

          <div className="space-y-4">
            {leaderboardList.map((user) => (
              <div
                key={user.id}
                className={`rounded-2xl border p-5 ${
                  user.isCurrentUser
                    ? "border-[#39FFB6]/30 bg-[#39FFB6]/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-5">
                    <div
                      className={`text-3xl font-black ${getRankColor(
                        user.rank
                      )}`}
                    >
                      #{user.rank}
                    </div>

                    <div>
                      <p className="text-xl font-black">
                        {getTheoryLabel(user.theory_type)}
                      </p>

                      <p className="mt-1 text-sm text-white/50">
                        {user.isCurrentUser
                          ? "Din konto"
                          : "TeoriBoost bruker"}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-black/20 px-5 py-4">
                      <p className="text-xs text-white/40">
                        XP
                      </p>

                      <p className="mt-2 text-2xl font-black text-[#39FFB6]">
                        {user.xp}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/20 px-5 py-4">
                      <p className="text-xs text-white/40">
                        Streak
                      </p>

                      <p className="mt-2 text-2xl font-black">
                        🔥 {user.streak}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/20 px-5 py-4">
                      <p className="text-xs text-white/40">
                        Achievements
                      </p>

                      <p className="mt-2 text-2xl font-black text-yellow-300">
                        {user.achievements}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}