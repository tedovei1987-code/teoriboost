"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

type Plan = "starter" | "boost" | "premium";

const plans: {
  id: Plan;
  name: string;
  description: string;
  price: string;
  duration: string;
  badge?: string;
  highlighted?: boolean;
  features: string[];
}[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfekt for rask øving før du bestemmer deg.",
    price: "49 kr",
    duration: "24 timers tilgang",
    features: [
      "Adaptive teoritester",
      "XP og rank-system",
      "Dashbord analyse",
      "AI-Malin-anbefalinger",
      "Daily Challenge",
    ],
  },
  {
    id: "boost",
    name: "Boost",
    description: "Best for deg som vil øve intensivt i én uke.",
    price: "119 kr",
    duration: "1 ukes tilgang",
    badge: "Mest populær",
    highlighted: true,
    features: [
      "Alt i Starter",
      "Svake områder trening",
      "Eksamenstest",
      "Achievement-system",
      "Testhistorikk",
      "Streak og progresjon",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    description: "For deg som vil ha god tid og full progresjon.",
    price: "249 kr",
    duration: "4 ukers tilgang",
    features: [
      "Alt i Boost",
      "Langsiktig progresjon",
      "Mer stabil eksamenstrening",
      "Leaderboard",
      "Full AI-Malin tilgang",
      "Best verdi over tid",
    ],
  },
];

