"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Question = {
  id: string;
  question: string;
  answers: string[];
  correct_answer: string;
  category: string | null;
  explanation: string | null;
  image_url: string | null;
};

type AnswerRecord = {
  question: Question;
  selectedAnswer: string;
  isCorrect: boolean;
};

const FREE_QUESTION_LIMIT = 20;

export default function FreeTestPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answerOptions, setAnswerOptions] = useState<Record<string, string[]>>(
    {}
  );
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFreeQuestions();
  }, []);

  function shuffleArray<T>(array: T[]) {
    return [...array].sort(() => Math.random() - 0.5);
  }

  async function loadFreeQuestions() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("questions")
      .select(
        "id, question, answers, correct_answer, category, explanation, image_url"
      )
      .eq("is_active", true)
      .eq("license_class", "B")
      .order("id", { ascending: true })
      .limit(FREE_QUESTION_LIMIT);

    if (error) {
      console.log("FREE TEST QUESTION ERROR:", error);
      setQuestions([]);
      setLoading(false);
      return;
    }

    const fixedQuestions = (data ?? []) as Question[];

    const shuffledAnswers = fixedQuestions.reduce<Record<string, string[]>>(
      (acc, question) => {
        acc[question.id] = shuffleArray(question.answers);
        return acc;
      },
      {}
    );

    setQuestions(fixedQuestions);
    setAnswerOptions(shuffledAnswers);
    setLoading(false);
  }

  const question = questions[current];

  const currentAnswerOptions = question
    ? answerOptions[question.id] ?? question.answers
    : [];

  function handleAnswer(answer: string) {
    if (!question || selected) return;

    setSelected(answer);
  }

  function nextQuestion() {
    if (!question || !selected) return;

    const isCorrect = selected === question.correct_answer;

    const newAnswer: AnswerRecord = {
      question,
      selectedAnswer: selected,
      isCorrect,
    };

    const finalAnswers = [...answers, newAnswer];
    setAnswers(finalAnswers);

    if (current + 1 < questions.length) {
      setCurrent((prev) => prev + 1);
      setSelected(null);
      return;
    }

    setFinished(true);
  }

  const score = answers.filter((item) => item.isCorrect).length;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030712] text-white">
        Laster gratis test...
      </main>
    );
  }

  if (questions.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030712] px-6 text-white">
        <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
          <h1 className="text-3xl font-black">Ingen spørsmål funnet</h1>
          <p className="mt-4 text-white/60">
            Legg inn aktive Klasse B-spørsmål i databasen først.
          </p>
        </div>
      </main>
    );
  }

  if (finished) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030712] px-6 py-12 text-white">
        <div className="w-full max-w-2xl rounded-3xl border border-[#FF4D6D]/30 bg-white/5 p-10 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#3EE6B0]">
            Gratis test fullført
          </p>

          <h1 className="mt-4 text-5xl font-black">
            {score} / {questions.length} riktige
          </h1>
          <p className="mt-2 text-lg text-white/60">
          {Math.round((score / questions.length) * 100)} % riktig
          </p>
          <p className="mt-4 text-xl text-white/70">
            Du har nå brukt alle de 20 gratis spørsmålene.
          </p>
          <p className="mt-3 text-white/60">
           De fleste som består teoriprøven trener på langt flere spørsmål før prøvedagen.
           </p>
          <div className="mt-8 rounded-3xl border border-[#FF4D6D]/30 bg-[#FF4D6D]/10 p-6 text-left">
            <h2 className="text-3xl font-black text-white">
              Ikke risiker å stryke på teoriprøven 🚗
            </h2>

            <p className="mt-4 text-lg leading-relaxed text-white/75">
              Over 40 % stryker på teoriprøven. Stryker du, må du betale{" "}
              <span className="font-black text-[#FF4D6D]">480 kr</span>{" "}
              for ny prøve hos Statens vegvesen — og vente{" "}
              <span className="font-black text-[#FF4D6D]">2 uker</span>{" "}
              før du kan prøve igjen.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="font-bold text-white">
                Oppgrader for å få tilgang til:
              </p>

              <ul className="mt-4 space-y-3 text-white/70">
                <li>✓ Ubegrensede tester</li>
                <li>✓ AI-Malin</li>
                <li>✓ Eksamenstrening</li>
                <li>✓ Trening på svake områder</li>
                <li>✓ XP, streak og dashboard analyse</li>
              </ul>
            </div>
          </div>

          <a
            href="/pricing?reason=free-limit"
            className="mt-10 block w-full rounded-2xl bg-[#3EE6B0] px-8 py-4 text-xl font-black text-[#03120F]"
          >
            Lås opp full tilgang
          </a>
        </div>
      </main>
    );
  }

  const isCorrect = selected === question.correct_answer;

  return (
    <main className="min-h-screen bg-[#030712] px-6 py-10 text-white">
      <section className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#3EE6B0]">
            Gratis test
          </p>

          <h1 className="mt-3 text-4xl font-black">
            Spørsmål {current + 1} av {questions.length}
          </h1>

          <p className="mt-3 text-white/60">
            Freemium bruker alltid de samme 20 spørsmålene.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          {question.image_url && (
            <img
              src={question.image_url}
              alt="Spørsmålsbilde"
              className="mb-6 max-h-80 w-full rounded-2xl object-contain"
            />
          )}

          <p className="text-sm text-[#3EE6B0]">
            {question.category || "Teori"}
          </p>

          <h2 className="mt-3 text-2xl font-black">{question.question}</h2>

          <div className="mt-8 space-y-4">
            {currentAnswerOptions.map((answer) => {
              const isSelected = selected === answer;
              const isRightAnswer = answer === question.correct_answer;
              const showCorrect = selected && isRightAnswer;
              const showWrong = selected && isSelected && !isRightAnswer;

              return (
                <button
                  key={answer}
                  type="button"
                  onClick={() => handleAnswer(answer)}
                  disabled={!!selected}
                  className={`w-full rounded-2xl border px-5 py-4 text-left font-bold transition ${
                    showCorrect
                      ? "border-[#3EE6B0] bg-[#3EE6B0]/20 text-white"
                      : showWrong
                      ? "border-[#FF4D6D] bg-[#FF4D6D]/20 text-white"
                      : "border-white/10 bg-white/5 hover:border-[#3EE6B0]/50"
                  }`}
                >
                  {answer}
                </button>
              );
            })}
          </div>

          {selected && (
            <div
              className={`mt-6 rounded-2xl border p-5 ${
                isCorrect
                  ? "border-[#3EE6B0]/30 bg-[#3EE6B0]/10"
                  : "border-[#FF4D6D]/30 bg-[#FF4D6D]/10"
              }`}
            >
              <p className="font-black">
                {isCorrect ? "Riktig svar ✅" : "Feil svar ❌"}
              </p>

              {question.explanation && (
                <p className="mt-3 text-white/70">{question.explanation}</p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={nextQuestion}
            disabled={!selected}
            className="mt-8 w-full rounded-2xl bg-[#3EE6B0] px-8 py-4 font-black text-[#03120F] disabled:opacity-40"
          >
            {current + 1 === questions.length
              ? "Fullfør gratis test"
              : "Neste spørsmål"}
          </button>
        </div>
      </section>
    </main>
  );
}