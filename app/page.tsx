export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0B1020] text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-5 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#3EE6B0]">
          TeoriBoost
        </p>

        <h1 className="mt-6 max-w-4xl text-5xl font-extrabold leading-tight md:text-7xl">
          Bestå teoriprøven smartere med AI.
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-[#94A3B8]">
          Tren med fokusøkter, eksamenstester, XP-system og AI-lærer bygget for
          norske teoriprøver.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="/pricing"
            className="rounded-2xl bg-[#3EE6B0] px-8 py-4 font-bold text-[#0B1020] transition hover:scale-[1.02]"
          >
            Start nå
          </a>

          <a
            href="/pricing"
            className="rounded-2xl border border-white/10 px-8 py-4 font-bold transition hover:bg-white/5"
          >
            Se Premium
          </a>

          <a
            href="/login"
            className="rounded-2xl border border-[#3EE6B0]/20 bg-[#3EE6B0]/10 px-8 py-4 font-bold text-[#3EE6B0] transition hover:bg-[#3EE6B0]/20"
          >
            Logg inn
          </a>
        </div>

        <div className="mt-20 grid max-w-5xl gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-left">
            <div className="text-4xl">🧠</div>

            <h2 className="mt-5 text-2xl font-black">
              AI Coach
            </h2>

            <p className="mt-3 text-[#94A3B8]">
              Personlig analyse av svake områder og anbefalt trening.
            </p>
          </div>

          <div className="rounded-3xl border border-[#3EE6B0]/20 bg-[#3EE6B0]/10 p-8 text-left">
            <div className="text-4xl">🔥</div>

            <h2 className="mt-5 text-2xl font-black">
              Gamification
            </h2>

            <p className="mt-3 text-[#94A3B8]">
              XP, streaks, achievements og leaderboard holder motivasjonen oppe.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-left">
            <div className="text-4xl">🎯</div>

            <h2 className="mt-5 text-2xl font-black">
              Eksamensmodus
            </h2>

            <p className="mt-3 text-[#94A3B8]">
              Realistiske teoriprøver med ekte eksamensfølelse.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}