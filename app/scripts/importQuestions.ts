import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Mangler Supabase URL eller key i .env.local");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const fileArg = process.argv[2];

  if (!fileArg) {
    console.error(
      "Bruk: npx tsx ./app/scripts/importQuestions.ts ./app/data/questions/core/skilt/skilt-premium-1.json"
    );
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), fileArg);

  if (!fs.existsSync(filePath)) {
    console.error("Fant ikke fil:", filePath);
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const questions = JSON.parse(raw);

  if (!Array.isArray(questions)) {
    throw new Error("JSON må være en array med spørsmål");
  }

  console.log(`Fant ${questions.length} spørsmål. Importerer...`);

  const cleaned = questions.map((q) => ({
    question: q.question,
    answers: q.answers,
    correct_answer: q.correct_answer,
    category: q.category,
    difficulty: q.difficulty ?? 1,
    explanation: q.explanation ?? "",
    theory_type: "B",
    exam_relevant: q.exam_relevant ?? true,
    is_active: true,
    image_url: q.image_url ?? null,
  }));

  const chunkSize = 100;
  let imported = 0;

  for (let i = 0; i < cleaned.length; i += chunkSize) {
    const chunk = cleaned.slice(i, i + chunkSize);

    const { error } = await supabase.from("questions").insert(chunk);

    if (error) {
      console.error("Import feilet:", error.message);
      process.exit(1);
    }

    imported += chunk.length;
    console.log(`Importert ${imported}/${cleaned.length}`);
  }

  console.log("Ferdig!");
}

main();