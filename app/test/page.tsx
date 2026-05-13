export default function TestPage() {
  const answers = [
    "Du skal vike for trafikk fra høyre",
    "Du har alltid forkjørsrett",
    "Du skal stoppe i alle kryss",
  ];

  return (
    <main className="min-h-screen bg-[#0B1020] px-5 py-10 text-white">
      <section className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-white/10 bg-[#12182B] p-8">
          <p className="text-sm font-bold text-[#3EE6B0]">
            Spørsmål 1 av 10
          </p>

          <h1 className="mt-5 text-3xl font-extrabold">
            Hva betyr høyre-regelen?
          </h1>

          <div className="mt-8 space-y-4">
            {answers.map((answer) => (
              <button
                key={answer}
                className="w-full rounded-2xl border border-white/10 bg-[#0B1020] p-5 text-left font-semibold transition hover:border-[#3EE6B0]"
              >
                {answer}
              </button>
            ))}
          </div>

          <button className="mt-8 rounded-xl bg-[#3EE6B0] px-5 py-3 font-bold text-[#0B1020]">
            Neste spørsmål
          </button>
        </div>
      </section>
    </main>
  );
}