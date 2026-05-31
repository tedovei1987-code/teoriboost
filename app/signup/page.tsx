"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function signup() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/choose-theory";
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020617] px-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-4xl font-black">Opprett bruker</h1>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-post"
          className="mt-8 w-full rounded-2xl bg-black/30 p-4 text-white"
        />

        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passord"
          type="password"
          className="mt-4 w-full rounded-2xl bg-black/30 p-4 text-white"
        />

        {message && (
          <p className="mt-4 text-sm text-red-300">{message}</p>
        )}

        <button
          onClick={signup}
          disabled={loading}
          className="mt-6 w-full rounded-2xl bg-[#3EE6B0] py-4 font-black text-[#03120F]"
        >
          {loading ? "Oppretter..." : "Opprett bruker"}
        </button>
      </div>
    </main>
  );
}