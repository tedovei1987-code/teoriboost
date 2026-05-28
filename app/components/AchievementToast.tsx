"use client";

import { AchievementRule } from "../lib/achievements";

type Props = {
  achievements: AchievementRule[];
  visible: boolean;
  onClose: () => void;
};

export default function AchievementToast({
  achievements,
  visible,
  onClose,
}: Props) {
  if (!visible || achievements.length === 0) {
    return null;
  }

  const achievement = achievements[0];
  const extraCount = achievements.length - 1;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[calc(100%-3rem)] max-w-md animate-[achievementIn_0.35s_ease-out] rounded-3xl border border-yellow-400/20 bg-[#0B1120]/95 p-5 shadow-2xl shadow-yellow-500/10 backdrop-blur-xl">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/10 text-4xl">
          {achievement.icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-300">
            Achievement unlocked
          </p>

          <h3 className="mt-2 text-2xl font-black text-white">
            {achievement.title}
          </h3>

          <p className="mt-1 text-sm leading-relaxed text-white/60">
            {achievement.description}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <div className="rounded-2xl bg-yellow-400/10 px-4 py-2 text-sm font-black text-yellow-300">
              +{achievement.xp_reward} XP
            </div>

            {extraCount > 0 && (
              <div className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold text-white/70">
                +{extraCount} flere
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-xl text-white/40 transition hover:text-white"
          aria-label="Lukk achievement notification"
        >
          ×
        </button>
      </div>

      <style jsx>{`
        @keyframes achievementIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.96);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}