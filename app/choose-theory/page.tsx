"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { THEORY_TYPES } from "../lib/theoryTypes";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ChooseTheoryPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("SESSION ERROR:", error);
      setCheckingUser(false);
      return;
    }

    if (!session) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("theory_type")
      .eq("id", session.user.id)
      .maybeSingle();

    if (profile?.theory_type) {
      setSelected(profile.theory_type);
    }

    setCheckingUser(false);
  }

  async function saveTheoryType() {
    if (!selected) return;

    setLoading(true);
    setSaveError(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("USER ERROR:", userError);
      setSaveError("Kunne ikke hente bruker.");
      setLoading(false);
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          theory_type: selected,
        },
        {
          onConflict: "id",
        }
      );

    if (error) {
      console.error("SAVE THEORY ERROR:", error);
      setSaveError("Kunne ikke lagre teori-type. Sjekk Supabase/RLS.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  function getSelectedDescription() {
    for (const group of THEORY_TYPES) {
      const found = group.items.find((item) => item.value === selected);

      if (found) {
        return `${found.label} – ${found.description}`;
      }
    }

    return null;
  }

  if (checkingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] px-6 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#39FFB6]">
            TeoriBoost
          </p>

          <h1 className="mt-4 text-3xl font-black">Laster valg...</h1>
        </div>
      </main>
    );
  }

  const selectedDescription = getSelectedDescription();

  return (
    <main className="min-h-screen bg-[#020617] px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl">
        <div className="mb-10 rounded-3xl border border-[#39FFB6]/20 bg-gradient-to-br from-[#39FFB6]/10 to-cyan-500/10 p-8">
          <p className="font-bold uppercase tracking-[0.3em] text-[#39FFB6]">
            TeoriBoost
          </p>

          <h1 className="mt-4 text-4xl font-black md:text-6xl">
            Velg teori
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-white/70">
            Velg hvilken førerkortklasse eller fagmodul du vil trene på.
          </p>

          {selectedDescription && (
            <div className="mt-6 inline-flex rounded-2xl border border-[#39FFB6]/30 bg-[#39FFB6]/10 px-5 py-3 font-bold text-[#39FFB6]">
              Valgt: {selectedDescription}
            </div>
          )}

          {saveError && (
            <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-red-200">
              {saveError}
            </div>
          )}
        </div>

        <div className="space-y-10">
          {THEORY_TYPES.map((group) => (
            <div
              key={group.group}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
            >
              <h2 className="text-2xl font-black">{group.group}</h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {group.items.map((item) => {
                  const isSelected = selected === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setSelected(item.value)}
                      className={`rounded-3xl border p-5 text-left transition-all ${
                        isSelected
                          ? "scale-[1.02] border-[#39FFB6] bg-[#39FFB6] text-[#03120F]"
                          : "border-white/10 bg-[#071028] hover:border-[#39FFB6]/50 hover:bg-[#39FFB6]/10"
                      }`}
                    >
                      <div className="min-h-[90px]">
                        <p className="text-2xl font-black">{item.label}</p>

                        <p
                          className={`mt-3 text-sm leading-relaxed ${
                            isSelected ? "text-black/70" : "text-white/60"
                          }`}
                        >
                          {item.description}
                        </p>

                        {isSelected && (
                          <p className="mt-4 text-sm font-black">Valgt</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 mt-10 border-t border-white/10 bg-[#020617]/90 py-5 backdrop-blur">
          <button
            type="button"
            onClick={saveTheoryType}
            disabled={!selected || loading}
            className="w-full rounded-2xl bg-[#39FFB6] py-5 text-lg font-black text-[#03120F] transition hover:bg-[#2edfa3] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Lagrer..." : "Fortsett til dashboard"}
          </button>
        </div>
      </section>
    </main>
  );
}