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
            href="/login"
            className="rounded-2xl bg-[#3EE6B0] px-8 py-4 font-bold text-[#0B1020]"
          >
            Start gratis
          </a>

          <a
            href="/pricing"
            className="rounded-2xl border border-white/10 px-8 py-4 font-bold"
          >
            Se Premium
          </a>
        </div>
      </section>
    </main>
  );
}