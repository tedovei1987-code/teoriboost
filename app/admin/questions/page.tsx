"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Question = {
  id: string;
  question: string;
  answers: string[];
  correct_answer: string;
  category: string | null;
  difficulty: string | null;
  explanation: string | null;
  license_class: string | null;
  learning_goal: string | null;
  official_topic: string | null;
  step_level: number | null;
  exam_relevant: boolean | null;
  is_active: boolean | null;
  image_url: string | null;
};

export default function AdminQuestionsPage() {
  const [loading, setLoading] = useState(true);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [question, setQuestion] = useState("");
  const [answer1, setAnswer1] = useState("");
  const [answer2, setAnswer2] = useState("");
  const [answer3, setAnswer3] = useState("");
  const [answer4, setAnswer4] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");

  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [explanation, setExplanation] = useState("");
  const [learningGoal, setLearningGoal] = useState("");
  const [officialTopic, setOfficialTopic] = useState("");
  const [stepLevel, setStepLevel] = useState(3);
  const [examRelevant, setExamRelevant] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    setCheckingAdmin(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (error || !profile?.is_admin) {
      window.location.href = "/dashboard";
      return;
    }

    setIsAdmin(true);
    setCheckingAdmin(false);
    await loadQuestions();
  }

  async function loadQuestions() {
    setLoading(true);

    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log("LOAD QUESTIONS ERROR:", error);
      setQuestions([]);
    } else {
      setQuestions(data ?? []);
    }

    setLoading(false);
  }

  function validateForm() {
    if (!question || !answer1 || !answer2 || !answer3 || !answer4 || !correctAnswer) {
      alert("Fyll inn alle obligatoriske felter");
      return false;
    }

    const answers = [answer1, answer2, answer3, answer4];

    if (!answers.includes(correctAnswer)) {
      alert("Riktig svar må være identisk med ett av svaralternativene");
      return false;
    }

    return true;
  }

  async function uploadImage(file: File) {
    if (!file) return;

    setUploadingImage(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;

    const filePath = `questions/${fileName}`;

    const { error } = await supabase.storage
      .from("question-images")
      .upload(filePath, file);

    if (error) {
      console.log("IMAGE UPLOAD ERROR:", error);
      alert("Kunne ikke laste opp bilde");
      setUploadingImage(false);
      return;
    }

    const { data } = supabase.storage
      .from("question-images")
      .getPublicUrl(filePath);

    setImageUrl(data.publicUrl);
    setUploadingImage(false);
  }

  async function createQuestion() {
    if (!isAdmin || !validateForm()) return;

    setSaving(true);

    const { error } = await supabase.from("questions").insert({
      question,
      answers: [answer1, answer2, answer3, answer4],
      correct_answer: correctAnswer,
      category,
      difficulty,
      explanation,
      learning_goal: learningGoal,
      official_topic: officialTopic,
      step_level: stepLevel,
      license_class: "B",
      exam_relevant: examRelevant,
      is_active: isActive,
      image_url: imageUrl || null,
    });

    if (error) {
      console.log("CREATE QUESTION ERROR:", error);
      alert("Kunne ikke opprette spørsmål");
    } else {
      resetForm();
      await loadQuestions();
    }

    setSaving(false);
  }

  async function updateQuestion() {
    if (!isAdmin || !editingId || !validateForm()) return;

    setSaving(true);

    const { error } = await supabase
      .from("questions")
      .update({
        question,
        answers: [answer1, answer2, answer3, answer4],
        correct_answer: correctAnswer,
        category,
        difficulty,
        explanation,
        learning_goal: learningGoal,
        official_topic: officialTopic,
        step_level: stepLevel,
        license_class: "B",
        exam_relevant: examRelevant,
        is_active: isActive,
        image_url: imageUrl || null,
      })
      .eq("id", editingId);

    if (error) {
      console.log("UPDATE QUESTION ERROR:", error);
      alert("Kunne ikke oppdatere spørsmål");
    } else {
      resetForm();
      await loadQuestions();
    }

    setSaving(false);
  }

  async function deleteQuestion(id: string) {
    if (!isAdmin) return;

    const confirmed = confirm("Slette spørsmål?");
    if (!confirmed) return;

    const { error } = await supabase.from("questions").delete().eq("id", id);

    if (error) {
      console.log("DELETE ERROR:", error);
      alert("Kunne ikke slette");
    } else {
      await loadQuestions();
    }
  }

  async function toggleActive(item: Question) {
    const { error } = await supabase
      .from("questions")
      .update({ is_active: !item.is_active })
      .eq("id", item.id);

    if (error) {
      alert("Kunne ikke oppdatere aktiv-status");
    } else {
      await loadQuestions();
    }
  }

  async function toggleExamRelevant(item: Question) {
    const { error } = await supabase
      .from("questions")
      .update({ exam_relevant: !item.exam_relevant })
      .eq("id", item.id);

    if (error) {
      alert("Kunne ikke oppdatere eksamensstatus");
    } else {
      await loadQuestions();
    }
  }

  function startEdit(item: Question) {
    setEditingId(item.id);
    setQuestion(item.question);
    setAnswer1(item.answers?.[0] ?? "");
    setAnswer2(item.answers?.[1] ?? "");
    setAnswer3(item.answers?.[2] ?? "");
    setAnswer4(item.answers?.[3] ?? "");
    setCorrectAnswer(item.correct_answer);
    setCategory(item.category ?? "");
    setDifficulty(item.difficulty ?? "medium");
    setExplanation(item.explanation ?? "");
    setLearningGoal(item.learning_goal ?? "");
    setOfficialTopic(item.official_topic ?? "");
    setStepLevel(item.step_level ?? 3);
    setExamRelevant(item.exam_relevant ?? true);
    setIsActive(item.is_active ?? true);
    setImageUrl(item.image_url ?? "");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setQuestion("");
    setAnswer1("");
    setAnswer2("");
    setAnswer3("");
    setAnswer4("");
    setCorrectAnswer("");
    setCategory("");
    setDifficulty("medium");
    setExplanation("");
    setLearningGoal("");
    setOfficialTopic("");
    setStepLevel(3);
    setExamRelevant(true);
    setIsActive(true);
    setImageUrl("");
  }

  if (checkingAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030712] text-white">
        Sjekker admin-tilgang...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#030712] px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#3EE6B0]">
            Adminpanel
          </p>

          <h1 className="mt-3 text-5xl font-black">
            Administrer spørsmål
          </h1>

          <p className="mt-4 max-w-2xl text-white/60">
            Opprett, rediger og administrer TeoriBoost-spørsmål.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
          <div className="rounded-3xl border border-[#3EE6B0]/20 bg-white/5 p-8">
            <h2 className="text-3xl font-black">
              {editingId ? "Rediger spørsmål" : "Nytt spørsmål"}
            </h2>

            <div className="mt-6 space-y-4">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Spørsmål"
                className="h-32 w-full rounded-2xl border border-white/10 bg-[#071028] p-4 outline-none"
              />

              <input
                value={answer1}
                onChange={(e) => setAnswer1(e.target.value)}
                placeholder="Svaralternativ 1"
                className="w-full rounded-2xl border border-white/10 bg-[#071028] p-4 outline-none"
              />

              <input
                value={answer2}
                onChange={(e) => setAnswer2(e.target.value)}
                placeholder="Svaralternativ 2"
                className="w-full rounded-2xl border border-white/10 bg-[#071028] p-4 outline-none"
              />

              <input
                value={answer3}
                onChange={(e) => setAnswer3(e.target.value)}
                placeholder="Svaralternativ 3"
                className="w-full rounded-2xl border border-white/10 bg-[#071028] p-4 outline-none"
              />

              <input
                value={answer4}
                onChange={(e) => setAnswer4(e.target.value)}
                placeholder="Svaralternativ 4"
                className="w-full rounded-2xl border border-white/10 bg-[#071028] p-4 outline-none"
              />

              <select
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                className="w-full rounded-2xl border border-[#3EE6B0]/20 bg-[#071028] p-4 outline-none"
              >
                <option value="">Velg riktig svar</option>
                {[answer1, answer2, answer3, answer4]
                  .filter(Boolean)
                  .map((answer) => (
                    <option key={answer} value={answer}>
                      {answer}
                    </option>
                  ))}
              </select>

              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Kategori"
                className="w-full rounded-2xl border border-white/10 bg-[#071028] p-4 outline-none"
              />

              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#071028] p-4 outline-none"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Forklaring"
                className="h-28 w-full rounded-2xl border border-white/10 bg-[#071028] p-4 outline-none"
              />

              <input
                value={learningGoal}
                onChange={(e) => setLearningGoal(e.target.value)}
                placeholder="Læringsmål"
                className="w-full rounded-2xl border border-white/10 bg-[#071028] p-4 outline-none"
              />

              <input
                value={officialTopic}
                onChange={(e) => setOfficialTopic(e.target.value)}
                placeholder="Offisielt tema"
                className="w-full rounded-2xl border border-white/10 bg-[#071028] p-4 outline-none"
              />

              <input
                type="number"
                value={stepLevel}
                onChange={(e) => setStepLevel(Number(e.target.value))}
                placeholder="Trinnnivå"
                className="w-full rounded-2xl border border-white/10 bg-[#071028] p-4 outline-none"
              />

              <div className="rounded-2xl border border-white/10 bg-[#071028] p-4">
                <p className="mb-3 font-bold">Bilde til spørsmål</p>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage(file);
                  }}
                  className="w-full text-sm text-white/70"
                />

                {uploadingImage && (
                  <p className="mt-3 text-sm text-[#3EE6B0]">
                    Laster opp bilde...
                  </p>
                )}

                {imageUrl && (
                  <div className="mt-4">
                    <img
                      src={imageUrl}
                      alt="Forhåndsvisning"
                      className="max-h-56 w-full rounded-2xl object-cover"
                    />

                    <button
                      onClick={() => setImageUrl("")}
                      className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 font-bold text-red-400"
                    >
                      Fjern bilde
                    </button>
                  </div>
                )}
              </div>

              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#071028] p-4">
                <span className="font-bold">Eksamensrelevant</span>
                <input
                  type="checkbox"
                  checked={examRelevant}
                  onChange={(e) => setExamRelevant(e.target.checked)}
                  className="h-5 w-5"
                />
              </label>

              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#071028] p-4">
                <span className="font-bold">Aktiv</span>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-5 w-5"
                />
              </label>

              <button
                onClick={editingId ? updateQuestion : createQuestion}
                disabled={saving || uploadingImage}
                className="w-full rounded-2xl bg-[#3EE6B0] py-4 text-lg font-black text-[#03120F] disabled:opacity-40"
              >
                {saving
                  ? "Lagrer..."
                  : editingId
                  ? "Oppdater spørsmål"
                  : "Opprett spørsmål"}
              </button>

              {editingId && (
                <button
                  onClick={resetForm}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 text-lg font-black text-white"
                >
                  Avbryt redigering
                </button>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-[#3EE6B0]">
                  Database
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  Alle spørsmål
                </h2>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
                <p className="text-sm text-white/50">
                  {questions.length} spørsmål
                </p>
              </div>
            </div>

            {loading ? (
              <p className="text-white/50">Laster spørsmål...</p>
            ) : questions.length === 0 ? (
              <p className="text-white/50">Ingen spørsmål funnet.</p>
            ) : (
              <div className="space-y-4">
                {questions.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-[#071028] p-6"
                  >
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt="Spørsmålsbilde"
                        className="mb-5 max-h-72 w-full rounded-2xl object-cover"
                      />
                    )}

                    <div className="flex flex-wrap gap-2">
                      {item.category && (
                        <span className="rounded-full bg-[#3EE6B0]/10 px-3 py-1 text-xs font-bold text-[#3EE6B0]">
                          {item.category}
                        </span>
                      )}

                      {item.difficulty && (
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/50">
                          {item.difficulty}
                        </span>
                      )}

                      {item.step_level && (
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/50">
                          Trinn {item.step_level}
                        </span>
                      )}

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          item.is_active
                            ? "bg-[#3EE6B0]/10 text-[#3EE6B0]"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {item.is_active ? "Aktiv" : "Inaktiv"}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          item.exam_relevant
                            ? "bg-cyan-400/10 text-cyan-300"
                            : "bg-white/10 text-white/40"
                        }`}
                      >
                        {item.exam_relevant ? "Eksamen" : "Ikke eksamen"}
                      </span>
                    </div>

                    <h3 className="mt-4 text-xl font-black">
                      {item.question}
                    </h3>

                    <div className="mt-5 space-y-2">
                      {item.answers.map((answer) => (
                        <div
                          key={answer}
                          className={`rounded-xl border px-4 py-3 ${
                            answer === item.correct_answer
                              ? "border-[#3EE6B0]/30 bg-[#3EE6B0]/10"
                              : "border-white/10 bg-white/5"
                          }`}
                        >
                          {answer}
                        </div>
                      ))}
                    </div>

                    {item.explanation && (
                      <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                        <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
                          Forklaring
                        </p>

                        <p className="mt-2 text-white/70">
                          {item.explanation}
                        </p>
                      </div>
                    )}

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm text-white/40">
                        Klasse {item.license_class}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="rounded-xl border border-[#3EE6B0]/20 bg-[#3EE6B0]/10 px-4 py-2 font-bold text-[#3EE6B0]"
                        >
                          Rediger
                        </button>

                        <button
                          onClick={() => toggleActive(item)}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-bold text-white"
                        >
                          {item.is_active ? "Deaktiver" : "Aktiver"}
                        </button>

                        <button
                          onClick={() => toggleExamRelevant(item)}
                          className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 font-bold text-cyan-300"
                        >
                          {item.exam_relevant
                            ? "Fjern fra eksamen"
                            : "Legg til eksamen"}
                        </button>

                        <button
                          onClick={() => deleteQuestion(item.id)}
                          className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 font-bold text-red-400"
                        >
                          Slett
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}