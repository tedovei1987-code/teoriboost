"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";

function getExpiresAt(plan: string) {
  const expires = new Date();

  if (plan === "starter") {
    expires.setHours(expires.getHours() + 24);
  }

  if (plan === "boost") {
    expires.setDate(expires.getDate() + 7);
  }

  if (plan === "premium") {
    expires.setDate(expires.getDate() + 28);
  }

  return expires.toISOString();
}

function getPlanName(plan: string | null) {
  if (plan === "starter") return "Starter";
  if (plan === "boost") return "Boost";
  if (plan === "premium") return "Premium";
  return "Ukjent plan";
}

export default function SuccessPage() {
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [planName, setPlanName] = useState("Ukjent plan");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    saveSubscription();
  }, []);

  async function saveSubscription() {
    try {
      setLoading(true);

      const plan = searchParams.get("plan");

      if (!plan) {
        setErrorMessage("Mangler plan i URL.");
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.log("SUCCESS USER ERROR:", userError);
        setErrorMessage("Kunne ikke hente innlogget bruker.");
        return;
      }

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const expiresAt = getExpiresAt(plan);

      const { error: deleteError } = await supabase
        .from("subscriptions")
        .delete()
        .eq("user_id", user.id);

      if (deleteError) {
        console.log("SUBSCRIPTION DELETE ERROR:", deleteError);
        setErrorMessage("Kunne ikke rydde gammel tilgang.");
        return;
      }

      const { error: insertError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: user.id,
          plan,
          active: true,
          expires_at: expiresAt,
        });

      if (insertError) {
        console.log("SUBSCRIPTION INSERT ERROR:", insertError);
        setErrorMessage("Kunne ikke aktivere abonnement.");
        return;
      }

      setPlanName(getPlanName(plan));

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("theory_type")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.log("PROFILE CHECK ERROR:", profileError);
      }

      setTimeout(() => {
        if (!profile?.theory_type) {
          window.location.href = "/choose-theory";
        } else {
          window.location.href = "/dashboard";
        }
      }, 1800);
    } catch (error) {
      console.log("SUCCESS LOAD ERROR:", error);
      setErrorMessage("Noe gikk galt ved aktivering.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        Aktiverer abonnement...
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] px-6 text-white">
        <section className="max-w-xl rounded-3xl border border-[#FF4D6D]/30 bg-[#FF4D6D]/10 p-10 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#FF8FA3]">
            Aktivering feilet
          </p>

          <h1 className="mt-5 text-4xl font-black">
            {errorMessage}
          </h1>

          <a
            href="/pricing"
            className="mt-8 inline-block rounded-2xl bg-[#4FF4D4] px-8 py-4 font-bold text-black"
          >
            Tilbake til pricing
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020617] px-6 text-white">
      <section className="max-w-xl rounded-3xl border border-[#4FF4D4]/30 bg-white/5 p-10 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#4FF4D4]">
          Betaling fullført
        </p>

        <h1 className="mt-5 text-5xl font-black">
          {planName} er aktivert 🚀
        </h1>

        <p className="mt-5 text-white/70">
          Tilgangen din er aktiv. Du sendes straks videre.
        </p>

        <div className="mt-8 rounded-2xl border border-[#4FF4D4]/20 bg-[#4FF4D4]/10 p-4 text-[#4FF4D4]">
          Sjekker valgt teori...
        </div>
      </section>
    </main>
  );
}