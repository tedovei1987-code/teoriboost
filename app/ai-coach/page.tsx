"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getActiveSubscription } from "../lib/subscription";

type WrongAnswer = {
  category: string | null;
};

type WeakCategory = {
  category: string;
  count: number;
};

export default function AiCoachPage() {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [weakCategories, setWeakCategories] = useState<WeakCategory[]>([]);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
const [malinMessage, setMalinMessage] = useState("");
const [malinReplies, setMalinReplies] = useState<string[]>([]);

  useEffect(() => {
    loadCoach();
  }, []);

  async function loadCoach() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.log("AI COACH USER ERROR:", userError);
        setHasAccess(false);
        return;
      }

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const subscription = await getActiveSubscription(user.id);

     if (!subscription) {
  setHasAccess(false);
  return;
}

setHasAccess(true);

      setHasAccess(true);

      const { data: wrongAnswers, error } = await supabase
        .from("wrong_answers")
        .select("category")
        .eq("user_id", user.id);

      if (error) {
        console.log("AI COACH WRONG ANSWERS ERROR:", error);
        setWeakCategories([]);
        setTotalMistakes(0);
        return;
      }

      const counts: Record<string, number> = {};

      (wrongAnswers ?? []).forEach((item: WrongAnswer) => {
        const category = item.category || "Ukjent kategori";
        counts[category] = (counts[category] || 0) + 1;
      });

      const sorted = Object.entries(counts)
        .map(([category, count]) => ({
          category,
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setWeakCategories(sorted);
      setTotalMistakes(wrongAnswers?.length ?? 0);
    } catch (error) {
      console.log("AI COACH LOAD ERROR:", error);
      setHasAccess(false);
      setWeakCategories([]);
      setTotalMistakes(0);
    } finally {
      setLoading(false);
    }
  }

  const strongestWeakness = weakCategories[0];
  const maxWeakCount = strongestWeakness?.count ?? 1;
  const readiness = Math.max(0, Math.min(100, 100 - totalMistakes * 2));

  const weakTestUrl = strongestWeakness
    ? `/test?category=${encodeURIComponent(
        strongestWeakness.category
      )}&adaptive=true`
    : "/test";

  function getReadinessLabel() {
    if (readiness >= 80) return "Klar for eksamenstrening";
    if (readiness >= 50) return "Nærmer deg klar";
    return "Trenger mer trening";
  }

  function getReadinessColor() {
    if (readiness >= 80) return "text-[#3EE6B0]";
    if (readiness >= 50) return "text-yellow-400";
    return "text-[#FF4D6D]";
  }

  function getMainCoachMessage() {
    if (!strongestWeakness) {
      return "Jeg har ikke nok data ennå. Ta en vanlig test først, så analyserer jeg feilene dine og lager en personlig treningsplan.";
    }

    if (totalMistakes >= 10) {
      return `Du har en del registrerte feil. Den største risikoen akkurat nå er ${strongestWeakness.category}. Jeg anbefaler at du trener dette området før du prøver full eksamenstest.`;
    }

    if (strongestWeakness.count >= 5) {
      return `Du gjør flest feil innen ${strongestWeakness.category}. Dette bør være hovedfokuset ditt nå.`;
    }

    return `Du har relativt få feil, men ${strongestWeakness.category} er området du bør følge ekstra med på.`;
  }

  function getRiskText() {
    if (!strongestWeakness) {
      return "Ingen tydelig risiko ennå. Ta en test først, så bygger coachen en bedre anbefaling.";
    }

    if (readiness < 50) {
      return `Hvis du tar eksamen nå, er det størst sjanse for at feil innen ${strongestWeakness.category} trekker deg ned.`;
    }

    if (readiness < 80) {
      return `Du er på vei, men bør rydde opp i ${strongestWeakness.category} før du kjører full eksamenstest.`;
    }

    return "Du har et bra grunnlag. Nå bør du bruke eksamenstest for å sjekke stabilitet under press.";
  }

  function getTrainingPlan() {
    if (!strongestWeakness) {
      return [
        "Ta én vanlig test for å samle datagrunnlag.",
        "Svar ærlig uten å gjette for mye.",
        "Kom tilbake hit etter testen for personlig analyse.",
      ];
    }

    return [
      `Start med svakhetstest i ${strongestWeakness.category}.`,
      "Ta minst 10–20 spørsmål før du vurderer progresjonen.",
      "Hvis du gjør mange feil, tren samme kategori én gang til.",
      "Når resultatet er stabilt, gå videre til eksamenstest.",
    ];
  }

async function sendMalinMessage() {
  if (!malinMessage.trim()) return;

  if (messageCount >= 3) {
    window.location.href = "/pricing?reason=malin-limit";
    return;
  }

  const userMessage = malinMessage;

  setMalinReplies((prev) => [
    ...prev,
    `Du: ${userMessage}`,
  ]);

  setMalinMessage("");
  setMessageCount((prev) => prev + 1);

  try {
    const response = await fetch("/api/ai-coach", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
     body: JSON.stringify({
  message: userMessage,
  weakCategories: weakCategories.map((item) => item.category),
  totalMistakes,
}),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "AI-feil");
    }

    setMalinReplies((prev) => [
      ...prev,
      `Malin: ${data.reply}`,
    ]);
  } catch (error) {
    console.log(error);

    setMalinReplies((prev) => [
      ...prev,
      "Malin: Jeg fikk litt tekniske problemer 😭 Prøv igjen om et øyeblikk.",
    ]);
  }
}
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030712] text-white">
        Laster AI Coach...
      </main>
    );
  }

  if (!hasAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030712] px-6 text-white">
        <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#3EE6B0]">
            Premium kreves
          </p>

          <h1 className="mt-4 text-4xl font-extrabold">
            AI Coach er kun for premium-brukere
          </h1>

          <p className="mt-4 text-white/60">
            Oppgrader for å få personlig veiledning basert på feilene dine.
          </p>

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

  return (
    <main className="min-h-screen bg-[#030712] px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#3EE6B0]">
              AI Coach
            </p>

            <h1 className="mt-3 text-5xl font-black">
              Din personlige teori-coach
            </h1>

            <p className="mt-4 max-w-3xl text-white/60">
              Coachen analyserer feilene dine, finner svakhetene dine og foreslår
              neste beste steg før teoriprøven.
            </p>
          </div>

          <a
            href="/dashboard"
            className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center font-bold text-white hover:border-[#3EE6B0]/40"
          >
            Til dashboard
          </a>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-[#3EE6B0]/20 bg-white/5 p-8">
            <p className="text-sm text-white/50">Eksamen readiness</p>

            <h2 className={`mt-3 text-5xl font-black ${getReadinessColor()}`}>
              {readiness}%
            </h2>

            <p className="mt-3 text-white/60">{getReadinessLabel()}</p>

            <div className="mt-5 h-3 rounded-full bg-white/10">
              <div
                className="h-3 rounded-full bg-[#3EE6B0]"
                style={{ width: `${readiness}%` }}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-[#FF4D6D]/20 bg-white/5 p-8">
            <p className="text-sm text-white/50">Største risiko</p>

            <h2 className="mt-3 text-3xl font-black text-[#FF4D6D]">
              {strongestWeakness?.category ?? "Ingen data"}
            </h2>

            <p className="mt-3 text-white/60">
              {strongestWeakness
                ? `${strongestWeakness.count} registrerte feil`
                : "Ta en test først"}
            </p>
          </div>

          <div className="rounded-3xl border border-cyan-400/20 bg-white/5 p-8">
            <p className="text-sm text-white/50">Totale feil analysert</p>

            <h2 className="mt-3 text-5xl font-black text-cyan-300">
              {totalMistakes}
            </h2>

            <p className="mt-3 text-white/60">
              Basert på tidligere tester og svakhetstrening.
            </p>
          </div>
        </div>

<div className="mb-8 rounded-3xl border border-[#3EE6B0]/20 bg-[#3EE6B0]/10 p-6">
  <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#3EE6B0]">
    Spør AI-Malin
  </p>

  <h2 className="mt-3 text-3xl font-black">
    Få vanskelige regler forklart enkelt
  </h2>

  <p className="mt-3 text-white/60">
    Du har {Math.max(0, 3 - messageCount)} gratis meldinger igjen.
  </p>

  <textarea
    value={malinMessage}
    onChange={(e) => setMalinMessage(e.target.value)}
    placeholder="Spør Malin om vikeplikt, rundkjøring, skilt eller noe du synes er vanskelig..."
    className="mt-5 min-h-[120px] w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-white/30"
  />

  <button
    onClick={sendMalinMessage}
    className="mt-4 w-full rounded-2xl bg-[#3EE6B0] px-6 py-4 font-black text-[#03120F]"
  >
    Send til Malin
  </button>

  {malinReplies.length > 0 && (
    <div className="mt-6 space-y-3">
      {malinReplies.map((reply, index) => (
        <div
          key={index}
          className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white/70"
        >
          {reply}
        </div>
      ))}
    </div>
  )}
</div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-[#3EE6B0]/20 bg-[#3EE6B0]/10 p-8">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#3EE6B0]">
              Coach analyse
            </p>

            <h2 className="mt-4 text-3xl font-black">Neste beste steg</h2>

            <p className="mt-4 text-lg leading-relaxed text-white/75">
              {getMainCoachMessage()}
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/40">
                Om du tar eksamen nå
              </p>

              <p className="mt-3 text-white/70">{getRiskText()}</p>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/40">
                Anbefalt treningsplan
              </p>

              <div className="mt-4 space-y-3">
                {getTrainingPlan().map((step, index) => (
                  <div key={step} className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3EE6B0] text-sm font-black text-[#03120F]">
                      {index + 1}
                    </div>

                    <p className="text-white/70">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <a
                href={weakTestUrl}
                className="rounded-2xl bg-[#3EE6B0] px-6 py-4 text-center font-bold text-[#03120F] hover:bg-[#2fd39f]"
              >
                {strongestWeakness
                  ? `Tren ${strongestWeakness.category}`
                  : "Start vanlig test"}
              </a>

              <a
                href="/test"
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center font-bold text-white hover:border-[#3EE6B0]/40"
              >
                Vanlig test
              </a>

              <a
                href="/exam"
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center font-bold text-white hover:border-[#3EE6B0]/40"
              >
                Eksamenstest
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-300">
              Topp svakheter
            </p>

            <h2 className="mt-4 text-3xl font-black">Fokusområder</h2>

            {weakCategories.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="font-bold text-[#3EE6B0]">Ingen data ennå</p>

                <p className="mt-2 text-white/50">
                  Ta en vanlig test for å bygge coach-analysen.
                </p>

                <a
                  href="/test"
                  className="mt-5 inline-block rounded-2xl bg-[#3EE6B0] px-6 py-3 font-bold text-[#03120F]"
                >
                  Start test
                </a>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {weakCategories.map((item, index) => (
                  <a
                    key={item.category}
                    href={`/test?category=${encodeURIComponent(
                      item.category
                    )}&adaptive=true`}
                    className="block rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-cyan-300/40 hover:bg-cyan-300/10"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/40">
                          #{index + 1} svakhet
                        </p>

                        <h3 className="mt-1 text-xl font-black">
                          {item.category}
                        </h3>
                      </div>

                      <p className="text-2xl font-black text-[#FF4D6D]">
                        {item.count}
                      </p>
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

                    <p className="mt-3 text-sm font-bold text-cyan-200">
                      Klikk for å trene denne kategorien
                    </p>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}