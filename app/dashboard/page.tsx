export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#0B1020] px-5 py-10 text-white">
      <section className="mx-auto max-w-6xl">
        <p className="text-sm font-bold text-[#3EE6B0]">Dashboard</p>

        <h1 className="mt-3 text-4xl font-extrabold">
          Du er 72% klar for teoriprøven
        </h1>

        <p className="mt-3 text-[#94A3B8]">
          AI-en anbefaler en kort økt med vikeplikt i dag.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-[#12182B] p-6">
            <p className="text-sm text-[#94A3B8]">Rank 1</p>
            <h2 className="mt-2 text-2xl font-bold">🚶 Fotgjenger</h2>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[35%] rounded-full bg-[#3EE6B0]" />
            </div>
            <p className="mt-3 text-sm text-[#94A3B8]">35 XP til Trafikant</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#12182B] p-6">
            <p className="text-sm text-[#94A3B8]">Dagens mål</p>
            <h2 className="mt-2 text-2xl font-bold">15 spørsmål igjen</h2>

            <a
              href="/test"
              className="mt-6 inline-block rounded-xl bg-[#3EE6B0] px-5 py-3 font-bold text-[#0B1020]"
            >
              Start hurtigøkt
            </a>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {["⚡ Hurtigøkt", "📚 Fokusøkt", "🏁 Eksamenstest", "🧠 AI Tutor"].map(
            (item) => (
              <a
                key={item}
                href="/test"
                className="rounded-2xl border border-white/10 bg-[#12182B] p-5 font-semibold hover:border-[#3EE6B0]"
              >
                {item}
              </a>
            )
          )}
        </div>
      </section>
    </main>
  );
}