export default function PricingPage() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const showFreemiumPaywall =
  reason === "free-limit" || reason === "ai-explanation";

  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function checkout(plan: Plan) {
    try {
      setErrorMessage("");
      setLoadingPlan(plan);

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log("CHECKOUT ERROR:", data);
        setErrorMessage(
          data?.error || "Kunne ikke starte betaling. Prøv igjen."
        );
        return;
      }

      if (!data?.url) {
        console.log("MISSING CHECKOUT URL:", data);
        setErrorMessage("Stripe returnerte ingen checkout-lenke.");
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.log("CHECKOUT LOAD ERROR:", error);
      setErrorMessage("Noe gikk galt ved oppstart av betaling.");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] px-6 py-16 text-white md:px-8 md:py-20">
      <section className="mx-auto max-w-7xl">
        <div className="text-center">
          <p className="font-bold uppercase tracking-[0.3em] text-[#4FF4D4]">
            TeoriBoost Premium
          </p>

          <h1 className="mt-6 text-5xl font-black md:text-6xl">
            Velg tilgang og start treningen
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-xl text-white/60">
            Start gratis med 20 faste spørsmål. Oppgrader for adaptive tester, AI-Malin som hjelper deg å forstå feilene dine, eksamenstrening, trening på svake områder, XP og dashboard analyse.
            
          </p>

          {showFreemiumPaywall && (
            <div className="mx-auto mt-10 max-w-2xl rounded-3xl border border-[#FF4D6D]/20 bg-[#FF4D6D]/10 p-8 text-center shadow-2xl shadow-[#FF4D6D]/10">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-[#4FF4D4]">
                Gratisgrensen er nådd
              </p>

              <h2 className="mt-4 text-4xl font-black text-white">
                Du er godt i gang 🚗
              </h2>

              <p className="mt-4 text-lg text-white/70">
                Over 40 % stryker på den ekte teoriprøven.
              </p>

              <p className="mt-5 text-lg leading-relaxed text-white">
                Stryker du, må du betale{" "}
                <span className="font-black text-[#FF4D6D]">480 kr</span>{" "}
                for ny prøve hos Statens vegvesen — og vente{" "}
                <span className="font-black text-[#FF4D6D]">2 uker</span>{" "}
                før du kan prøve igjen.
              </p>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5 text-left">
                <p className="font-bold text-white">
                  Oppgrader og fortsett med:
                </p>

                <ul className="mt-4 space-y-3 text-sm text-white/70">
                  <li>✓ Ubegrensede tester</li>
                  <li>✓ AI-Coach Malin</li>
                  <li>✓ Eksamenstrening</li>
                  <li>✓ Svake områder analyse</li>
                  <li>✓ XP + achievements</li>
                </ul>
              </div>

              <p className="mt-6 text-xl font-bold text-[#4FF4D4]">
                Velg Boost eller Premium for å fortsette treningen.
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-[#FF4D6D]/30 bg-[#FF4D6D]/10 p-5 text-[#FF8FA3]">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-[#4FF4D4]/20 bg-[#4FF4D4]/10 p-6 text-center">
            <p className="text-sm text-white/50">Inkludert</p>
            <p className="mt-2 text-2xl font-black text-[#4FF4D4]">
              AI-Malin som personlig Coach
            </p>
          </div>

          <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6 text-center">
            <p className="text-sm text-white/50">Trening</p>
            <p className="mt-2 text-2xl font-black text-cyan-300">
              Adaptive tester
            </p>
          </div>

          <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-6 text-center">
            <p className="text-sm text-white/50">Progresjon</p>
            <p className="mt-2 text-2xl font-black text-yellow-300">
              XP + badges
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-4">
        <div className="relative flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10">
  <div className="flex min-h-[220px] flex-col">
    <h2 className="text-3xl font-black">Freemium</h2>

    <p className="mt-4 text-white/60">
      En liten smakebit av TeoriBoost.
    </p>

    <div className="mt-8">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/40">
        Begrenset tilgang
      </p>

      <div className="mt-3 text-5xl font-black">0 kr</div>
    </div>
  </div>

  <div className="mt-8 flex-1 space-y-3">
    <div className="flex items-start gap-3">
      <span className="mt-1 text-[#4FF4D4]">✓</span>
      <p className="text-white/70">20 faste spørsmål</p>
    </div>

    <div className="flex items-start gap-3">
      <span className="mt-1 text-[#4FF4D4]">✓</span>
      <p className="text-white/70">Samme spørsmål hver gang</p>
    </div>

    <div className="flex items-start gap-3">
      <span className="mt-1 text-[#4FF4D4]">✓</span>
      <p className="text-white/70">Begrenset dashboard</p>
    </div>

    <div className="flex items-start gap-3">
      <span className="mt-1 text-[#FF4D6D]">✕</span>
      <p className="text-white/70">Ingen AI-Malin</p>
    </div>

    <div className="flex items-start gap-3">
      <span className="mt-1 text-[#FF4D6D]">✕</span>
      <p className="text-white/70">Ingen eksamenstest</p>
    </div>

    <div className="flex items-start gap-3">
      <span className="mt-1 text-[#FF4D6D]">✕</span>
      <p className="text-white/70">Ingen ubegrenset teoriøving</p>
    </div>
  </div>

  <a
    href="/free-test"
    className="mt-10 block w-full rounded-2xl border border-white/10 px-6 py-4 text-center text-xl font-bold text-white transition hover:bg-white/5"
  >
    Start gratis
  </a>
</div>
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex h-full flex-col rounded-3xl p-8 md:p-10 ${
                plan.highlighted
                  ? "border border-[#4FF4D4] bg-[#4FF4D4]/10 shadow-2xl shadow-[#4FF4D4]/10"
                  : "border border-white/10 bg-white/5"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-8 rounded-full bg-[#4FF4D4] px-5 py-2 text-sm font-black text-black">
                  {plan.badge}
                </div>
              )}

              <div className="flex min-h-[220px] flex-col">
                <h2 className="text-3xl font-black">{plan.name}</h2>

                <p className="mt-4 text-white/60">{plan.description}</p>

                <div className="mt-8">
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/40">
                    {plan.duration}
                  </p>

                  <div className="mt-3 text-5xl font-black">
                    {plan.price}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <span className="mt-1 text-[#4FF4D4]">✓</span>

                    <p className="text-white/70">{feature}</p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => checkout(plan.id)}
                disabled={loadingPlan !== null}
                className={`mt-10 w-full rounded-2xl px-6 py-4 text-xl font-bold transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 ${
                  plan.highlighted
                    ? "bg-[#4FF4D4] text-black"
                    : "bg-white text-black"
                }`}
              >
                {loadingPlan === plan.id
                  ? "Starter betaling..."
                  : `Kjøp ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <h3 className="text-2xl font-black">Hva får du?</h3>

            <p className="mt-4 text-white/60">
              Tilgang til hele TeoriBoost-systemet med tester, AI-Malin, din 
              progresjon, målrettet trening på svake områder og eksamenstrening.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <h3 className="text-2xl font-black">Kan jeg starte med én gang?</h3>

            <p className="mt-4 text-white/60">
              Ja. Etter betaling får du tilgang til dashboard, tester og
              premium-funksjoner.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <h3 className="text-2xl font-black">Hvilken plan bør jeg velge?</h3>

            <p className="mt-4 text-white/60">
              Boost passer best for intensiv øving. Premium passer best hvis du
              vil trene roligere over flere uker.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="/dashboard"
            className="rounded-2xl border border-white/10 px-6 py-4 font-bold text-white/70 hover:bg-white/5"
          >
            Til dashboard
          </a>

          <a
            href="/login"
            className="rounded-2xl border border-white/10 px-6 py-4 font-bold text-white/70 hover:bg-white/5"
          >
            Logg inn
          </a>
        </div>
      </section>
    </main>
  );
}