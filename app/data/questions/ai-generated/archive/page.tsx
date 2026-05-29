"use client";

import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { supabase } from "../../../../lib/supabase";
import { THEORY_TYPES } from "../../../../lib/theoryTypes";

type ImportQuestion = {
  question: string;
  answers: string[];
  correct_answer: string;
  category: string | null;
  theory_type: string | null;
};

type ValidationError = {
  index: number;
  message: string;
};

export default function AdminImportPage() {
  const [jsonInput, setJsonInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [selectedTheory, setSelectedTheory] = useState("B");

  const [previewQuestions, setPreviewQuestions] = useState<
    ImportQuestion[]
  >([]);

  const [validationErrors, setValidationErrors] = useState<
    ValidationError[]
  >([]);

  const [duplicateQuestions, setDuplicateQuestions] = useState<string[]>([]);

  const [importStats, setImportStats] = useState({
    total: 0,
    valid: 0,
    duplicates: 0,
    invalid: 0,
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      window.location.href = "/dashboard";
      return;
    }

    setIsAdmin(true);
    setCheckingAdmin(false);
  }

  function parseAnswers(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map(String);
    }

    if (typeof value !== "string") {
      return [];
    }

    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.map(String);
      }
    } catch {
      return value
        .split("|")
        .map((answer) => answer.trim())
        .filter(Boolean);
    }

    return [];
  }

  function normalizeQuestion(item: any): ImportQuestion {
    return {
      question: String(item.question ?? "").trim(),

      answers: parseAnswers(item.answers),

      correct_answer: String(
        item.correct_answer ?? ""
      ).trim(),

      category: item.category
        ? String(item.category).trim()
        : null,

      theory_type:
        item.theory_type ||
        selectedTheory ||
        "B",
    };
  }

  function validateQuestions(
    questions: ImportQuestion[]
  ) {
    const errors: ValidationError[] = [];

    questions.forEach((item, index) => {
      if (!item.question) {
        errors.push({
          index,
          message: "Mangler question",
        });
      }

      if (
        !Array.isArray(item.answers) ||
        item.answers.length < 2
      ) {
        errors.push({
          index,
          message:
            "Må ha minst 2 svaralternativer",
        });
      }

      if (!item.correct_answer) {
        errors.push({
          index,
          message: "Mangler correct_answer",
        });
      }

      if (
        item.correct_answer &&
        !item.answers.includes(
          item.correct_answer
        )
      ) {
        errors.push({
          index,
          message:
            "correct_answer finnes ikke i answers",
        });
      }

      if (!item.theory_type) {
        errors.push({
          index,
          message: "Mangler theory_type",
        });
      }
    });

    return errors;
  }

  async function checkDuplicates(
    questions: ImportQuestion[]
  ) {
    const titles = questions
      .map((item) => item.question)
      .filter(Boolean);

    if (titles.length === 0) return [];

    const { data, error } = await supabase
      .from("questions")
      .select("question")
      .in("question", titles);

    if (error) {
      console.log(
        "DUPLICATE CHECK ERROR:",
        error
      );

      return [];
    }

    return (data ?? []).map(
      (item) => item.question
    );
  }

  async function preparePreview(
    rawQuestions: any[]
  ) {
    try {
      const normalized =
        rawQuestions.map(normalizeQuestion);

      const validation =
        validateQuestions(normalized);

      const duplicates =
        await checkDuplicates(normalized);

      const invalidIndexes = new Set(
        validation.map((error) => error.index)
      );

      const filtered = normalized.filter(
        (item, index) =>
          !invalidIndexes.has(index) &&
          !duplicates.includes(item.question)
      );

      setPreviewQuestions(filtered);

      setValidationErrors(validation);

      setDuplicateQuestions(duplicates);

      setImportedCount(0);

      setImportStats({
        total: normalized.length,
        valid: filtered.length,
        duplicates: duplicates.length,
        invalid: validation.length,
      });
    } catch (error) {
      console.log("PREVIEW ERROR:", error);

      alert(
        "Kunne ikke lage preview. Sjekk CSV/JSON-formatet."
      );
    }
  }

  async function importQuestions() {
    try {
      setLoading(true);

      if (previewQuestions.length === 0) {
        alert(
          "Ingen gyldige spørsmål å importere"
        );

        return;
      }

      const questionsToInsert =
        previewQuestions.map((item) => ({
          question: item.question,

          answers: item.answers,

          correct_answer:
            item.correct_answer,

          category: item.category,

          theory_type:
            item.theory_type,

          is_active: true,

          exam_relevant: true,
        }));

      const { error } = await supabase
        .from("questions")
        .insert(questionsToInsert);

      if (error) {
        console.log("IMPORT ERROR:", error);

        alert(
          "Kunne ikke importere spørsmål"
        );

        return;
      }

      setImportedCount(
        questionsToInsert.length
      );

      setJsonInput("");

      setPreviewQuestions([]);

      setValidationErrors([]);

      setDuplicateQuestions([]);

      setImportStats({
        total: 0,
        valid: 0,
        duplicates: 0,
        invalid: 0,
      });
    } catch (error) {
      console.log("IMPORT ERROR:", error);

      alert("Import feilet");
    } finally {
      setLoading(false);
    }
  }

  async function handleJsonPreview() {
    try {
      const parsed = JSON.parse(jsonInput);

      if (!Array.isArray(parsed)) {
        alert("JSON må være en array");
        return;
      }

      await preparePreview(parsed);
    } catch (error) {
      console.log(
        "JSON PARSE ERROR:",
        error
      );

      alert("Ugyldig JSON-format");
    }
  }

  async function handleCsvUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,

      complete: async (
        results: Papa.ParseResult<any>
      ) => {
        try {
          await preparePreview(
            results.data as any[]
          );
        } catch (error) {
          console.log(
            "CSV PARSE ERROR:",
            error
          );

          alert("Kunne ikke lese CSV");
        }
      },

      error: (error: Error) => {
        console.log("CSV ERROR:", error);

        alert("CSV-feil");
      },
    });
  }

  function clearPreview() {
    setPreviewQuestions([]);

    setValidationErrors([]);

    setDuplicateQuestions([]);

    setImportedCount(0);

    setImportStats({
      total: 0,
      valid: 0,
      duplicates: 0,
      invalid: 0,
    });
  }

  const previewCount = useMemo(
    () => previewQuestions.slice(0, 10),
    [previewQuestions]
  );

  if (checkingAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030712] text-white">
        Sjekker admin-tilgang...
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030712] text-white">
        Ingen tilgang.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#030712] px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#3EE6B0]">
            Bulk Import
          </p>

          <h1 className="mt-3 text-5xl font-black">
            Importer spørsmål
          </h1>

          <p className="mt-4 max-w-3xl text-white/60">
            Importer spørsmål via CSV eller
            JSON med theory_type-støtte.
          </p>
        </div>

        <div className="mb-8 rounded-3xl border border-[#3EE6B0]/20 bg-white/5 p-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#3EE6B0]">
            Standard teori-type
          </p>

          <select
            value={selectedTheory}
            onChange={(e) =>
              setSelectedTheory(
                e.target.value
              )
            }
            className="mt-4 w-full rounded-2xl border border-white/10 bg-[#071028] p-4 text-white outline-none"
          >
            {THEORY_TYPES.flatMap(
              (group) =>
                group.items.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label} —{" "}
                    {item.description}
                  </option>
                ))
            )}
          </select>

          <p className="mt-3 text-sm text-white/50">
            Alle importerte spørsmål får
            denne theory_type hvis CSV/JSON
            ikke inneholder feltet.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="rounded-3xl border border-[#3EE6B0]/20 bg-white/5 p-8 lg:col-span-2">
            <div className="mb-6 flex flex-wrap gap-4">
              <label className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-bold text-white/70 hover:bg-white/10">
                Last opp CSV

                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleJsonPreview}
                className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-6 py-4 font-bold text-cyan-200 hover:bg-cyan-400/20"
              >
                Preview JSON
              </button>

              <button
                onClick={clearPreview}
                className="rounded-2xl border border-red-400/20 bg-red-400/10 px-6 py-4 font-bold text-red-200 hover:bg-red-400/20"
              >
                Tøm preview
              </button>
            </div>

            <textarea
              value={jsonInput}
              onChange={(event) =>
                setJsonInput(
                  event.target.value
                )
              }
              placeholder="Lim inn JSON her..."
              className="h-[420px] w-full rounded-3xl border border-white/10 bg-[#071028] p-6 font-mono text-sm outline-none"
            />

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                {importedCount > 0 && (
                  <p className="text-lg font-bold text-[#3EE6B0]">
                    Importerte{" "}
                    {importedCount} spørsmål
                  </p>
                )}
              </div>

              <button
                onClick={importQuestions}
                disabled={
                  loading ||
                  previewQuestions.length === 0
                }
                className="rounded-2xl bg-[#3EE6B0] px-8 py-4 text-lg font-black text-[#03120F] disabled:opacity-40"
              >
                {loading
                  ? "Importerer..."
                  : `Importer ${previewQuestions.length} spørsmål`}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-black">
                Import Stats
              </h2>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span>Total</span>

                  <span className="font-black">
                    {importStats.total}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Gyldige</span>

                  <span className="font-black text-[#3EE6B0]">
                    {importStats.valid}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Duplicates</span>

                  <span className="font-black text-yellow-300">
                    {importStats.duplicates}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Invalid</span>

                  <span className="font-black text-red-300">
                    {importStats.invalid}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {previewQuestions.length > 0 && (
          <div className="mt-10 rounded-3xl border border-[#3EE6B0]/20 bg-white/5 p-8">
            <h2 className="text-3xl font-black">
              Preview
            </h2>

            <div className="mt-6 space-y-4">
              {previewCount.map(
                (item, index) => (
                  <div
                    key={`${item.question}-${index}`}
                    className="rounded-2xl border border-white/10 bg-black/20 p-5"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#3EE6B0]/10 px-3 py-1 text-xs font-bold text-[#3EE6B0]">
                        {item.theory_type}
                      </span>

                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/50">
                        {item.category ||
                          "Ingen kategori"}
                      </span>
                    </div>

                    <h3 className="mt-4 text-xl font-black">
                      {item.question}
                    </h3>

                    <div className="mt-4 grid gap-2">
                      {item.answers.map(
                        (answer) => (
                          <div
                            key={answer}
                            className={`rounded-xl border px-4 py-3 ${
                              answer ===
                              item.correct_answer
                                ? "border-[#3EE6B0]/20 bg-[#3EE6B0]/10 text-[#3EE6B0]"
                                : "border-white/10 bg-white/5"
                            }`}
                          >
                            {answer}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}