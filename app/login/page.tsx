"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      window.location.href = "/dashboard";
    }
  }

  async function handleAuth() {
    try {
      setLoading(true);
      setErrorMessage("");

      if (!email || !password) {
        setErrorMessage("Fyll inn e-post og passord.");
        return;
      }

      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          console.log("REGISTER ERROR:", error);
          setErrorMessage(error.message);
          return;
        }
      } else {
        const { error } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (error) {
          console.log("LOGIN ERROR:", error);
          setErrorMessage(error.message);
          return;
        }
      }

      window.location.href = "/dashboard";
    } catch (error) {
      console.log("AUTH ERROR:", error);
      setErrorMessage("Noe gikk galt.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020617] px-6 text-white">
      <section className="w-full max-w-md rounded-3xl border border-[#39FFB6]/20 bg-[#071028] p-10">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#39FFB6]">
            TeoriBoost
          </p>

          <h1 className="mt-5 text-5xl font-black">
            {isRegister ? "Opprett konto" : "Logg inn"}
          </h1>

          <p className="mt-4 text-white/60">
            {isRegister
              ? "Opprett konto for å starte treningen."
              : "Logg inn for å fortsette progresjonen din."}
          </p>
        </div>

        {errorMessage && (
          <div className="mt-8 rounded-2xl border border-[#FF4D6D]/30 bg-[#FF4D6D]/10 p-4 text-sm text-[#FF8FA3]">
            {errorMessage}
          </div>
        )}

        <div className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-white/70">
              E-post
            </label>

            <input
              type="email"
              placeholder="navn@email.no"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-5 py-4 outline-none transition focus:border-[#39FFB6]/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-white/70">
              Passord
            </label>

            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-5 py-4 outline-none transition focus:border-[#39FFB6]/50"
            />
          </div>

          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full rounded-2xl bg-[#39FFB6] px-6 py-4 text-lg font-black text-[#03120F] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Laster..."
              : isRegister
              ? "Opprett konto"
              : "Logg inn"}
          </button>
        </div>

        <button
          onClick={() => setIsRegister(!isRegister)}
          className="mt-6 w-full text-center text-sm text-white/60 hover:text-[#39FFB6]"
        >
          {isRegister
            ? "Har du allerede konto? Logg inn"
            : "Ingen konto? Opprett bruker"}
        </button>

        <div className="mt-10 text-center">
          <a
            href="/"
            className="text-sm text-white/40 hover:text-white/70"
          >
            ← Tilbake til forsiden
          </a>
        </div>
      </section>
    </main>
  );
}