export default function OnboardingPage() {
  const cards = [
    {
      emoji: "🚗",
      title: "Bil",
      text: "Klasse B teoriprøve",
    },
    {
      emoji: "🏍️",
      title: "MC",
      text: "Motorsykkel teoriprøve",
    },
    {
      emoji: "🚜",
      title: "Traktor",
      text: "Traktor og landbruk",
    },
  ];

  return (
    <main className="min-h-screen bg-[#0B1020] px-5 py-10 text-white">
      <section className="mx-auto max-w-5xl">
        <p className="text-sm font-bold text-[#3EE6B0]">
          TeoriBoost Setup
        </p>

        <h1 className="mt-3 text-4xl font-extrabold">
          Hva skal du ta teoriprøve for?
        </h1>

        <p className="mt-3 text-[#94A3B8]">
          Vi tilpasser spørsmål, AI-lærer og fokusøkter etter kjøretøyet ditt.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {cards.map((card) => (
            <a
              key={card.title}
              href="/dashboard"
              className="rounded-3xl border border-white/10 bg-[#12182B] p-6 transition hover:border-[#3EE6B0]"
            >
              <div className="text-5xl">{card.emoji}</div>

              <h2 className="mt-5 text-2xl font-bold">
                {card.title}
              </h2>

              <p className="mt-2 text-[#94A3B8]">
                {card.text}
              </p>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}